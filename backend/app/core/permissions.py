"""
Система проверки разрешений на основе ролей пользователей.
"""
from fastapi import Depends, HTTPException, status
from typing import List
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user


def require_role(allowed_roles: List[UserRole]):
    """
    Зависимость для проверки роли пользователя.
    
    Args:
        allowed_roles: Список ролей, которым разрешен доступ
        
    Returns:
        Зависимость FastAPI, которая проверяет роль пользователя
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            role_names = ", ".join([role.value for role in allowed_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Доступ запрещен. Требуются роли: {role_names}"
            )
        return current_user
    return role_checker


def require_admin():
    """Зависимость для проверки, что пользователь является администратором."""
    return require_role([UserRole.ADMIN])


def require_manager_or_admin():
    """Зависимость для проверки, что пользователь является менеджером или администратором."""
    return require_role([UserRole.ADMIN, UserRole.MANAGER])


def require_sales_or_above():
    """Зависимость для проверки, что пользователь имеет роль SALES, MANAGER или ADMIN."""
    return require_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES])


def require_warehouse_or_above():
    """Зависимость для проверки, что пользователь имеет роль WAREHOUSE, MANAGER или ADMIN."""
    return require_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE])


def require_not_viewer():
    """Зависимость для проверки, что пользователь НЕ является VIEWER (только просмотр)."""
    return require_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.WAREHOUSE])


# Константы для удобного использования
ADMIN_ONLY = [UserRole.ADMIN]
MANAGER_AND_ADMIN = [UserRole.ADMIN, UserRole.MANAGER]
SALES_AND_ABOVE = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES]
WAREHOUSE_AND_ABOVE = [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]
ALL_EXCEPT_VIEWER = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.WAREHOUSE]
ALL_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.WAREHOUSE, UserRole.VIEWER]

