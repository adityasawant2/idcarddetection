from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.database import get_db
from app.models import User, UserRole
from app.config import settings
from app import crud

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    print(f"[Auth] Validating token: {credentials.credentials[:20]}...")
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        print(f"[Auth] Token payload user_id: {user_id}")
        if user_id is None:
            print("[Auth] No user_id in token")
            raise credentials_exception
    except JWTError as e:
        print(f"[Auth] JWT decode error: {e}")
        raise credentials_exception
    
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        print(f"[Auth] User not found: {user_id}")
        raise credentials_exception
    
    print(f"[Auth] User found: {user.email}, role: {user.role}, approved: {user.is_approved}")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not approved"
        )
    return current_user

def require_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def get_police_user(current_user: User = Depends(require_role(UserRole.POLICE))) -> User:
    print(f"Police user check: {current_user.email}, role: {current_user.role}, approved: {current_user.is_approved}")
    return current_user

def get_admin_user(current_user: User = Depends(require_role(UserRole.ADMIN))) -> User:
    return current_user
