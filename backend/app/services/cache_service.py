"""
Cache Service - Graceful Redis fallback
"""
import json
import pickle
from typing import Any, Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import redis as redis_lib
    _r = redis_lib.Redis(
        host=getattr(settings, 'REDIS_HOST', 'localhost'),
        port=getattr(settings, 'REDIS_PORT', 6379),
        db=getattr(settings, 'REDIS_DB', 0),
        password=getattr(settings, 'REDIS_PASSWORD', None),
        decode_responses=False
    )
    _r.ping()
    redis_client = _r
    logger.info("Redis connected")
except Exception as e:
    logger.warning(f"Redis unavailable: {e}. Caching disabled.")
    redis_client = None

def cache_get(key: str) -> Optional[Any]:
    if not redis_client: return None
    try:
        data = redis_client.get(key)
        return pickle.loads(data) if data else None
    except Exception:
        return None

def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    if not redis_client: return False
    try:
        redis_client.setex(key, ttl or 300, pickle.dumps(value))
        return True
    except Exception:
        return False

def cache_delete(key: str) -> bool:
    if not redis_client: return False
    try:
        redis_client.delete(key)
        return True
    except Exception:
        return False

def cache_delete_pattern(pattern: str) -> int:
    if not redis_client: return 0
    try:
        keys = redis_client.keys(pattern)
        return redis_client.delete(*keys) if keys else 0
    except Exception:
        return 0

def cache_exists(key: str) -> bool:
    if not redis_client: return False
    try: return redis_client.exists(key) > 0
    except Exception: return False

def cache_health_check() -> bool:
    if not redis_client: return False
    try: redis_client.ping(); return True
    except Exception: return False

def cache_info() -> dict:
    if not redis_client: return {"status": "unavailable"}
    try: return {"status": "available"}
    except Exception: return {"status": "error"}
