"""
Script to create an admin user.
Usage: python create_admin.py
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_admin():
    """Create an admin user."""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing_admin:
            print(f"Администратор уже существует:")
            print(f"  Имя пользователя: {existing_admin.username}")
            print(f"  Email: {existing_admin.email}")
            print(f"  Роль: {existing_admin.role.value}")
            response = input("\nСоздать еще одного администратора? (y/n): ")
            if response.lower() != 'y':
                print("Отменено.")
                return
        
        print("\n=== Создание администратора ===")
        username = input("Имя пользователя: ").strip()
        if not username:
            print("Ошибка: Имя пользователя не может быть пустым")
            return
        
        # Check if username exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"Ошибка: Пользователь с именем '{username}' уже существует")
            return
        
        email = input("Email: ").strip()
        if not email:
            print("Ошибка: Email не может быть пустым")
            return
        
        # Check if email exists
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            print(f"Ошибка: Пользователь с email '{email}' уже существует")
            return
        
        first_name = input("Имя: ").strip() or "Admin"
        last_name = input("Фамилия: ").strip() or "User"
        
        password = input("Пароль: ").strip()
        if not password:
            print("Ошибка: Пароль не может быть пустым")
            return
        
        if len(password) < 6:
            print("Ошибка: Пароль должен содержать минимум 6 символов")
            return
        
        if len(password) > 72:
            print("Ошибка: Пароль не должен превышать 72 символа")
            return
        
        # Create admin user
        admin_user = User(
            username=username,
            email=email,
            password=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n✓ Администратор успешно создан!")
        print(f"  ID: {admin_user.id}")
        print(f"  Имя пользователя: {admin_user.username}")
        print(f"  Email: {admin_user.email}")
        print(f"  Роль: {admin_user.role.value}")
        print("\nТеперь вы можете войти в систему с этими учетными данными.")
        
    except Exception as e:
        db.rollback()
        print(f"Ошибка при создании администратора: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()

