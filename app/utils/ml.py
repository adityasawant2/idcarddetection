import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models import resnet50
from sklearn.metrics.pairwise import cosine_similarity
from typing import Tuple, Optional, Dict, Any
import base64
from io import BytesIO
from PIL import Image
from app.config import settings

# Global model variables
face_model = None
face_processor = None
device = None

class SiameseNetwork(nn.Module):
    def __init__(self):
        super(SiameseNetwork, self).__init__()
        # Use pre-trained ResNet50 as backbone
        self.backbone = resnet50(pretrained=True)
        # Remove the final classification layer
        self.backbone = nn.Sequential(*list(self.backbone.children())[:-1])
        # Freeze backbone weights
        for param in self.backbone.parameters():
            param.requires_grad = False
        
    def forward(self, x1, x2):
        # Extract features from both images
        features1 = self.backbone(x1).squeeze()
        features2 = self.backbone(x2).squeeze()
        
        # Ensure features are 2D (batch_size, features)
        if features1.dim() == 1:
            features1 = features1.unsqueeze(0)
        if features2.dim() == 1:
            features2 = features2.unsqueeze(0)
        
        # L2 normalize features
        features1 = torch.nn.functional.normalize(features1, p=2, dim=1)
        features2 = torch.nn.functional.normalize(features2, p=2, dim=1)
        
        return features1, features2

async def load_face_model() -> Tuple[Optional[SiameseNetwork], Optional[transforms.Compose]]:
    """Load face similarity model"""
    global face_model, face_processor, device
    
    if not settings.ML_AVAILABLE:
        return None, None
    
    try:
        device = torch.device(settings.PYTORCH_DEVICE)
        
        # Initialize model
        face_model = SiameseNetwork()
        face_model.to(device)
        face_model.eval()
        
        # Define transforms
        face_processor = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        return face_model, face_processor
        
    except Exception as e:
        print(f"Failed to load face model: {e}")
        settings.ML_AVAILABLE = False
        return None, None

def detect_and_crop_face(image: np.ndarray) -> Optional[np.ndarray]:
    """Detect and crop face from license image with quality assessment."""
    try:
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces with multiple parameters for better detection
        faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
        
        if len(faces) == 0:
            print("No face detected in image")
            return None
        
        # Get the largest face (assuming it's the main subject)
        largest_face = max(faces, key=lambda x: x[2] * x[3])
        x, y, w, h = largest_face
        
        # Add padding around the face (adaptive based on face size)
        padding = max(20, int(min(w, h) * 0.1))
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.shape[1] - x, w + 2 * padding)
        h = min(image.shape[0] - y, h + 2 * padding)
        
        # Crop the face region
        face_crop = image[y:y+h, x:x+w]
        
        # Assess face quality
        quality = assess_face_quality(face_crop)
        print(f"Face detected: {face_crop.shape[1]}x{face_crop.shape[0]}, Quality: {quality:.2f}")
        
        # Reject very low quality faces
        if quality < 0.3:
            print(f"Face quality too low ({quality:.2f}), rejecting")
            return None
        
        # Preprocess face for better matching
        face_processed = preprocess_face(face_crop)
        
        return face_processed
        
    except Exception as e:
        print(f"Error detecting face: {e}")
        return None

