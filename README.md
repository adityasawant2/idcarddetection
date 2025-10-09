# ID Verification System

A comprehensive ID verification system built with FastAPI backend and Expo React Native frontend, featuring OCR processing, database lookup, and face matching capabilities.

## Features

### Backend (FastAPI)
- **Authentication**: JWT-based auth with role-based access control
- **OCR Processing**: Tesseract-based text extraction from ID documents
- **Database Integration**: PostgreSQL with SQLAlchemy ORM
- **Face Matching**: Optional PyTorch-based face similarity comparison
- **Admin Management**: User approval, log monitoring, and system management
- **RESTful API**: Well-documented endpoints with proper error handling

### Frontend (Expo React Native)
- **Cross-platform**: Works on iOS and Android
- **Role-based UI**: Different interfaces for Police and Admin users
- **Camera Integration**: Take photos or select from gallery
- **Real-time Results**: Immediate verification feedback
- **Log Management**: View and search verification history
- **Modern UI**: Clean, intuitive interface with React Native Paper

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   FastAPI       │    │   PostgreSQL    │
│   (Expo RN)     │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Tesseract     │
                       │   OCR Engine    │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PyTorch       │
                       │   Face Model    │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 16+
- PostgreSQL 13+
- Tesseract OCR
- Expo CLI

### Backend Setup

1. **Clone and setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your database URL and other settings
   ```

3. **Setup database**:
   ```bash
   # Run migrations
   alembic upgrade head
   
   # Initialize database with admin user
   python init_db.py
   ```

4. **Start server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Start development server**:
   ```bash
   npx expo start
   ```

3. **Run on device**:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new police user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

#### Verification
- `POST /verify/` - Verify ID document (multipart upload)

#### Admin
- `GET /admin/police-unapproved` - Get pending approvals
- `POST /admin/approve-police/{user_id}` - Approve police user
- `GET /admin/logs` - Get all verification logs

#### Logs
- `GET /logs/` - Get user's verification logs

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role ENUM('police', 'admin') NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    name VARCHAR NOT NULL,
    phone VARCHAR
);
```

### IDs Table
```sql
CREATE TABLE ids (
    id SERIAL PRIMARY KEY,
    dl_code VARCHAR UNIQUE NOT NULL,
    photo TEXT,  -- Base64 encoded
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Logs Table
```sql
CREATE TABLE logs (
    id UUID PRIMARY KEY,
    police_user_id UUID REFERENCES users(id),
    dl_code_checked VARCHAR,
    verification_result ENUM('legit', 'fake', 'unknown') NOT NULL,
    image_similarity FLOAT,
    confidence FLOAT,
    parsed_fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    extra JSONB
);
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/id_verification
SECRET_KEY=your-secret-key-change-in-production
TESSERACT_CMD=tesseract
ML_AVAILABLE=true
PYTORCH_DEVICE=cpu
ADMIN_INIT_EMAIL=admin@example.com
ADMIN_INIT_PASSWORD=admin123
```

#### Mobile (app.json)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:8000"
    }
  }
}
```

## Usage

### Police User Flow

1. **Register**: Create account (requires admin approval)
2. **Login**: Access the app after approval
3. **Upload ID**: Take photo or select from gallery
4. **View Results**: See verification status and extracted data
5. **Check Logs**: Review verification history

### Admin User Flow

1. **Login**: Access admin dashboard
2. **Approve Users**: Review and approve police registrations
3. **Monitor Logs**: View all verification activities
4. **Manage Users**: Control user accounts and permissions

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd mobile
npm test
```

## Deployment

### Backend Deployment

1. **Docker** (recommended):
   ```bash
   docker build -t id-verification-api .
   docker run -p 8000:8000 id-verification-api
   ```

2. **Manual**:
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Deployment

1. **Expo Build**:
   ```bash
   npx expo build:android
   npx expo build:ios
   ```

2. **EAS Build** (recommended):
   ```bash
   npm install -g @expo/eas-cli
   eas build --platform all
   ```

## Security Considerations

- JWT tokens with expiration
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- HTTPS in production
- Environment variable management

## Performance Optimization

- Model loading at startup (not per request)
- Database connection pooling
- Image compression before upload
- Caching for frequent lookups
- Background processing for heavy tasks

## Troubleshooting

### Common Issues

1. **Tesseract not found**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr
   
   # macOS
   brew install tesseract
   
   # Windows
   # Download from: https://github.com/UB-Mannheim/tesseract/wiki
   ```

2. **Database connection issues**:
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify user permissions

3. **Mobile app connection issues**:
   - Check API URL in app configuration
   - Ensure backend is running
   - Check network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API docs at `/docs`

## Roadmap

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Biometric authentication
- [ ] Advanced ML models
- [ ] API rate limiting
- [ ] Audit logging


