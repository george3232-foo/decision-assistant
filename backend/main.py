"""Decision Assistant — FastAPI Backend."""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend dir to path so imports work
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from api.routes import router

app = FastAPI(
    title="Decision Assistant",
    version="1.0.0",
    description="AI-powered structured reasoning platform",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve static frontend
static_dir = Path(__file__).parent / "static"


@app.get("/")
async def root():
    return FileResponse(static_dir / "index.html")


@app.get("/health")
async def health():
    return {"status": "healthy"}
