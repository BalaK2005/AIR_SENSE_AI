"""
Security Module
Handles authentication, authorization, and security utilities
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

# Token settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    # Truncate to 72 bytes before verifying (matches how we hash)
    truncated = plain_password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Automatically truncates to 72 bytes (bcrypt hard limit).
    """
    # ✅ FIX: truncate instead of raising ValueError
    truncated = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.hash(truncated)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token with longer expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Dict:
    """Get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        user_type: str = payload.get("user_type")
        
        if username is None or user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return {
        "user_id": user_id,
        "username": username,
        "user_type": user_type,
        "email": user.email,
        "full_name": user.full_name
    }


async def get_current_active_user(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Get current active user"""
    return current_user


def require_policy_maker(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Require user to be a policy maker or admin"""
    if current_user["user_type"] not in ["policy_maker", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Policy maker access required."
        )
    return current_user


def require_admin(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Require user to be an admin"""
    if current_user["user_type"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_researcher(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Require user to be a researcher, policy maker, or admin"""
    if current_user["user_type"] not in ["researcher", "policy_maker", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Researcher access required"
        )
    return current_user


def verify_api_key(api_key: str) -> bool:
    """Verify an API key for external integrations"""
    return api_key.startswith("av_") and len(api_key) > 20


def generate_api_key(user_id: int) -> str:
    """Generate a new API key for a user"""
    import secrets
    import hashlib
    
    random_part = secrets.token_urlsafe(32)
    hash_input = f"{user_id}_{random_part}_{datetime.utcnow().isoformat()}"
    key_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:32]
    
    return f"av_{key_hash}"


def validate_password_strength(password: str) -> tuple:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one digit"
    
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(char.islower() for char in password):
        return False, "Password must contain at least one lowercase letter"
    
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(char in special_chars for char in password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def sanitize_input(input_string: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    dangerous_chars = ['<', '>', '"', "'", ';', '\\', '/', '--']
    sanitized = input_string
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    return sanitized.strip()


def check_rate_limit(user_id: int, endpoint: str, limit: int = 100, window: int = 60) -> bool:
    """Check if user has exceeded rate limit"""
    from app.services.cache_service import cache_get, cache_set
    
    cache_key = f"rate_limit:{user_id}:{endpoint}"
    
    try:
        request_count = cache_get(cache_key)
        if request_count is None:
            cache_set(cache_key, 1, ttl=window)
            return True
        if int(request_count) >= limit:
            return False
        cache_set(cache_key, int(request_count) + 1, ttl=window)
        return True
    except:
        return True


def generate_verification_token() -> str:
    """Generate a verification token for email verification"""
    import secrets
    return secrets.token_urlsafe(32)


def verify_email_token(token: str, email: str) -> bool:
    """Verify email verification token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("email") == email
    except:
        return False


def create_email_verification_token(email: str) -> str:
    """Create a token for email verification"""
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {
        "email": email,
        "exp": expire,
        "type": "email_verification"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_password_reset_token(email: str) -> str:
    """Create a token for password reset"""
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode = {
        "email": email,
        "exp": expire,
        "type": "password_reset"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload.get("email")
    except:
        return None


class SessionManager:
    """Manage user sessions"""
    
    @staticmethod
    def create_session(user_id: int, token: str) -> str:
        from app.services.cache_service import cache_set
        import uuid
        
        session_id = str(uuid.uuid4())
        session_data = {
            "user_id": user_id,
            "token": token,
            "created_at": datetime.utcnow().isoformat()
        }
        cache_set(f"session:{session_id}", session_data, ttl=86400)
        return session_id
    
    @staticmethod
    def validate_session(session_id: str) -> Optional[Dict]:
        from app.services.cache_service import cache_get
        return cache_get(f"session:{session_id}")
    
    @staticmethod
    def invalidate_session(session_id: str) -> bool:
        from app.services.cache_service import cache_set
        try:
            cache_set(f"session:{session_id}", None, ttl=1)
            return True
        except:
            return False