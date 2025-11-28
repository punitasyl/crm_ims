"""
Initialize PostgreSQL database with all tables.
This script creates all tables based on SQLAlchemy models.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.database import engine, Base
from app.config import settings

# Import all models to ensure they are registered with Base
# This ensures all SQLAlchemy models are loaded and registered
from app.models import (
    User, Customer, Contact, Category, Product, Warehouse,
    Inventory, Supplier, PurchaseOrder, PurchaseOrderItem,
    SalesOrder, OrderItem, Lead, Opportunity
)

def init_database():
    """Create all database tables."""
    database_url = settings.DATABASE_URL
    
    # Check if it's PostgreSQL
    if not database_url.startswith("postgresql"):
        print("⚠️  Warning: This script is designed for PostgreSQL.")
        print(f"   Current DATABASE_URL: {database_url}")
        response = input("   Continue anyway? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Aborted.")
            sys.exit(1)
    
    print(f"📊 Connecting to database: {database_url.split('@')[-1] if '@' in database_url else database_url}")
    print("🔨 Creating database tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        print("\n📋 Created tables:")
        for table_name in sorted(Base.metadata.tables.keys()):
            print(f"   ✓ {table_name}")
        
        print("\n💡 Next steps:")
        print("   1. Create an admin user: python create_admin.py")
        print("   2. Start the server: uvicorn app.main:app --host 0.0.0.0 --port 8000")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)


if __name__ == "__main__":
    init_database()

