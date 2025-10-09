from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from contextlib import asynccontextmanager

from app.routes import auth, verify, logs, admin
from app.database import engine, Base
from app.utils.ml import load_face_model
from app.config import settings

# Global variables for ML models
face_model = None
face_processor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Load ML models
    global face_model, face_processor
    if settings.ML_AVAILABLE:
        try:
            face_model, face_processor = await load_face_model()
            print("Face model loaded successfully")
        except Exception as e:
            print(f"Failed to load face model: {e}")
            settings.ML_AVAILABLE = False
    
    yield
    
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="ID Verification API",
    description="Police ID verification system with OCR and face matching",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
# Explicitly allow common Expo web dev origins to satisfy browser CORS
explicit_origins = settings.ALLOWED_ORIGINS or [
    "http://localhost:8081",  # Expo web (metro) default
    "http://127.0.0.1:8081",
    "http://localhost:19006",  # Expo web dev
    "http://localhost:19007",
    "http://127.0.0.1:19006",
    "http://127.0.0.1:19007",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=explicit_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(verify.router, prefix="/verify", tags=["verification"])
app.include_router(logs.router, prefix="/logs", tags=["logs"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "ID Verification API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ml_available": settings.ML_AVAILABLE,
        "database": "connected"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