def preprocess_face(face_image: np.ndarray) -> np.ndarray:
    """Preprocess face image for better matching."""
    try:
        # 1. Resize to standard size
        face_resized = cv2.resize(face_image, (224, 224))
        
        # 2. Lighting normalization
        lab = cv2.cvtColor(face_resized, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(l)
        lab = cv2.merge([l, a, b])
        face_normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        # 3. Noise reduction
        face_denoised = cv2.bilateralFilter(face_normalized, 9, 75, 75)
        
        return face_denoised
    except Exception as e:
        print(f"Error preprocessing face: {e}")
        return face_image

def preprocess_image_for_ml(image: np.ndarray) -> torch.Tensor:
    """Preprocess image for deep learning model."""
    # Convert BGR to RGB
    if len(image.shape) == 3 and image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Convert to PIL Image
    pil_image = Image.fromarray(image)
    
    # Define transforms
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Apply transforms and add batch dimension
    tensor = transform(pil_image).unsqueeze(0)
    return tensor

def assess_face_quality(face_image: np.ndarray) -> float:
    """Assess face image quality (0-1 scale)."""
    try:
        quality_score = 0.0
        
        # 1. Resolution check (higher is better)
        height, width = face_image.shape[:2]
        min_dim = min(height, width)
        if min_dim >= 100:
            quality_score += 0.3
        elif min_dim >= 50:
            quality_score += 0.2
        else:
            quality_score += 0.1
        
        # 2. Blur detection (higher variance = less blur)
        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY) if len(face_image.shape) == 3 else face_image
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score > 100:
            quality_score += 0.4
        elif blur_score > 50:
            quality_score += 0.3
        else:
            quality_score += 0.1
        
        # 3. Lighting quality (check for over/under exposure)
        mean_brightness = np.mean(gray)
        if 50 <= mean_brightness <= 200:
            quality_score += 0.3
        elif 30 <= mean_brightness <= 220:
            quality_score += 0.2
        else:
            quality_score += 0.1
        
        return min(quality_score, 1.0)
    except Exception as e:
        print(f"Error assessing face quality: {e}")
        return 0.5

def calculate_multi_scale_similarity(image1: np.ndarray, image2: np.ndarray) -> Optional[float]:
    """Calculate similarity using multiple scales for better accuracy."""
    global face_model, device
    
    if face_model is None or device is None:
        print("ML libraries not available. Install torch, torchvision, scikit-learn")
        return None
    
    try:
        similarities = []
        scales = [0.8, 1.0, 1.2]  # Test different scales
        
        for scale in scales:
            try:
                # Resize images
                h1, w1 = image1.shape[:2]
                h2, w2 = image2.shape[:2]
                
                new_h1, new_w1 = int(h1 * scale), int(w1 * scale)
                new_h2, new_w2 = int(h2 * scale), int(w2 * scale)
                
                img1_scaled = cv2.resize(image1, (new_w1, new_h1))
                img2_scaled = cv2.resize(image2, (new_w2, new_h2))
                
                # Preprocess images
                tensor1 = preprocess_image_for_ml(img1_scaled)
                tensor2 = preprocess_image_for_ml(img2_scaled)
                
                # Extract features
                with torch.no_grad():
                    features1, features2 = face_model(tensor1, tensor2)
                
                # Calculate cosine similarity
                similarity = cosine_similarity(
                    features1.cpu().numpy().reshape(1, -1),
                    features2.cpu().numpy().reshape(1, -1)
                )[0][0]
                
                similarities.append(similarity)
                print(f"Scale {scale:.1f} similarity: {similarity:.4f}")
                
            except Exception as scale_error:
                print(f"Error at scale {scale:.1f}: {scale_error}")
                continue
        
        if similarities:
            # Use the maximum similarity across scales
            max_similarity = max(similarities)
            print(f"Multi-scale similarity calculated: {max_similarity:.4f} (from {len(similarities)} scales)")
            return float(max_similarity)
        else:
            return None
            
    except Exception as e:
        print(f"Error calculating multi-scale similarity: {e}")
        return None

def calculate_image_similarity(image1: np.ndarray, image2: np.ndarray) -> Optional[float]:
    """Calculate similarity between two face images using enhanced methods."""
    return calculate_multi_scale_similarity(image1, image2)

def get_adaptive_threshold(face1_quality: float, face2_quality: float) -> float:
    """Get adaptive threshold based on face quality."""
    base_threshold = 0.9
    
    # Lower threshold for high-quality images
    if face1_quality > 0.8 and face2_quality > 0.8:
        return 0.85
    # Higher threshold for low-quality images
    elif face1_quality < 0.5 or face2_quality < 0.5:
        return 0.95
    # Medium threshold for mixed quality
    else:
        return base_threshold

