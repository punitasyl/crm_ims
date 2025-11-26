from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user
from app.core.permissions import require_admin
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Пользователь с таким email или именем пользователя уже существует"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role if user_data.role else UserRole.VIEWER
        )
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
        except Exception as commit_error:
            db.rollback()
            raise commit_error
        
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания пользователя: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Неактивный пользователь")
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.post("/change-password")
async def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for the current user."""
    # Verify old password
    if not verify_password(old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль"
        )
    
    # Validate new password length
    if len(new_password) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль не должен превышать 72 символа"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль должен содержать минимум 6 символов"
        )
    
    # Update password
    current_user.password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Пароль успешно изменен"}


@router.post("/forgot-password")
async def forgot_password(
    username_or_email: str = Form(...),
    db: Session = Depends(get_db)
):
    """Request password reset for a user."""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    if not user:
        # Don't reveal if user exists for security
        return {
            "message": "Если пользователь с таким email или именем существует, временный пароль будет отправлен"
        }
    
    # Generate temporary password
    import secrets
    import string
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    
    # Update user password
    user.password = get_password_hash(temp_password)
    db.commit()
    
    # In production, you would send this via email
    # For now, return it in the response (only for development)
    return {
        "message": "Временный пароль создан",
        "temp_password": temp_password,  # Remove this in production and send via email
        "username": user.username,
        "email": user.email
    }


@router.post("/reset-password/{user_id}")
async def reset_user_password(
    user_id: int,
    new_password: str,
    current_user: User = Depends(require_admin()),  # Только ADMIN
    db: Session = Depends(get_db)
):
    """Reset password for a user (admin only)."""
    
    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Validate new password length
    if len(new_password) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль не должен превышать 72 символа"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль должен содержать минимум 6 символов"
        )
    
    # Update password
    user.password = get_password_hash(new_password)
    db.commit()
    
    return {"message": f"Пароль для пользователя {user.username} успешно сброшен"}

