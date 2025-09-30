#!/usr/bin/env python3
"""
Database initialization script
Creates tables and optionally creates an admin user
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, engine
from app.models import User, ID, UserRole
from app.crud import create_user, get_user_by_email
from app.schemas import UserCreate
from app.config import settings

def init_database():
    """Initialize database with tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def create_admin_user():
    """Create initial admin user"""
    print("Creating admin user...")
    
    # Create database session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = get_user_by_email(db, settings.ADMIN_INIT_EMAIL)
        if admin_user:
            print(f"Admin user {settings.ADMIN_INIT_EMAIL} already exists")
            return
        
        # Create admin user
        admin_data = UserCreate(
            email=settings.ADMIN_INIT_EMAIL,
            password=settings.ADMIN_INIT_PASSWORD,
            name=settings.ADMIN_INIT_NAME,
            role=UserRole.ADMIN
        )
        
        admin_user = create_user(db, admin_data)
        admin_user.is_approved = True  # Admin is auto-approved
        db.commit()
        
        print(f"Admin user created: {admin_user.email}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

def seed_sample_data():
    """Seed database with sample data"""
    print("Seeding sample data...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create sample ID records
        sample_ids = [
            {
                "dl_code": "MH0420250026953",
                "photo": None,  # Would be base64 encoded photo in real app
                "id_metadata": {"state": "Maharashtra", "issue_date": "2025-01-01"}
            },
            {
                "dl_code": "KA0120250012345",
                "photo": None,
                "id_metadata": {"state": "Karnataka", "issue_date": "2025-01-15"}
            }
        ]
        
        for id_data in sample_ids:
            # Check if ID already exists
            existing_id = db.query(ID).filter(ID.dl_code == id_data["dl_code"]).first()
            if not existing_id:
                id_record = ID(**id_data)
                db.add(id_record)
        
        db.commit()
        print("Sample data seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing ID Verification Database...")
    
    # Initialize database
    init_database()
    
    # Create admin user
    create_admin_user()
    
    # Seed sample data
    seed_sample_data()
    
    print("Database initialization complete!")
