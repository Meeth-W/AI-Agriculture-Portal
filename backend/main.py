import uvicorn
from app.database import engine, Base
from app.core.config import settings
import app.models  # Important: Must import models to register tables

Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    uvicorn.run(
        "app.api.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG,
    )
