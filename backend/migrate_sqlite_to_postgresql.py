"""
Migrate data from SQLite to PostgreSQL.
This script copies all data from SQLite database to PostgreSQL.
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

def migrate_data():
    """Migrate data from SQLite to PostgreSQL."""
    
    # SQLite source
    sqlite_url = "sqlite:///./crm_ims.db"
    if not os.path.exists("./crm_ims.db"):
        print("❌ SQLite database file not found: ./crm_ims.db")
        sys.exit(1)
    
    # PostgreSQL destination
    postgres_url = os.getenv("DATABASE_URL")
    if not postgres_url or not postgres_url.startswith("postgresql"):
        print("❌ PostgreSQL DATABASE_URL not found or invalid.")
        print("   Set DATABASE_URL environment variable with PostgreSQL connection string.")
        sys.exit(1)
    
    print("📦 Migrating data from SQLite to PostgreSQL...")
    print(f"   Source: {sqlite_url}")
    print(f"   Destination: {postgres_url.split('@')[-1] if '@' in postgres_url else postgres_url}")
    
    # Create engines
    sqlite_engine = create_engine(sqlite_url)
    postgres_engine = create_engine(postgres_url)
    
    sqlite_session = sessionmaker(bind=sqlite_engine)()
    postgres_session = sessionmaker(bind=postgres_engine)()
    
    try:
        # Get list of tables
        sqlite_inspector = inspect(sqlite_engine)
        postgres_inspector = inspect(postgres_engine)
        
        sqlite_tables = sqlite_inspector.get_table_names()
        postgres_tables = postgres_inspector.get_table_names()
        
        print(f"\n📊 Found {len(sqlite_tables)} tables in SQLite")
        
        # Tables to migrate (in order to respect foreign keys)
        migration_order = [
            'users',
            'categories',
            'customers',
            'contacts',
            'products',
            'warehouses',
            'suppliers',
            'inventory',
            'leads',
            'opportunities',
            'sales_orders',
            'order_items',
            'purchase_orders',
            'purchase_order_items',
        ]
        
        migrated_count = 0
        
        for table_name in migration_order:
            if table_name not in sqlite_tables:
                print(f"⏭️  Skipping {table_name} (not in SQLite)")
                continue
            
            if table_name not in postgres_tables:
                print(f"⏭️  Skipping {table_name} (not in PostgreSQL)")
                continue
            
            # Get data from SQLite
            result = sqlite_session.execute(f"SELECT * FROM {table_name}")
            rows = result.fetchall()
            columns = result.keys()
            
            if not rows:
                print(f"⏭️  Skipping {table_name} (empty)")
                continue
            
            # Clear existing data in PostgreSQL (optional - comment out if you want to keep existing data)
            # postgres_session.execute(f"TRUNCATE TABLE {table_name} CASCADE")
            
            # Insert data into PostgreSQL
            print(f"📤 Migrating {table_name} ({len(rows)} rows)...")
            
            for row in rows:
                values = dict(zip(columns, row))
                # Build INSERT statement
                columns_str = ', '.join(columns)
                placeholders = ', '.join([f':{col}' for col in columns])
                insert_sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
                
                try:
                    postgres_session.execute(insert_sql, values)
                except Exception as e:
                    print(f"   ⚠️  Warning: Error inserting row into {table_name}: {e}")
                    # Continue with next row
                    continue
            
            postgres_session.commit()
            migrated_count += len(rows)
            print(f"   ✅ Migrated {len(rows)} rows")
        
        print(f"\n✅ Migration completed!")
        print(f"   Total rows migrated: {migrated_count}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        postgres_session.rollback()
        sys.exit(1)
    finally:
        sqlite_session.close()
        postgres_session.close()


if __name__ == "__main__":
    response = input("⚠️  This will copy data from SQLite to PostgreSQL. Continue? (yes/no): ")
    if response.lower() != "yes":
        print("❌ Aborted.")
        sys.exit(0)
    
    migrate_data()

