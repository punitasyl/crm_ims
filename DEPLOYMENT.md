# 🚀 Deployment Guide

This guide will help you deploy CRM IMS to free hosting platforms.

## 📋 Prerequisites

- GitHub account with your repository
- Railway account (or Render account)
- Vercel account (for frontend)

---

## 🎯 Option 1: Railway (Recommended)

Railway offers $5 free credits per month, which is perfect for small projects.

### Backend Deployment on Railway

1. **Sign up** at [railway.app](https://railway.app) (use GitHub to sign in)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Service**
   - Click "New" → "Service"
   - Select your repository
   - Railway will auto-detect Python

4. **Configure Service**
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Set Environment Variables**
   - Go to "Variables" tab
   - Add these variables:
     ```
     SECRET_KEY=your-very-secure-random-secret-key-here
     CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.vercel.app
     DATABASE_URL=sqlite:///./crm_ims.db
     ```
   - Generate a secure SECRET_KEY (you can use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

6. **Get Backend URL**
   - After deployment, Railway will provide a URL like: `https://your-app.railway.app`
   - Copy this URL for frontend configuration

### Frontend Deployment on Vercel

1. **Sign up** at [vercel.com](https://vercel.com) (use GitHub to sign in)

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Project** ⚠️ **IMPORTANT**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` ← **This is crucial!**
   - **Build Command**: `npm run build` (auto-detected after setting Root Directory)
   - **Output Directory**: `.next` (auto-detected)
   
   **Note**: If you don't set Root Directory to `frontend`, Vercel will look for package.json in the root and fail.

4. **Set Environment Variables**
   - Go to "Environment Variables"
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a URL like: `https://your-app.vercel.app`

6. **Update Backend CORS**
   - Go back to Railway backend settings
   - Update `CORS_ORIGINS` to include your Vercel URL:
     ```
     CORS_ORIGINS=https://your-app.vercel.app
     ```

---

## 🎯 Option 2: Render

### Backend Deployment on Render

1. **Sign up** at [render.com](https://render.com) (use GitHub to sign in)

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name**: `crm-ims-backend`
   - **Environment**: Python 3
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**
   - Scroll to "Environment Variables"
   - Add:
     ```
     SECRET_KEY=your-very-secure-random-secret-key-here
     CORS_ORIGINS=https://your-frontend-domain.vercel.app
     DATABASE_URL=sqlite:///./crm_ims.db
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy
   - You'll get a URL like: `https://your-app.onrender.com`

### Frontend Deployment on Vercel

Follow the same steps as in Option 1 for Vercel deployment.

---

## 🔧 Important Configuration Changes

### Backend: Update CORS Settings

Make sure your backend accepts requests from your frontend domain. Update the `CORS_ORIGINS` environment variable with your frontend URL.

### Frontend: Update API URL

Make sure `NEXT_PUBLIC_API_URL` points to your backend URL.

---

## 📝 Post-Deployment Checklist

- [ ] Backend is accessible at the provided URL
- [ ] Frontend can connect to backend (check browser console)
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] Database is working (SQLite file is created)
- [ ] Admin user can be created (run `create_admin.py` locally or via Railway/Render shell)

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

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for errors
- Verify backend is running and accessible

**Problem**: Build fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility

---

## 🔐 Security Notes

1. **Never commit** `.env` files
2. **Use strong SECRET_KEY** (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
3. **Update CORS_ORIGINS** to only include your production domains
4. **Consider using PostgreSQL** for production instead of SQLite (Railway offers free PostgreSQL)

---

## 💡 Tips

- Railway and Render both offer free tiers with limitations
- Vercel is excellent for Next.js and offers generous free tier
- Consider using Railway's PostgreSQL for production (more reliable than SQLite)
- Set up automatic deployments from GitHub (both platforms support this)

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

