"""Wrapper for the Databricks Foundation Model API (OpenAI-compatible).

Used only when ``APP_MODE=databricks``. Falls back gracefully in local mode.

Authentication strategy:
  * Inside Databricks Apps the runtime injects ``DATABRICKS_HOST`` and OAuth
    M2M credentials. We use the Databricks SDK's ``Config`` to resolve those.
  * Locally we honour an explicit ``DATABRICKS_TOKEN`` from .env, or a CLI
    profile via ``DATABRICKS_CONFIG_PROFILE``.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from backend.config import get_settings

LOG = logging.getLogger(__name__)


def _resolve_auth() -> tuple[str | None, dict[str, str] | None]:
    """Return (host, headers) ready for an HTTP call, or (None, None)."""
    s = get_settings()
    try:
        from databricks.sdk.core import Config  # type: ignore
    except ImportError:  # pragma: no cover
        if s.databricks_host and s.databricks_token:
            return s.databricks_host.rstrip("/"), {
                "Authorization": f"Bearer {s.databricks_token}",
                "Content-Type": "application/json",
            }
        return None, None

    try:
        cfg = Config(host=s.databricks_host, token=s.databricks_token)
    except Exception as exc:  # pragma: no cover
        LOG.warning("Could not build Databricks SDK Config: %s", exc)
        return None, None

    host = (cfg.host or s.databricks_host or "").rstrip("/")
    if not host:
        return None, None
    headers: dict[str, str] = {"Content-Type": "application/json"}
    try:
        auth_headers = cfg.authenticate()
    except Exception as exc:  # pragma: no cover — auth guard
        LOG.warning("Could not authenticate Databricks SDK Config: %s", exc)
        return None, None
    headers.update(auth_headers)
    return host, headers


def call_foundation_model(*, system: str, user: str) -> str | None:
    """Call the Databricks Foundation Model API and return the text content.

    Returns ``None`` if the call cannot be made or fails. Callers should
    fall back to deterministic mock output.
    """
    s = get_settings()
    host, headers = _resolve_auth()
    if not host or not headers:
        return None
    url = f"{host}/serving-endpoints/{s.databricks_llm_endpoint}/invocations"
    body: dict[str, Any] = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": s.databricks_llm_temperature,
        "max_tokens": s.databricks_llm_max_tokens,
    }
    try:
        with httpx.Client(timeout=45) as client:
            response = client.post(url, headers=headers, json=body)
            response.raise_for_status()
            payload = response.json()
        choices = payload.get("choices") or []
        if choices and "message" in choices[0]:
            content = choices[0]["message"].get("content")
            return _flatten_content(content)
        preds = payload.get("predictions", [None])
        return _flatten_content(preds[0]) if preds else None
    except Exception as exc:  # pragma: no cover — network guard
        LOG.warning("Foundation Model API call to %s failed: %s", s.databricks_llm_endpoint, exc)
        return None


def _flatten_content(content: Any) -> str | None:
    """Coerce the various OpenAI-style ``content`` shapes to a string."""
    if content is None:
        return None
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        # OpenAI-style structured content blocks: [{type:"text", text:"..."}, ...]
        chunks: list[str] = []
        for item in content:
            if isinstance(item, dict):
                if "text" in item:
                    chunks.append(str(item["text"]))
                elif "content" in item:
                    chunks.append(str(item["content"]))
            elif isinstance(item, str):
                chunks.append(item)
        return "\n".join(c for c in chunks if c)
    return str(content)
