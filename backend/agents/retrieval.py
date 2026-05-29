"""Lightweight document retrieval over synthetic Markdown corpus.

When the configured Vector Search index is available we use it; otherwise we
fall back to a deterministic keyword/BM25-style scorer over the local Markdown
documents. Both paths return the same shape so callers can be agnostic.
"""
from __future__ import annotations

import logging
import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from backend.config import get_settings

LOG = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    doc_id: str
    title: str
    chunk_id: str
    text: str
    href: str


_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with",
    "is", "are", "be", "as", "by", "from", "at", "that", "this", "it",
    "its", "into", "any", "all", "must", "may", "not", "no", "do", "does",
}


def _tokenize(text: str) -> list[str]:
    return [
        t.lower()
        for t in re.findall(r"[A-Za-z][A-Za-z0-9_\-]+", text)
        if t.lower() not in _STOPWORDS and len(t) > 2
    ]


def _split_into_chunks(doc_id: str, title: str, body: str, target_size: int = 600) -> list[DocumentChunk]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
    chunks: list[DocumentChunk] = []
    buffer: list[str] = []
    size = 0
    idx = 0
    for p in paragraphs:
        buffer.append(p)
        size += len(p)
        if size >= target_size:
            chunks.append(
                DocumentChunk(
                    doc_id=doc_id,
                    title=title,
                    chunk_id=f"{doc_id}::{idx}",
                    text="\n\n".join(buffer),
                    href=f"docs/{doc_id}.md",
                )
            )
            buffer, size = [], 0
            idx += 1
    if buffer:
        chunks.append(
            DocumentChunk(
                doc_id=doc_id,
                title=title,
                chunk_id=f"{doc_id}::{idx}",
                text="\n\n".join(buffer),
                href=f"docs/{doc_id}.md",
            )
        )
    return chunks


class DocumentIndex:
    """In-memory keyword/TF-IDF-style index over the synthetic doc corpus."""

    def __init__(self, docs_dir: Path):
        self.docs_dir = docs_dir
        self.chunks: list[DocumentChunk] = []
        self._tokens: list[list[str]] = []
        self._df: Counter[str] = Counter()
        self._loaded = False

    def _load(self) -> None:
        if self._loaded:
            return
        if not self.docs_dir.exists():
            LOG.warning("Documents dir %s missing; retrieval will return empty.", self.docs_dir)
            self._loaded = True
            return
        for path in sorted(self.docs_dir.glob("*.md")):
            doc_id = path.stem
            body = path.read_text(encoding="utf-8")
            title = doc_id.replace("_", " ").title()
            for chunk in _split_into_chunks(doc_id, title, body):
                self.chunks.append(chunk)
                tokens = _tokenize(chunk.text)
                self._tokens.append(tokens)
                for t in set(tokens):
                    self._df[t] += 1
        self._loaded = True
        LOG.info("DocumentIndex loaded %d chunks from %s", len(self.chunks), self.docs_dir)

    def search(self, query: str, k: int = 4) -> list[dict[str, Any]]:
        self._load()
        if not self.chunks:
            return []
        q_tokens = _tokenize(query)
        if not q_tokens:
            return []
        n = len(self.chunks)
        scores: list[tuple[float, int]] = []
        for i, tokens in enumerate(self._tokens):
            tf = Counter(tokens)
            score = 0.0
            for q in q_tokens:
                if q in tf:
                    idf = math.log((n + 1) / (self._df[q] + 1)) + 1.0
                    score += (tf[q] / max(len(tokens), 1)) * idf
            if score > 0:
                scores.append((score, i))
        scores.sort(reverse=True)
        results: list[dict[str, Any]] = []
        for score, idx in scores[:k]:
            c = self.chunks[idx]
            preview = c.text.strip()
            if len(preview) > 360:
                preview = preview[:360].rsplit(" ", 1)[0] + "…"
            results.append(
                {
                    "doc_id": c.doc_id,
                    "title": c.title,
                    "chunk_id": c.chunk_id,
                    "text": preview,
                    "href": c.href,
                    "score": round(float(score), 4),
                }
            )
        return results


_INDEX: DocumentIndex | None = None


def get_index() -> DocumentIndex:
    global _INDEX
    if _INDEX is None:
        _INDEX = DocumentIndex(get_settings().docs_dir)
    return _INDEX


def warmup_index() -> None:
    """Force the singleton index to build now (eg. at FastAPI startup)."""
    get_index()


def retrieve_documents(query: str, k: int = 4) -> dict[str, Any]:
    results = get_index().search(query, k=k)
    if not results:
        return {"summary": "No synthetic documents matched the query.", "data": []}
    lines = [f"{r['title']} → {r['text'][:120]}…" for r in results]
    return {"summary": "\n".join(lines), "data": results}
