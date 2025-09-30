from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models import UserRole, VerificationResult
import uuid

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.POLICE

class UserResponse(UserBase):
    id: uuid.UUID
    role: UserRole
    is_approved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    is_approved: bool

# ID schemas
class IDBase(BaseModel):
    dl_code: str
    photo: Optional[str] = None
    id_metadata: Optional[Dict[str, Any]] = None

class IDCreate(IDBase):
    pass

class IDResponse(IDBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Verification schemas
class VerificationRequest(BaseModel):
    psm: Optional[int] = 6
    oem: Optional[int] = 3
    request_metadata: Optional[Dict[str, Any]] = None

class VerificationResponse(BaseModel):
    id_number: str
    verification: VerificationResult
    image_similarity: Optional[float] = None
    confidence: float
    parsed_fields: Dict[str, Any]
    errors: List[str] = []

# Log schemas
class LogBase(BaseModel):
    dl_code_checked: Optional[str] = None
    verification_result: VerificationResult
    image_similarity: Optional[float] = None
    confidence: Optional[float] = None
    parsed_fields: Optional[Dict[str, Any]] = None
    extra: Optional[Dict[str, Any]] = None

class LogCreate(LogBase):
    police_user_id: uuid.UUID

class LogResponse(LogBase):
    id: uuid.UUID
    police_user_id: uuid.UUID
    created_at: datetime
    police_user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Admin schemas
class PoliceApprovalRequest(BaseModel):
    approved: bool

class LogFilter(BaseModel):
    user_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    verification_result: Optional[VerificationResult] = None
    limit: int = 50
    offset: int = 0
