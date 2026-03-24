from pymongo import MongoClient
from app.core.config import settings

# Initialize MongoDB Client
mongo_client = MongoClient(settings.MONGO_URL)

# Database
mongo_db = mongo_client[settings.MONGO_DB_NAME]

# Collections
crop_collection = mongo_db["crop_data"]
user_profiles_collection = mongo_db["user_profiles"]
farms_collection = mongo_db["farms"]
