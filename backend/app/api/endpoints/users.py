import os
import math
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime
from app.mongo import user_profiles_collection, farms_collection
from app.schemas_users import UserProfile, FarmInfo
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import uuid

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user_email(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")

@router.get("/profile")
def get_user_profile(current_user_email: str = Depends(get_current_user_email)):
    profile = user_profiles_collection.find_one({"user_email": current_user_email})
    farm = farms_collection.find_one({"user_email": current_user_email})
    
    if not profile or not farm:
        raise HTTPException(status_code=404, detail="Profile setup required")
        
    profile["_id"] = str(profile["_id"])
    farm["_id"] = str(farm["_id"])
    return {"profile": profile, "farm": farm}

@router.post("/setup")
def setup_user_profile(
    username: str = Form(...),
    total_plots: int = Form(...),
    current_user_email: str = Depends(get_current_user_email)
):
    if user_profiles_collection.find_one({"user_email": current_user_email}):
        raise HTTPException(status_code=400, detail="Profile already set up")
        
    calc_cols = math.ceil(math.sqrt(total_plots))
    calc_rows = math.ceil(total_plots / calc_cols) if calc_cols > 0 else 0

    profile_doc = {
        "user_email": current_user_email,
        "username": username,
        "avatar_url": None,
        "created_at": datetime.utcnow()
    }
    farm_doc = {
        "user_email": current_user_email,
        "total_plots": total_plots,
        "rows": calc_rows,
        "cols": calc_cols,
        "created_at": datetime.utcnow()
    }
    
    user_profiles_collection.insert_one(profile_doc)
    farms_collection.insert_one(farm_doc)
    
    return {"message": "Setup complete"}

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user_email: str = Depends(get_current_user_email)
):
    profile = user_profiles_collection.find_one({"user_email": current_user_email})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    # We determine network URL (Since its local for now, let's just point to localhost:8000)
    # Ideally should be a relative URL like /uploads/filename that the frontend accesses using API_URL 
    avatar_url = f"{settings.BACKEND_BASE_URL}/uploads/{filename}"
    user_profiles_collection.update_one(
        {"user_email": current_user_email},
        {"$set": {"avatar_url": avatar_url}}
    )
    
    return {"avatar_url": avatar_url}

@router.put("/profile")
def update_profile(
    username: str = Form(None),
    total_plots: int = Form(None),
    current_user_email: str = Depends(get_current_user_email)
):
    profile = user_profiles_collection.find_one({"user_email": current_user_email})
    farm = farms_collection.find_one({"user_email": current_user_email})
    
    if not profile or not farm:
        raise HTTPException(status_code=404, detail="Profile not found")

    if username:
        user_profiles_collection.update_one(
            {"user_email": current_user_email},
            {"$set": {"username": username}}
        )
        
    if total_plots:
        calc_cols = math.ceil(math.sqrt(total_plots))
        calc_rows = math.ceil(total_plots / calc_cols) if calc_cols > 0 else 0
        
        farms_collection.update_one(
            {"user_email": current_user_email},
            {"$set": {
                "total_plots": total_plots,
                "rows": calc_rows,
                "cols": calc_cols
            }}
        )
    
    return {"message": "Profile updated"}
