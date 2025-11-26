"""
Script to check and add length_mm and width_mm columns to products table if they don't exist.
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "crm_ims.db"

if not db_path.exists():
    print(f"Database file not found at {db_path}")
    print("The database will be created automatically when the application starts.")
    exit(0)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(products)")
    columns = [col[1] for col in cursor.fetchall()]
    
    print(f"Current columns in products table: {columns}")
    
    if 'length_mm' not in columns:
        print("Adding length_mm column to products table...")
        cursor.execute("ALTER TABLE products ADD COLUMN length_mm INTEGER")
        print("[OK] Added length_mm column")
    else:
        print("[OK] length_mm column already exists")
    
    if 'width_mm' not in columns:
        print("Adding width_mm column to products table...")
        cursor.execute("ALTER TABLE products ADD COLUMN width_mm INTEGER")
        print("[OK] Added width_mm column")
    else:
        print("[OK] width_mm column already exists")
    
    conn.commit()
    print("\nMigration completed successfully!")
    
    # Verify
    cursor.execute("PRAGMA table_info(products)")
    columns_after = [col[1] for col in cursor.fetchall()]
    print(f"Columns after migration: {columns_after}")
    
except Exception as e:
    conn.rollback()
    print(f"\nError during migration: {e}")
    raise
finally:
    conn.close()

