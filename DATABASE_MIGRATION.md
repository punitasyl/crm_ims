# 📊 Database Migration Guide

This guide explains how to initialize and migrate your database for production deployment.

## 🎯 Quick Start

### For New PostgreSQL Database (Production)

1. **Set DATABASE_URL environment variable:**
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/dbname"
   ```

2. **Initialize database tables:**
   ```bash
   cd backend
   python init_postgresql.py
   ```

3. **Create admin user:**
   ```bash
   python create_admin.py
   ```

That's it! Tables are now created and ready to use.

---

## 📦 Migrating from SQLite to PostgreSQL

If you have existing data in SQLite and want to migrate to PostgreSQL:

### Step 1: Set up PostgreSQL

1. Create PostgreSQL database on Railway/Render (see `DEPLOYMENT.md`)
2. Copy the `DATABASE_URL` connection string

### Step 2: Set Environment Variable

```bash
export DATABASE_URL="postgresql://user:password@host:port/dbname"
```

### Step 3: Initialize PostgreSQL Tables

```bash
cd backend
python init_postgresql.py
```

### Step 4: Migrate Data

```bash
python migrate_sqlite_to_postgresql.py
```

This script will:
- Read all data from `backend/crm_ims.db` (SQLite)
- Copy it to PostgreSQL database
- Preserve all relationships and foreign keys

**Note**: Make sure your SQLite database file exists at `backend/crm_ims.db`

---

## 🔧 Manual SQL Script Method

Alternatively, you can use the SQL migration script:

1. **Connect to PostgreSQL:**
   ```bash
   psql $DATABASE_URL
   ```

2. **Run the SQL script:**
   ```bash
   psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
   ```

---

## 📋 What Gets Created

The initialization script creates the following tables:

- `users` - User accounts and authentication
- `customers` - Customer information
- `contacts` - Customer contacts
- `categories` - Product categories
- `products` - Product catalog (with `length_mm` and `width_mm` for tiles)
- `warehouses` - Warehouse locations
- `suppliers` - Supplier information
- `inventory` - Stock levels by warehouse
- `sales_orders` - Sales orders
- `order_items` - Order line items
- `purchase_orders` - Purchase orders
- `purchase_order_items` - Purchase order line items
- `leads` - Sales leads
- `opportunities` - Sales opportunities

All tables include proper indexes for performance.

---

## ⚠️ Important Notes

1. **Automatic Table Creation**: Tables are also created automatically when the backend starts for the first time (via `Base.metadata.create_all()` in `app/main.py`)

2. **Data Safety**: The migration script does NOT delete existing data in PostgreSQL. If you need to start fresh, manually truncate tables first.

3. **Foreign Keys**: The migration script respects table order to maintain foreign key relationships.

4. **Production**: Always use PostgreSQL for production. SQLite is only for local development.

---

## 🐛 Troubleshooting

### Error: "Table already exists"
- Tables are already created. This is normal if you've run the script before.
- The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Error: "Connection refused"
- Check your `DATABASE_URL` is correct
- Verify PostgreSQL is running and accessible
- Check firewall/network settings

### Error: "Permission denied"
- Ensure the database user has CREATE TABLE permissions
- Check that the database exists

### Migration script fails
- Ensure SQLite database file exists at `backend/crm_ims.db`
- Check that PostgreSQL tables are already created (run `init_postgresql.py` first)
- Verify DATABASE_URL points to PostgreSQL, not SQLite

---

## 📚 Related Documentation

- `DEPLOYMENT.md` - Full deployment guide
- `README.md` - Project overview
- `backend/README.md` - Backend setup instructions

