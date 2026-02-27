"""
Cache Service
Handles Redis caching operations for improved performance
"""

import redis
import json
import pickle
from typing import Any, Optional
from datetime import timedelta
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis connection
try:
    if settings.REDIS_URL:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=False
        )
    else:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=False
        )
    
    # Test connection
    redis_client.ping()
    logger.info("Redis connection established successfully")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}. Caching will be disabled.")
    redis_client = None


def cache_get(key: str) -> Optional[Any]:
    """
    Get value from cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None if not found
    """
    if not redis_client:
        return None
    
    try:
        cached_data = redis_client.get(key)
        if cached_data:
            # Try to unpickle, fallback to JSON decode
            try:
                return pickle.loads(cached_data)
            except:
                try:
                    return json.loads(cached_data.decode('utf-8'))
                except:
                    return cached_data.decode('utf-8')
        return None
    except Exception as e:
        logger.error(f"Error getting cache for key {key}: {e}")
        return None


def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """
    Set value in cache
    
    Args:
        key: Cache key
        value: Value to cache
        ttl: Time to live in seconds (default from settings)
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        if ttl is None:
            ttl = settings.CACHE_TTL
        
        # Try to pickle, fallback to JSON
        try:
            serialized_value = pickle.dumps(value)
        except:
            try:
                serialized_value = json.dumps(value).encode('utf-8')
            except:
                serialized_value = str(value).encode('utf-8')
        
        redis_client.setex(key, ttl, serialized_value)
        return True
    except Exception as e:
        logger.error(f"Error setting cache for key {key}: {e}")
        return False


def cache_delete(key: str) -> bool:
    """
    Delete key from cache
    
    Args:
        key: Cache key to delete
        
    Returns:
        True if deleted, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Error deleting cache key {key}: {e}")
        return False


def cache_delete_pattern(pattern: str) -> int:
    """
    Delete all keys matching pattern
    
    Args:
        pattern: Pattern to match (e.g., "user:*")
        
    Returns:
        Number of keys deleted
    """
    if not redis_client:
        return 0
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        logger.error(f"Error deleting cache pattern {pattern}: {e}")
        return 0


def cache_exists(key: str) -> bool:
    """
    Check if key exists in cache
    
    Args:
        key: Cache key
        
    Returns:
        True if exists, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        return redis_client.exists(key) > 0
    except Exception as e:
        logger.error(f"Error checking cache existence for key {key}: {e}")
        return False


def cache_ttl(key: str) -> int:
    """
    Get remaining TTL for key
    
    Args:
        key: Cache key
        
    Returns:
        TTL in seconds, -1 if no expiry, -2 if key doesn't exist
    """
    if not redis_client:
        return -2
    
    try:
        return redis_client.ttl(key)
    except Exception as e:
        logger.error(f"Error getting TTL for key {key}: {e}")
        return -2


def cache_increment(key: str, amount: int = 1) -> Optional[int]:
    """
    Increment numeric value in cache
    
    Args:
        key: Cache key
        amount: Amount to increment by
        
    Returns:
        New value or None on error
    """
    if not redis_client:
        return None
    
    try:
        return redis_client.incrby(key, amount)
    except Exception as e:
        logger.error(f"Error incrementing cache key {key}: {e}")
        return None


def cache_decrement(key: str, amount: int = 1) -> Optional[int]:
    """
    Decrement numeric value in cache
    
    Args:
        key: Cache key
        amount: Amount to decrement by
        
    Returns:
        New value or None on error
    """
    if not redis_client:
        return None
    
    try:
        return redis_client.decrby(key, amount)
    except Exception as e:
        logger.error(f"Error decrementing cache key {key}: {e}")
        return None


def cache_expire(key: str, ttl: int) -> bool:
    """
    Set expiration time for existing key
    
    Args:
        key: Cache key
        ttl: Time to live in seconds
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        return redis_client.expire(key, ttl)
    except Exception as e:
        logger.error(f"Error setting expiration for key {key}: {e}")
        return False


def cache_get_many(keys: list) -> dict:
    """
    Get multiple values from cache
    
    Args:
        keys: List of cache keys
        
    Returns:
        Dictionary of key-value pairs
    """
    if not redis_client:
        return {}
    
    try:
        values = redis_client.mget(keys)
        result = {}
        
        for key, value in zip(keys, values):
            if value:
                try:
                    result[key] = pickle.loads(value)
                except:
                    try:
                        result[key] = json.loads(value.decode('utf-8'))
                    except:
                        result[key] = value.decode('utf-8')
        
        return result
    except Exception as e:
        logger.error(f"Error getting multiple cache keys: {e}")
        return {}


def cache_set_many(data: dict, ttl: Optional[int] = None) -> bool:
    """
    Set multiple values in cache
    
    Args:
        data: Dictionary of key-value pairs
        ttl: Time to live in seconds
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        if ttl is None:
            ttl = settings.CACHE_TTL
        
        pipeline = redis_client.pipeline()
        
        for key, value in data.items():
            try:
                serialized_value = pickle.dumps(value)
            except:
                try:
                    serialized_value = json.dumps(value).encode('utf-8')
                except:
                    serialized_value = str(value).encode('utf-8')
            
            pipeline.setex(key, ttl, serialized_value)
        
        pipeline.execute()
        return True
    except Exception as e:
        logger.error(f"Error setting multiple cache keys: {e}")
        return False


def cache_clear() -> bool:
    """
    Clear all cache (use with caution!)
    
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        redis_client.flushdb()
        logger.warning("Cache cleared!")
        return True
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return False


def cache_info() -> dict:
    """
    Get cache information and statistics
    
    Returns:
        Dictionary with cache stats
    """
    if not redis_client:
        return {"status": "unavailable"}
    
    try:
        info = redis_client.info()
        
        return {
            "status": "available",
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "total_commands_processed": info.get("total_commands_processed"),
            "keyspace_hits": info.get("keyspace_hits"),
            "keyspace_misses": info.get("keyspace_misses"),
            "uptime_in_seconds": info.get("uptime_in_seconds"),
            "db_keys": redis_client.dbsize()
        }
    except Exception as e:
        logger.error(f"Error getting cache info: {e}")
        return {"status": "error", "message": str(e)}


# Cache decorator
def cached(ttl: Optional[int] = None, key_prefix: str = ""):
    """
    Decorator to cache function results
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        
    Usage:
        @cached(ttl=300, key_prefix="aqi")
        def get_aqi_data(station_id):
            return expensive_operation(station_id)
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_result = cache_get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache the result
            cache_set(cache_key, result, ttl)
            logger.debug(f"Cached result for {cache_key}")
            
            return result
        
        return wrapper
    return decorator


# Context manager for temporary cache
class TemporaryCache:
    """
    Context manager for temporary cache that auto-deletes on exit
    
    Usage:
        with TemporaryCache("temp_key", value, ttl=60):
            # Do something
            pass
        # Cache key is automatically deleted
    """
    
    def __init__(self, key: str, value: Any, ttl: int = 300):
        self.key = key
        self.value = value
        self.ttl = ttl
    
    def __enter__(self):
        cache_set(self.key, self.value, self.ttl)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        cache_delete(self.key)


# Health check
def cache_health_check() -> bool:
    """
    Check if cache is healthy
    
    Returns:
        True if healthy, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        redis_client.ping()
        return True
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return False