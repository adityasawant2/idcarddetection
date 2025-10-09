from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.database import get_db
from app import crud, schemas
from app.deps import get_police_user
from app.utils.ocr import process_id_image, _normalize_id_for_db
from app.utils.ml import process_face_matching
from app.models import VerificationResult

router = APIRouter()

@router.post("/", response_model=schemas.VerificationResponse)
async def verify_id(
    file: UploadFile = File(...),
    psm: int = Form(6),
    oem: int = Form(3),
    metadata: Optional[str] = Form(None),
    current_user = Depends(get_police_user),
    db: Session = Depends(get_db)
):
    """Verify ID document using OCR and database lookup"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    try:
        # Read image data
        image_data = await file.read()
        
        # Process image with OCR
        ocr_result = process_id_image(image_data, psm, oem, lang="eng")
        
        if not ocr_result['success'] or not ocr_result['id_number']:
            # Log failed OCR attempt
            log_data = schemas.LogCreate(
                police_user_id=current_user.id,
                dl_code_checked=None,
                verification_result=VerificationResult.UNKNOWN,
                confidence=0.0,
                parsed_fields=ocr_result['parsed_fields'],
                extra={
                    'error': 'OCR failed to extract ID number',
                    'raw_text': ocr_result.get('raw_text', ''),
                    'metadata': json.loads(metadata) if metadata else None
                }
            )
            crud.create_log(db, log_data)
            
            return schemas.VerificationResponse(
                id_number="",
                verification=VerificationResult.UNKNOWN,
                confidence=0.0,
                parsed_fields=ocr_result['parsed_fields'],
                errors=["Failed to extract ID number from image"]
            )
        
        # Normalize ID for database lookup
        normalized_id = _normalize_id_for_db(ocr_result['id_number'])
        
        # Check if ID exists in database
        id_exists = crud.check_id_in_database(db, normalized_id)
        
        # Get stored ID record if exists
        stored_id = crud.get_id_by_dl_code(db, normalized_id) if id_exists else None
        
        # Determine verification result
        if id_exists:
            verification_result = VerificationResult.LEGIT  # ID found in database = LEGIT
            confidence = 95.0
        else:
            verification_result = VerificationResult.FAKE  # ID not found = FAKE
            confidence = 90.0
        
        # Optional face matching
        image_similarity = None
        if stored_id and stored_id.photo:
            try:
                # Convert uploaded image to OpenCV format
                import cv2
                import numpy as np
                nparr = np.frombuffer(image_data, np.uint8)
                uploaded_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Process face matching
                face_result = process_face_matching(uploaded_image, stored_id.photo)
                
                if face_result['similarity'] is not None:
                    image_similarity = face_result['similarity']
                    
                    # Adjust confidence based on face matching
                    if face_result['match']:
                        confidence = min(100.0, confidence + 5.0)
                    else:
                        confidence = max(0.0, confidence - 10.0)
                        
            except Exception as e:
                print(f"Face matching error: {e}")
        
        # Create log entry
        log_data = schemas.LogCreate(
            police_user_id=current_user.id,
            dl_code_checked=normalized_id,
            verification_result=verification_result,
            image_similarity=image_similarity,
            confidence=confidence,
            parsed_fields=ocr_result['parsed_fields'],
            extra={
                'metadata': json.loads(metadata) if metadata else None,
                'face_match': image_similarity is not None,
                'ocr_confidence': ocr_result.get('confidence', 0.0)
            }
        )
        crud.create_log(db, log_data)
        
        return schemas.VerificationResponse(
            id_number=ocr_result['id_number'],
            verification=verification_result,
            image_similarity=image_similarity,
            confidence=confidence,
            parsed_fields=ocr_result['parsed_fields'],
            errors=[]
        )
        
    except Exception as e:
        # Log error
        log_data = schemas.LogCreate(
            police_user_id=current_user.id,
            dl_code_checked=None,
            verification_result=VerificationResult.UNKNOWN,
            confidence=0.0,
            parsed_fields={},
            extra={
                'error': str(e),
                'metadata': json.loads(metadata) if metadata else None
            }
        )
        crud.create_log(db, log_data)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )