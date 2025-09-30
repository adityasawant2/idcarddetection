import pytest
import numpy as np
from app.utils.ocr import (
    load_image_to_cv2,
    preprocess_for_ocr,
    run_tesseract,
    extract_full_vehicle_id,
    _fix_ocr_errors,
    parse_fields,
    _normalize_id_for_db,
    process_id_image
)

class TestOCRUtils:
    def test_load_image_to_cv2(self):
        """Test image loading from bytes"""
        # Create a simple test image
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_image[25:75, 25:75] = [255, 255, 255]  # White square
        
        # Convert to bytes
        import cv2
        _, buffer = cv2.imencode('.jpg', test_image)
        image_bytes = buffer.tobytes()
        
        # Test loading
        loaded_image = load_image_to_cv2(image_bytes)
        assert loaded_image is not None
        assert loaded_image.shape == (100, 100, 3)

    def test_preprocess_for_ocr(self):
        """Test image preprocessing"""
        # Create test image
        test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        
        variants = preprocess_for_ocr(test_image)
        assert len(variants) > 0
        assert all(isinstance(v, np.ndarray) for v in variants)

    def test_extract_full_vehicle_id(self):
        """Test ID extraction from text"""
        # Test cases
        test_cases = [
            ("MH0420250026953", "MH0420250026953"),
            ("ID: MH0420250026953", "MH0420250026953"),
            ("License MH0420250026953", "MH0420250026953"),
            ("MH 04 2025 0026953", "MH0420250026953"),
            ("Invalid text", None),
            ("", None),
        ]
        
        for input_text, expected in test_cases:
            result = extract_full_vehicle_id(input_text)
            assert result == expected

    def test_fix_ocr_errors(self):
        """Test OCR error correction"""
        test_cases = [
            ("MH042O250026953", "MH0420250026953"),  # O -> 0
            ("MH042I250026953", "MH0421250026953"),  # I -> 1
            ("MH042S250026953", "MH0425250026953"),  # S -> 5
        ]
        
        for input_text, expected in test_cases:
            result = _fix_ocr_errors(input_text)
            assert result == expected

    def test_parse_fields(self):
        """Test field parsing from text"""
        test_text = """
        Name: John Doe
        DOB: 15/03/1990
        Address: 123 Main Street, City
        License No: MH0420250026953
        """
        
        fields = parse_fields(test_text)
        assert 'name' in fields
        assert 'dob' in fields
        assert 'address' in fields
        assert 'license_number' in fields

    def test_normalize_id_for_db(self):
        """Test ID normalization for database"""
        test_cases = [
            ("MH0420250026953", "MH0420250026953"),
            ("MH 04 2025 0026953", "MH0420250026953"),
            ("mh0420250026953", "MH0420250026953"),
        ]
        
        for input_id, expected in test_cases:
            result = _normalize_id_for_db(input_id)
            assert result == expected

    def test_process_id_image_invalid_data(self):
        """Test processing with invalid image data"""
        invalid_data = b"not an image"
        result = process_id_image(invalid_data)
        
        assert result['success'] is False
        assert result['id_number'] is None
        assert 'error' in result


