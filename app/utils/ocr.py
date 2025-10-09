import cv2
import numpy as np
import pytesseract
import re
from typing import Tuple, List, Dict, Any, Optional
from app.config import settings
from PIL import Image
import io
import base64

def load_image_to_cv2(image_data: bytes) -> np.ndarray:
    """Convert image bytes to OpenCV format"""
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return image

# Configure pytesseract binary path from settings if provided
try:
    if settings.TESSERACT_CMD:
        # On Windows this is usually something like:
        # C:\\Program Files\\Tesseract-OCR\\tesseract.exe
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
except Exception:
    # Non-fatal; fall back to system PATH
    pass

def preprocess_for_ocr(image_bgr: np.ndarray) -> Tuple[np.ndarray, List[Tuple[str, np.ndarray]]]:
    """Preprocess image for OCR with multiple variants"""
    # Convert to grayscale
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # Global threshold (Otsu)
    _, otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Adaptive threshold
    adaptive = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )

    # Morphological opening to remove small noise
    kernel = np.ones((1, 1), np.uint8)
    opened = cv2.morphologyEx(otsu, cv2.MORPH_OPEN, kernel)

    variants = [
        ("grayscale", gray),
        ("denoised", denoised),
        ("otsu", otsu),
        ("adaptive", adaptive),
        ("opened", opened),
    ]

    return gray, variants

def run_tesseract(image: np.ndarray, psm: int = 6, oem: int = 3, lang: str = "eng") -> str:
    """Run Tesseract OCR on image"""
    try:
        config = f"--oem {oem} --psm {psm} -l {lang}"
        text = pytesseract.image_to_string(image, config=config)
        return text.strip()
    except Exception as e:
        print(f"Tesseract error: {e}")
        return ""

