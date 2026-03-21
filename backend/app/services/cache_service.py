import json, pickle, logging
from typing import Any, Optional
from app.core.config import settings
logger = logging.getLogger(__name__)
redis_client = None
try:
    import redis as redis_lib
    redis_client = redis_lib.Redis(host=getattr(settings,'REDIS_HOST','localhost'),port=getattr(settings,'REDIS_PORT',6379),db=getattr(settings,'REDIS_DB',0),password=getattr(settings,'REDIS_PASSWORD',None),decode_responses=False)
    redis_client.ping()
except Exception as e:
    logger.warning(f"Redis unavailable: {e}")
    redis_client = None
def cache_get(key: str) -> Optional[Any]:
    if not redis_client: return None
    try:
        d = redis_client.get(key)
        return pickle.loads(d) if d else None
    except: return None
def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    if not redis_client: return False
    try: redis_client.setex(key, ttl or 300, pickle.dumps(value)); return True
    except: return False
def cache_delete(key: str) -> bool:
    if not redis_client: return False
    try: redis_client.delete(key); return True
    except: return False
def cache_delete_pattern(pattern: str) -> int:
    if not redis_client: return 0
    try:
        keys = redis_client.keys(pattern)
        return redis_client.delete(*keys) if keys else 0
    except: return 0
def cache_exists(key: str) -> bool:
    if not redis_client: return False
    try: return redis_client.exists(key) > 0
    except: return False
def cache_health_check() -> bool:
    if not redis_client: return False
    try: redis_client.ping(); return True
    except: return False
def cache_info() -> dict:
    return {"status": "available"} if redis_client else {"status": "unavailable"}
