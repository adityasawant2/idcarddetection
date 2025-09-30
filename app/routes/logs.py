from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app import crud, schemas
from app.deps import get_police_user, get_admin_user
from app.models import VerificationResult

router = APIRouter()

@router.get("/", response_model=List[schemas.LogResponse])
async def get_logs(
    user_id: Optional[str] = Query(None, description="Filter by police user ID (admin only)"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    verification_result: Optional[VerificationResult] = Query(None, description="Filter by verification result"),
    limit: int = Query(50, ge=1, le=100, description="Number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip"),
    current_user = Depends(get_police_user),  # This will be overridden for admin
    db: Session = Depends(get_db)
):
    """Get verification logs"""
    
    # Check if user is admin (can see all logs) or police (own logs only)
    if current_user.role.value == "admin":
        # Admin can see all logs with filters
        filter_params = schemas.LogFilter(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            verification_result=verification_result,
            limit=limit,
            offset=offset
        )
        logs = crud.get_logs(db, filter_params)
    else:
        # Police users can only see their own logs
        logs = crud.get_user_logs(db, str(current_user.id), limit, offset)
    
    return logs

@router.get("/admin", response_model=List[schemas.LogResponse])
async def get_admin_logs(
    user_id: Optional[str] = Query(None, description="Filter by police user ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    verification_result: Optional[VerificationResult] = Query(None, description="Filter by verification result"),
    limit: int = Query(50, ge=1, le=100, description="Number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip"),
    current_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all verification logs (admin only)"""
    
    filter_params = schemas.LogFilter(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        verification_result=verification_result,
        limit=limit,
        offset=offset
    )
    
    logs = crud.get_logs(db, filter_params)
    return logs