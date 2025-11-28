"""
Quick script to check database connection and list tables.
Run this in Railway shell to debug database issues.
"""
import os
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base
from app.config import settings
from app.models import (
    User, Customer, Contact, Category, Product, Warehouse,
    Inventory, Supplier, PurchaseOrder, PurchaseOrderItem,
    SalesOrder, OrderItem, Lead, Opportunity
)

def check_database():
    """Check database connection and list existing tables."""
    print("=" * 60)
    print("🔍 Database Connection Check")
    print("=" * 60)
    
    # Check DATABASE_URL
    db_url = settings.DATABASE_URL
    print(f"\n📊 DATABASE_URL:")
    if db_url.startswith("postgresql"):
        # Hide password in output
        if "@" in db_url:
            parts = db_url.split("@")
            if ":" in parts[0]:
                user_pass = parts[0].split(":")
                if len(user_pass) >= 2:
                    masked = f"{user_pass[0]}:****@{parts[1]}"
                    print(f"   {masked}")
                else:
                    print(f"   {db_url[:50]}...")
            else:
                print(f"   {db_url[:50]}...")
        else:
            print(f"   {db_url[:50]}...")
    else:
        print(f"   {db_url}")
    
    # Try to connect
    print(f"\n🔌 Testing connection...")
    try:
        with engine.connect() as conn:
            print("   ✅ Connection successful!")
            
            # Check if it's PostgreSQL
            if db_url.startswith("postgresql"):
                # List existing tables
                from sqlalchemy import inspect, text
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                
                print(f"\n📋 Existing tables ({len(tables)}):")
                if tables:
                    for table in sorted(tables):
                        print(f"   ✓ {table}")
                else:
                    print("   ⚠️  No tables found!")
                
                # Check if our expected tables exist
                expected_tables = [
                    'users', 'customers', 'contacts', 'categories', 'products',
                    'warehouses', 'suppliers', 'inventory', 'sales_orders',
                    'order_items', 'purchase_orders', 'purchase_order_items',
                    'leads', 'opportunities'
                ]
                
                print(f"\n🎯 Expected tables check:")
                missing = []
                for table in expected_tables:
                    if table in tables:
                        print(f"   ✅ {table}")
                    else:
                        print(f"   ❌ {table} - MISSING")
                        missing.append(table)
                
                if missing:
                    print(f"\n⚠️  {len(missing)} tables are missing!")
                    print("   Run: python init_postgresql.py")
                else:
                    print(f"\n✅ All expected tables exist!")
                    
    except Exception as e:
        print(f"   ❌ Connection failed!")
        print(f"   Error: {str(e)}")
        print(f"   Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    return True


if __name__ == "__main__":
    check_database()

