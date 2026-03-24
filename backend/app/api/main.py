from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, crops, users, sensors, insights
from app.core.config import settings
from app.middleware.cors import setup_cors
import os

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
setup_cors(app)

# Ensure uploads directory exists for StaticFiles mounting
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(crops.router, prefix="/api/crops", tags=["crops"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["sensors"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Agriculture Portal API"}
