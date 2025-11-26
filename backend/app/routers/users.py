from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema, UserCreate, UserResponse, UserUpdate
from app.core.dependencies import get_current_user
from app.core.permissions import require_admin
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())  # Только ADMIN
):
    """Get all users (admin only)."""
    query = db.query(User)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter))
        )
    
    if role_filter:
        try:
            role_enum = UserRole(role_filter.lower())
            query = query.filter(User.role == role_enum)
        except ValueError:
            pass
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())  # Только ADMIN
):
    """Get a user by ID (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())  # Только ADMIN
):
    """Create a new user (admin only)."""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email или именем пользователя уже существует"
        )
    
    # Validate password length
    if len(user_data.password) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль не должен превышать 72 символа"
        )
    
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль должен содержать минимум 6 символов"
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
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания пользователя: {str(e)}"
        )
    
    return db_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())  # Только ADMIN
):
    """Update a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Prevent admin from deactivating themselves
    if user_id == current_user.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя деактивировать свой собственный аккаунт"
        )
    
    # Check if username is being changed and if it conflicts
    if user_data.username and user_data.username != user.username:
        existing = db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Пользователь с таким именем пользователя уже существует"
            )
    
    # Check if email is being changed and if it conflicts
    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Пользователь с таким email уже существует"
            )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Handle password update separately
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            if len(password) > 72:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пароль не должен превышать 72 символа"
                )
            if len(password) < 6:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пароль должен содержать минимум 6 символов"
                )
            user.password = get_password_hash(password)
    
    # Handle role update
    if "role" in update_data and update_data["role"]:
        if isinstance(update_data["role"], str):
            try:
                update_data["role"] = UserRole(update_data["role"].lower())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Неверная роль: {update_data['role']}"
                )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления пользователя: {str(e)}"
        )
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())  # Только ADMIN
):
    """Delete a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить свой собственный аккаунт"
        )
    
    db.delete(user)
    db.commit()
    return None

