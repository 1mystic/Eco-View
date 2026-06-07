from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..database.connection import init_db
from .routes import incidents, stats, inference, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="EcoView API",
    version="1.0.0",
    description="Environmental Hazard Intelligence Platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://ecoview.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(inference.router, prefix="/inference", tags=["inference"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ecoview-api", "version": "1.0.0"}
