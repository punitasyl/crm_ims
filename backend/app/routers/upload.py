from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path
from typing import Optional

from app.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, MANAGER_AND_ADMIN
from app.models.user import User

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
PRODUCT_IMAGES_DIR = UPLOAD_DIR / "products"
PRODUCT_IMAGES_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(MANAGER_AND_ADMIN))  # ADMIN, MANAGER (только те, кто может управлять товарами)
):
    """Upload a product image."""
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Неподдерживаемый формат файла. Разрешенные форматы: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    file_path = PRODUCT_IMAGES_DIR / filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Return file URL
    image_url = f"/api/upload/product-image/{filename}"
    return {"image_url": image_url, "filename": filename}


@router.get("/product-image/{filename}")
async def get_product_image(filename: str):
    """Get a product image by filename."""
    file_path = PRODUCT_IMAGES_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Изображение не найдено"
        )
    
    return FileResponse(file_path)

