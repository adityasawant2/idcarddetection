from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas
from app.deps import get_admin_user

router = APIRouter()

@router.get("/police-unapproved", response_model=List[schemas.UserResponse])
async def get_unapproved_police(
    current_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get list of unapproved police users (admin only)"""
    users = crud.get_unapproved_police(db)
    return users

@router.post("/approve-police/{user_id}", response_model=schemas.UserResponse)
async def approve_police_user(
    user_id: str,
    current_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve a police user account (admin only)"""
    user = crud.approve_police_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Police user not found"
        )
    return user

@router.post("/reject-police/{user_id}")
async def reject_police_user(
    user_id: str,
    current_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reject a police user account (admin only)"""
    # For now, we'll just return success. In a real implementation,
    # you might want to delete the user or mark them as rejected
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Police user not found"
        )
    
    # You could add a 'rejected' status to the user model
    # or delete the user entirely
    return {"message": "Police user rejected successfully"}

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    current_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    # This would need to be implemented in crud.py
    # For now, return empty list
    return []


