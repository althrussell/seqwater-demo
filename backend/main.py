"""FastAPI entrypoint for the Seqwater AI Command Centre.

In production (Databricks Apps), the SPA build is served from
``frontend/dist`` and the API is mounted at ``/api``. In dev the frontend runs
on Vite and proxies to ``/api``.
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.routes import router as api_router
from backend.config import ROOT_DIR, get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")

app = FastAPI(
    title="Seqwater AI Command Centre",
    description=(
        "Synthetic demo API powering an executive command centre for water security, "
        "asset resilience, water quality, flood readiness, and AI decision support. "
        "All data is synthetic; this app is a Databricks demonstration."
    ),
    version="0.1.0",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.include_router(api_router, prefix="/api")


_FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    # Vite bundles JS/CSS/font chunks into dist/assets/. Mount it explicitly so
    # those URLs win against the SPA catch-all.
    app.mount(
        "/assets",
        StaticFiles(directory=_FRONTEND_DIST / "assets"),
        name="assets",
    )

    # Any other static asset in dist/ (favicon.svg, /heroes/*.jpg, /robots.txt,
    # ...) is also served as-is. Without this, /heroes/hero-01.jpg falls
    # through to the SPA catch-all and returns index.html, which is why the
    # hero appears as a grey box on the deployed app.
    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_or_static(full_path: str):  # noqa: ANN201
        if full_path.startswith("api"):
            return {"detail": "Not Found"}
        # Block path traversal and only serve files that actually exist inside
        # the dist directory.
        candidate = (_FRONTEND_DIST / full_path).resolve()
        try:
            candidate.relative_to(_FRONTEND_DIST.resolve())
        except ValueError:
            candidate = _FRONTEND_DIST  # force fall-through to index.html
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        index = _FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return {"detail": "Frontend build missing. Run `npm run build` in /frontend."}
else:

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "app": "Seqwater AI Command Centre (synthetic demo)",
            "frontend": "Run `npm install && npm run dev` in /frontend, then open http://localhost:5173",
            "api_docs": "/docs",
        }
