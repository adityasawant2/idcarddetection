from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    POLICE = "police"
    ADMIN = "admin"

class VerificationResult(str, enum.Enum):
    LEGIT = "LEGIT"
    FAKE = "FAKE"
    UNKNOWN = "UNKNOWN"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    name = Column(String, nullable=False)
    phone = Column(String)
    
    # Relationships
    logs = relationship("Log", back_populates="police_user")

class ID(Base):
    __tablename__ = "ids"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    dl_code = Column(String, unique=True, nullable=False, index=True)
    photo = Column(Text)  # Base64 encoded image
    id_metadata = Column(JSONB)  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    police_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    dl_code_checked = Column(String)
    verification_result = Column(SQLEnum(VerificationResult), nullable=False)
    image_similarity = Column(Float)
    confidence = Column(Float)
    image_url_or_blob = Column(Text)  # Optional image storage
    parsed_fields = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    extra = Column(JSONB)
    
    # Relationships
    police_user = relationship("User", back_populates="logs")
