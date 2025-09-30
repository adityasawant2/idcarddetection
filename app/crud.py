from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
import uuid
from app.models import User, ID, Log, UserRole, VerificationResult
from app.schemas import UserCreate, IDCreate, LogCreate, LogFilter
import hashlib
import secrets

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Simple SHA-256 with salt for now (not production-ready, but works for testing)
    try:
        salt, hash_part = hashed_password.split(':')
        return hashlib.sha256((plain_password + salt).encode()).hexdigest() == hash_part
    except:
        return False

def get_password_hash(password: str) -> str:
    # Simple SHA-256 with salt (not production-ready, but works for testing)
    salt = secrets.token_hex(16)
    hash_part = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hash_part}"

# User CRUD
def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        name=user.name,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    print(f"Authenticating user: {email}")
    user = get_user_by_email(db, email)
    if not user:
        print(f"User not found: {email}")
        return None
    
    print(f"User found: {user.email}, role: {user.role}, approved: {user.is_approved}")
    print(f"Stored password hash: {user.password_hash[:50]}...")
    
    password_valid = verify_password(password, user.password_hash)
    print(f"Password valid: {password_valid}")
    
    if not password_valid:
        print(f"Password verification failed for user: {email}")
        return None
    return user

def get_unapproved_police(db: Session) -> List[User]:
    return db.query(User).filter(
        and_(User.role == UserRole.POLICE, User.is_approved == False)
    ).all()

def approve_police_user(db: Session, user_id: str) -> Optional[User]:
    user = get_user(db, user_id)
    if user and user.role == UserRole.POLICE:
        user.is_approved = True
        db.commit()
        db.refresh(user)
    return user

# ID CRUD
def get_id_by_dl_code(db: Session, dl_code: str) -> Optional[ID]:
    return db.query(ID).filter(ID.dl_code == dl_code).first()

def create_id(db: Session, id_data: IDCreate) -> ID:
    db_id = ID(**id_data.dict())
    db.add(db_id)
    db.commit()
    db.refresh(db_id)
    return db_id

def check_id_in_database(db: Session, dl_code: str) -> bool:
    return get_id_by_dl_code(db, dl_code) is not None

# Log CRUD
def create_log(db: Session, log: LogCreate) -> Log:
    db_log = Log(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_logs(db: Session, filter_params: LogFilter) -> List[Log]:
    query = db.query(Log)
    
    if filter_params.user_id:
        query = query.filter(Log.police_user_id == filter_params.user_id)
    
    if filter_params.start_date:
        query = query.filter(Log.created_at >= filter_params.start_date)
    
    if filter_params.end_date:
        query = query.filter(Log.created_at <= filter_params.end_date)
    
    if filter_params.verification_result:
        query = query.filter(Log.verification_result == filter_params.verification_result)
    
    return query.offset(filter_params.offset).limit(filter_params.limit).all()

def get_user_logs(db: Session, user_id: str, limit: int = 50, offset: int = 0) -> List[Log]:
    return db.query(Log).filter(
        Log.police_user_id == user_id
    ).offset(offset).limit(limit).all()