def get_stored_license_image(photo_base64: str) -> Optional[np.ndarray]:
    """Retrieve stored license image from database (handles base64 URLs in bytea)."""
    try:
        if not photo_base64:
            return None
        
        # Handle base64 URL stored in bytea
        if isinstance(photo_base64, bytes):
            # Try to decode as base64 first
            try:
                # Decode bytes to string
                base64_string = photo_base64.decode('utf-8')
                # Remove data URL prefix if present
                if base64_string.startswith('data:image'):
                    base64_string = base64_string.split(',')[1]
                # Decode base64 to image bytes
                image_bytes = base64.b64decode(base64_string)
                # Convert to OpenCV image
                nparr = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                print(f"Retrieved stored license image (base64): {image.shape[1]}x{image.shape[0]}")
                return image
            except Exception as base64_error:
                print(f"Failed to decode as base64, trying as raw bytes: {base64_error}")
                # Fallback: try as raw image bytes
                nparr = np.frombuffer(photo_base64, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if image is not None:
                    print(f"Retrieved stored license image (raw bytes): {image.shape[1]}x{image.shape[0]}")
                    return image
        
        # Handle string data (if stored as text)
        elif isinstance(photo_base64, str):
            # Remove data URL prefix if present
            base64_string = photo_base64
            if base64_string.startswith('data:image'):
                base64_string = base64_string.split(',')[1]
            # Decode base64 to image bytes
            image_bytes = base64.b64decode(base64_string)
            # Convert to OpenCV image
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            print(f"Retrieved stored license image (base64 string): {image.shape[1]}x{image.shape[0]}")
            return image
            
    except Exception as e:
        print(f"Error retrieving stored image: {e}")
        return None

def process_face_matching(uploaded_image: np.ndarray, stored_photo_base64: str) -> Dict[str, Any]:
    """Process face matching between uploaded and stored images"""
    global face_model, face_processor
    
    if not settings.ML_AVAILABLE or face_model is None:
        return {
            'similarity': None,
            'match': False,
            'confidence': 0.0,
            'uploaded_quality': 0.0,
            'stored_quality': 0.0,
            'threshold': 0.0,
            'error': 'ML not available'
        }
    
    try:
        # Detect and crop face from uploaded image
        uploaded_face = detect_and_crop_face(uploaded_image)
        if uploaded_face is None:
            return {
                'similarity': None,
                'match': False,
                'confidence': 0.0,
                'uploaded_quality': 0.0,
                'stored_quality': 0.0,
                'threshold': 0.0,
                'error': 'No face detected in uploaded image or face quality too low'
            }
        
        # Get stored license image
        stored_image = get_stored_license_image(stored_photo_base64)
        if stored_image is None:
            return {
                'similarity': None,
                'match': False,
                'confidence': 0.0,
                'uploaded_quality': 0.0,
                'stored_quality': 0.0,
                'threshold': 0.0,
                'error': 'No stored image available'
            }
        
        # Detect and crop face from stored image
        stored_face = detect_and_crop_face(stored_image)
        if stored_face is None:
            return {
                'similarity': None,
                'match': False,
                'confidence': 0.0,
                'uploaded_quality': 0.0,
                'stored_quality': 0.0,
                'threshold': 0.0,
                'error': 'No face detected in stored image or face quality too low'
            }
        
        # Preprocess stored face for consistency
        stored_face_processed = preprocess_face(stored_face)
        
        # Calculate similarity using enhanced methods
        similarity = calculate_image_similarity(uploaded_face, stored_face_processed)
        if similarity is None:
            return {
                'similarity': None,
                'match': False,
                'confidence': 0.0,
                'uploaded_quality': 0.0,
                'stored_quality': 0.0,
                'threshold': 0.0,
                'error': 'Similarity calculation failed'
            }
        
        # Assess quality of both faces
        uploaded_quality = assess_face_quality(uploaded_face)
        stored_quality = assess_face_quality(stored_face_processed)
        
        # Get adaptive threshold based on quality
        similarity_threshold = get_adaptive_threshold(uploaded_quality, stored_quality)
        
        # Determine match result
        match = similarity >= similarity_threshold
        
        # Calculate confidence
        confidence = min(100.0, max(0.0, (similarity / similarity_threshold) * 100))
        
        return {
            'similarity': similarity,
            'match': match,
            'confidence': confidence,
            'uploaded_quality': uploaded_quality,
            'stored_quality': stored_quality,
            'threshold': similarity_threshold,
            'error': None
        }
        
    except Exception as e:
        return {
            'similarity': None,
            'match': False,
            'confidence': 0.0,
            'uploaded_quality': 0.0,
            'stored_quality': 0.0,
            'threshold': 0.0,
            'error': str(e)
        }
