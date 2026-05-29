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
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa_index(full_path: str):  # noqa: ANN201
        if full_path.startswith("api"):
            return {"detail": "Not Found"}
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
