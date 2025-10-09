import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models import User, UserRole
from app.crud import create_user, get_password_hash
from sqlalchemy.orm import Session

client = TestClient(app)

@pytest.fixture
def test_db():
    """Create a test database session"""
    # This would need to be configured with a test database
    pass

@pytest.fixture
def test_police_user(test_db):
    """Create a test police user"""
    user_data = {
        "email": "test@police.com",
        "password": "testpassword",
        "name": "Test Police",
        "role": UserRole.POLICE
    }
    # Create user in test database
    return user_data

@pytest.fixture
def test_admin_user(test_db):
    """Create a test admin user"""
    user_data = {
        "email": "admin@test.com",
        "password": "adminpassword",
        "name": "Test Admin",
        "role": UserRole.ADMIN
    }
    # Create user in test database
    return user_data

class TestAuthEndpoints:
    def test_register_police_user(self):
        """Test police user registration"""
        response = client.post("/auth/register", json={
            "email": "newpolice@test.com",
            "password": "testpassword",
            "name": "New Police",
            "phone": "1234567890",
            "role": "police"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newpolice@test.com"
        assert data["role"] == "police"
        assert data["is_approved"] is False

    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        # First registration
        client.post("/auth/register", json={
            "email": "duplicate@test.com",
            "password": "testpassword",
            "name": "First User",
            "role": "police"
        })
        
        # Second registration with same email
        response = client.post("/auth/register", json={
            "email": "duplicate@test.com",
            "password": "testpassword",
            "name": "Second User",
            "role": "police"
        })
        
        assert response.status_code == 400

    def test_login_valid_credentials(self, test_police_user):
        """Test login with valid credentials"""
        response = client.post("/auth/login", data={
            "username": test_police_user["email"],
            "password": test_police_user["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/auth/login", data={
            "username": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401

class TestVerificationEndpoints:
    def test_verify_id_unauthorized(self):
        """Test verification without authentication"""
        response = client.post("/verify/")
        assert response.status_code == 401

    def test_verify_id_no_file(self, test_police_user):
        """Test verification without file upload"""
        # This would need proper authentication setup
        response = client.post("/verify/")
        assert response.status_code in [401, 422]  # Unauthorized or missing file

class TestAdminEndpoints:
    def test_get_unapproved_police_unauthorized(self):
        """Test getting unapproved police without admin auth"""
        response = client.get("/admin/police-unapproved")
        assert response.status_code == 401

    def test_approve_police_unauthorized(self):
        """Test approving police without admin auth"""
        response = client.post("/admin/approve-police/test-id")
        assert response.status_code == 401

class TestLogsEndpoints:
    def test_get_logs_unauthorized(self):
        """Test getting logs without authentication"""
        response = client.get("/logs/")
        assert response.status_code == 401

    def test_get_admin_logs_unauthorized(self):
        """Test getting admin logs without admin auth"""
        response = client.get("/admin/logs")
        assert response.status_code == 401

class TestHealthCheck:
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "ml_available" in data
        assert "database" in data

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "ID Verification API"
        assert data["version"] == "1.0.0"