def auto_correct_rotation(image_bgr: np.ndarray) -> Tuple[np.ndarray, int]:
    """Detect orientation via Tesseract OSD and rotate image to upright.

    Returns the rotated image and the rotation applied in degrees (0/90/180/270).
    """
    try:
        # Use OSD (Orientation and Script Detection)
        osd = pytesseract.image_to_osd(image_bgr, output_type=pytesseract.Output.DICT)
        rotation = int(osd.get("rotate", 0)) % 360
        if rotation == 0:
            return image_bgr, 0
        elif rotation == 90:
            rotated = cv2.rotate(image_bgr, cv2.ROTATE_90_CLOCKWISE)
        elif rotation == 180:
            rotated = cv2.rotate(image_bgr, cv2.ROTATE_180)
        elif rotation == 270:
            rotated = cv2.rotate(image_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
        else:
            # Fallback for unexpected values: use affine rotate
            h, w = image_bgr.shape[:2]
            M = cv2.getRotationMatrix2D((w/2, h/2), rotation, 1.0)
            rotated = cv2.warpAffine(image_bgr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        print(f"Auto-rotation applied: {rotation} degrees")
        return rotated, rotation
    except Exception as e:
        print(f"Orientation detection failed, skipping rotation: {e}")
        return image_bgr, 0

# Indian state codes for vehicle registration (from your Streamlit code)
VEHICLE_STATE_CODES = [
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN", "GA", "GJ", "HR", "HP", "JK", "JH",
    "KA", "KL", "LD", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB"
]

def extract_full_vehicle_id(text: str) -> Optional[str]:
    """Extract full vehicle ID: state code + 2-digit + ID number as one unit (from Streamlit code)"""
    # First, try with original text
    candidates = [text]
    
    # Also try with OCR corrections applied
    corrected_text = _fix_ocr_errors(text)
    if corrected_text != text:
        candidates.append(corrected_text)
        print(f"Applied OCR corrections: {text[:50]} -> {corrected_text[:50]}")
    
    for candidate_text in candidates:
        # Pattern 1: State code + 2 digits + space + long number
        pattern1 = r"\b(" + "|".join(VEHICLE_STATE_CODES) + r")\s*(\d{2})\s+(\d{8,})\b"
        match1 = re.search(pattern1, candidate_text, re.IGNORECASE)
        if match1:
            state, code, id_num = match1.groups()
            full_id = f"{state}{code}{id_num}"
            print(f"Extracted vehicle ID (pattern 1): {match1.group(0)} -> {full_id}")
            return full_id

        # Pattern 2: State code + 2 digits + long number (no space)
        pattern2 = r"\b(" + "|".join(VEHICLE_STATE_CODES) + r")(\d{2})(\d{8,})\b"
        match2 = re.search(pattern2, candidate_text, re.IGNORECASE)
        if match2:
            state, code, id_num = match2.groups()
            full_id = f"{state}{code}{id_num}"
            print(f"Extracted vehicle ID (pattern 2): {match2.group(0)} -> {full_id}")
            return full_id

    # Fallback to original patterns with OCR corrections
    ID_PATTERNS = [
        # Pattern 3: Generic ID patterns (fallback)
        r"\bID\s*(No\.?|Number\.?|#)?\s*[:\-]?\s*([A-Z0-9\-]{5,})\b",
        r"\b([A-Z]{1,3}\d{5,}[A-Z]?)\b",
        r"\b\d{8,}\b",
    ]
    
    for candidate_text in candidates:
        for pattern in ID_PATTERNS:
            match = re.search(pattern, candidate_text, re.IGNORECASE)
            if match:
                if match.lastindex:
                    fallback = match.group(match.lastindex) or match.group(0)
                else:
                    fallback = match.group(0)
                if fallback:
                    print(f"Extracted ID (fallback): {fallback}")
                    return fallback
    return None

def _fix_ocr_errors(text: str) -> str:
    """Fix common OCR character misrecognitions in vehicle IDs (from Streamlit code)"""
    # Common OCR errors: O→0, I→1, S→5, B→8, G→6, etc.
    corrections = {
        'O': '0',  # Letter O to digit 0
        'I': '1',  # Letter I to digit 1
        'S': '5',  # Letter S to digit 5
        'B': '8',  # Letter B to digit 8
        'G': '6',  # Letter G to digit 6
        'Z': '2',  # Letter Z to digit 2
        'l': '1',  # lowercase l to digit 1
        'o': '0',  # lowercase o to digit 0
        's': '5',  # lowercase s to digit 5
        'b': '8',  # lowercase b to digit 8
        'g': '6',  # lowercase g to digit 6
        'z': '2',  # lowercase z to digit 2
    }
    
    result = text
    for wrong, correct in corrections.items():
        result = result.replace(wrong, correct)
    return result

def clean_text_lines(text: str) -> List[str]:
    """Clean text lines (from Streamlit code)"""
    lines = [ln.strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln and not all(ch in "-_~|/\\" for ch in ln)]
    return lines

def parse_fields(text: str) -> Dict[str, Optional[str]]:
    """Parse structured fields from OCR text (from Streamlit code - ID only)"""
    lines = clean_text_lines(text)
    normalized_text = "\n".join(lines)

    # Only parse id_number according to current requirements
    id_number = extract_full_vehicle_id(normalized_text)
    if id_number:
        id_number = id_number.upper()

    print(f"Parsed fields (id only): id_raw={id_number}")
    return {
        "name": None,
        "dob": None,
        "id_number": id_number,
        "address": None,
    }

def _normalize_id_for_db(dl_code: str) -> str:
    """Normalize DL code for database lookup"""
    # Remove spaces and convert to uppercase
    normalized = dl_code.replace(' ', '').upper()
    
    # Ensure proper format
    if len(normalized) >= 13:
        return normalized
    
    return dl_code

def process_id_image(image_data: bytes, psm: int = 6, oem: int = 3, lang: str = "eng") -> Dict[str, Any]:
    """Main function to process ID image and extract information"""
    try:
        # Load image
        image_bgr = load_image_to_cv2(image_data)
        
        # Auto-correct rotation before further processing
        image_bgr, applied_rotation = auto_correct_rotation(image_bgr)
        if applied_rotation:
            print(f"Auto-rotation applied: {applied_rotation}°")
        
        if image_bgr is None:
            print("Failed to decode uploaded image")
            return {
                'id_number': None,
                'parsed_fields': {},
                'raw_text': '',
                'success': False,
                'error': 'Failed to read the image'
            }

        # Preprocess
        gray, variants = preprocess_for_ocr(image_bgr)

        # OCR run
        texts = []
        candidates = [gray] + [img for _, img in variants]
        seen_hashes = set()
        for img in candidates:
            h = hash(img.tobytes())
            if h in seen_hashes:
                continue
            seen_hashes.add(h)
            txt = run_tesseract(img, psm=psm, oem=oem, lang=lang)
            if txt:
                texts.append(txt)
        combined_text = "\n".join(texts)
        print(f"OCR text length: {len(combined_text)} chars")

        # Parse fields
        fields = parse_fields(combined_text)
        
        # Debug: Print the raw OCR text to help troubleshoot
        print(f"Raw OCR text (first 500 chars): {combined_text[:500]}")
        print(f"Extracted ID number: {fields.get('id_number')}")
        
        return {
            'id_number': fields.get('id_number'),
            'parsed_fields': fields,
            'raw_text': combined_text,
            'success': fields.get('id_number') is not None
        }
        
    except Exception as e:
        print(f"Error processing image: {e}")
        return {
            'id_number': None,
            'parsed_fields': {},
            'raw_text': '',
            'success': False,
            'error': str(e)
        }
