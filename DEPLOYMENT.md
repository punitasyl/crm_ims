# 🚀 Deployment Guide

This guide will help you deploy CRM IMS to free hosting platforms.

## 📋 Prerequisites

- GitHub account with your repository
- Railway account (or Render account)
- Vercel account (for frontend)

## 💾 Database Storage

### ⚠️ Important: SQLite vs PostgreSQL

**SQLite (Development Only)**
- ✅ Good for local development
- ❌ **NOT suitable for production hosting**
- ❌ Data stored in file (`crm_ims.db`)
- ❌ File system is ephemeral on hosting platforms (data lost on restart)
- ❌ No concurrent write support

**PostgreSQL (Production Recommended)**
- ✅ Persistent data storage
- ✅ Handles concurrent connections
- ✅ Reliable for production
- ✅ Free tier available on Railway/Render
- ✅ Automatic backups

**For production deployment, you MUST use PostgreSQL!**

The application automatically detects the database type from `DATABASE_URL`:
- `sqlite:///...` → SQLite (development)
- `postgresql://...` → PostgreSQL (production)

---

## 🎯 Option 1: Railway (Recommended)

Railway offers $5 free credits per month, which is perfect for small projects.

### Backend Deployment on Railway

1. **Sign up** at [railway.app](https://railway.app) (use GitHub to sign in)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Railway will auto-detect Python
   - Set **Root Directory** to `backend`
   - Railway will automatically detect `requirements.txt`

4. **Add PostgreSQL Database** (Recommended for Production)
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create a PostgreSQL database and provide a connection URL
   - Copy the `DATABASE_URL` (it will look like: `postgresql://user:password@host:port/dbname`)

5. **Set Environment Variables**
   - Go to "Variables" tab
   - Add these variables:
     ```
     SECRET_KEY=your-very-secure-random-secret-key-here
     CORS_ORIGINS=https://your-frontend-domain.vercel.app
     DATABASE_URL=<your-postgresql-url-from-step-4>
     ```
   - **Important**: Use the PostgreSQL DATABASE_URL from step 4, NOT SQLite
   - Generate a secure SECRET_KEY (you can use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

6. **Initialize Database**
   - After first deployment, go to "Deployments" → Click on the deployment → "View Logs"
   - Tables will be created automatically on first startup (via `Base.metadata.create_all()`)
   - OR use Railway's shell to run: `python init_postgresql.py`
   - Create admin user: `python create_admin.py`

7. **Get Backend URL**
   - After deployment, Railway will provide a URL like: `https://your-app.railway.app`
   - Copy this URL for frontend configuration

**Note**: SQLite is NOT recommended for production as the file system is ephemeral. Use PostgreSQL for data persistence.

### Frontend Deployment on Vercel

1. **Sign up** at [vercel.com](https://vercel.com) (use GitHub to sign in)

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Project**
   - **Root Directory**: Set to `frontend`
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Set Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```
   - Replace with your actual Railway backend URL

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - You'll get a URL like: `https://your-app.vercel.app`

---

## 🎯 Option 2: Render

Render offers free tier with some limitations (spins down after 15 minutes of inactivity).

### Backend Deployment on Render

1. **Sign up** at [render.com](https://render.com) (use GitHub to sign in)

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name**: `crm-ims-backend` (or your choice)
   - **Environment**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

4. **Add PostgreSQL Database** (Recommended for Production)
   - Click "New" → "PostgreSQL"
   - Render will create a PostgreSQL database
   - Copy the "Internal Database URL" or "External Database URL"

5. **Set Environment Variables**
   - Scroll to "Environment Variables"
   - Add:
     ```
     SECRET_KEY=your-very-secure-random-secret-key-here
     CORS_ORIGINS=https://your-frontend-domain.vercel.app
     DATABASE_URL=<your-postgresql-url-from-step-4>
     ```
   - **Important**: Use PostgreSQL DATABASE_URL, NOT SQLite
   - Generate a secure SECRET_KEY (you can use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

6. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy
   - You'll get a URL like: `https://your-app.onrender.com`

**Note**: SQLite is NOT recommended for production as the file system is ephemeral. Use PostgreSQL for data persistence.

### Frontend Deployment on Vercel

Same as Option 1, but use your Render backend URL instead.

---

## 📝 Database Initialization

### Method 1: Automatic (Recommended)

Tables are created automatically when the backend starts for the first time via `Base.metadata.create_all()` in `app/main.py`.

### Method 2: Manual Script

If you need to initialize manually:

1. **Connect to your PostgreSQL database** (via Railway/Render shell or locally with DATABASE_URL)

2. **Run initialization script**:
   ```bash
   python backend/init_postgresql.py
   ```

3. **Create admin user**:
   ```bash
   python backend/create_admin.py
   ```

### Method 3: SQL Script

You can also use the SQL migration script:

1. **Connect to PostgreSQL** (via psql or database client)

2. **Run the SQL script**:
   ```bash
   psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
   ```

### Migrating Data from SQLite to PostgreSQL

If you have existing data in SQLite and want to migrate to PostgreSQL:

1. **Set up PostgreSQL** (as described above)

2. **Set DATABASE_URL to PostgreSQL** in your environment

3. **Run migration script**:
   ```bash
   python backend/migrate_sqlite_to_postgresql.py
   ```

   **Note**: This script will copy all data from `backend/crm_ims.db` to PostgreSQL.

---

## 📝 Post-Deployment Checklist

- [ ] Backend is accessible at the provided URL
- [ ] Frontend can connect to backend (check browser console)
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] PostgreSQL database is created and connected
- [ ] Database tables are created (automatic on first startup)
- [ ] Admin user can be created (run `create_admin.py` via Railway/Render shell or connect locally)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- Check logs in Railway/Render dashboard
- Verify all environment variables are set
- Check if port is correctly set to `$PORT`

**Problem**: CORS errors
- Verify `CORS_ORIGINS` includes your frontend URL
- Check that URL doesn't have trailing slash

**Problem**: Database connection errors
- Verify `DATABASE_URL` is correct
- Check that PostgreSQL database is running
- Ensure `psycopg2-binary` is in `requirements.txt`

**Problem**: Tables not created
- Check backend logs for errors
- Run `python backend/init_postgresql.py` manually
- Verify DATABASE_URL is set correctly

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend URL is accessible (try opening in browser)
- Check browser console for CORS errors

**Problem**: Build fails
- Check that Root Directory is set to `frontend` in Vercel
- Verify `package.json` is in `frontend/` directory
- Check build logs for specific errors

---

## 🔐 Security Notes

1. **Never commit** `.env` files
2. **Use strong SECRET_KEY** (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
3. **Update CORS_ORIGINS** to only include your production domains
4. **Use PostgreSQL for production** - SQLite is NOT suitable for production hosting as:
   - File system is ephemeral (data can be lost on restart)
   - No concurrent write support
   - No network access
   - Limited scalability
5. **Protect DATABASE_URL** - Never expose it in logs or client-side code

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
