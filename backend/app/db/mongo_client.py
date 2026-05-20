from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()

_client = None

def get_mongo_db():
    global _client
    if _client is None:
        _client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/travelia_nosql"))
    return _client.get_default_database()
