from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from bson.objectid import ObjectId
from app.mongo import crop_collection
from app.schemas_mongo import CropData, CropDataCreate
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user_email(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")

@router.post("/", response_model=CropData)
def create_crop_data(crop_in: CropDataCreate, current_user_email: str = Depends(get_current_user_email)):
    new_crop = crop_in.model_dump()
    new_crop["user_email"] = current_user_email
    new_crop["created_at"] = datetime.utcnow()
    new_crop["is_active"] = True
    
    result = crop_collection.insert_one(new_crop)
    
    return CropData(
        id=str(result.inserted_id),
        **new_crop
    )

@router.get("/", response_model=List[CropData])
def read_crop_data(current_user_email: str = Depends(get_current_user_email)):
    cursor = crop_collection.find({"user_email": current_user_email}).sort("created_at", -1)
    results = []
    
    from app.core.knowledge_base import analyze_crop_performance
    
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.setdefault("is_active", True)
        
        if doc.get("is_active"):
            analytics_payload = analyze_crop_performance(
                crop_type=doc.get("crop_type"),
                n=doc.get("nitrogen_n", 0),
                p=doc.get("phosphorus_p", 0),
                k=doc.get("potassium_k", 0),
                temp=doc.get("temperature", 0),
                hum=doc.get("humidity", 0),
                ph=doc.get("ph_level", 7.0),
                created_at=doc.get("created_at")
            )
            doc["analytics"] = analytics_payload
        else:
            doc["analytics"] = None
            
        results.append(CropData(**doc))
    return results

@router.put("/{crop_id}/clear")
def clear_plot(crop_id: str, current_user_email: str = Depends(get_current_user_email)):
    result = crop_collection.update_one(
        {"_id": ObjectId(crop_id), "user_email": current_user_email},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Crop not found")
    return {"message": "Plot cleared"}

@router.delete("/history")
def clear_history(current_user_email: str = Depends(get_current_user_email)):
    crop_collection.delete_many({"user_email": current_user_email})
    return {"message": "History cleared"}
