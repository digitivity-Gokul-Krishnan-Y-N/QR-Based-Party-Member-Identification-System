# Deploy to Vercel - Step by Step Guide

## Prerequisites
1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. Login to Vercel: `vercel login`

## Important: Two Deployment Options

### Option 1: Deploy Frontend Only (Recommended for Quick Start)

Since Vercel has limitations with Python backends, deploy frontend on Vercel and backend separately:

**1. Deploy Frontend to Vercel:**
```bash
cd client
vercel
```

**2. Deploy Backend to:**
- **Render.com** (Free Python hosting)
- **Railway.app**
- **PythonAnywhere**

**3. Update Frontend API URL:**
After deploying backend, update `client/src` files to use your backend URL instead of `http://localhost:8000`

### Option 2: Deploy Both on Vercel (Serverless Functions)

**Step 1: Update Backend for Vercel Serverless**

The backend needs to be adapted for Vercel's serverless environment. The `vercel.json` files have been created.

**Step 2: Update Frontend Build Script**

Already configured in `client/package.json`

**Step 3: Environment Variables**

Create `.env` file in root (don't commit this):
```env
API_URL=https://your-backend-url.vercel.app
```

**Step 4: Deploy**

From root directory:
```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Production deployment
vercel --prod
```

## Alternative: Deploy Frontend on Vercel, Backend on Render

### 1. Deploy Frontend to Vercel
```bash
cd client
vercel
```
Settings:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### 2. Deploy Backend to Render.com

1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3

### 3. Update API URLs

After getting your Render backend URL, update frontend API calls in your components to use the Render URL.

## Recommended Approach for Your Project

Given your project structure with FastAPI backend that handles file uploads and Excel operations, I recommend:

1. **Frontend on Vercel**
2. **Backend on Render.com** (better for Python/FastAPI with file operations)

This separates concerns and gives you better control over the backend's file handling capabilities.

## Quick Commands

```bash
# Commit and push changes
git add .
git commit -m "Add Vercel configuration"
git push origin main

# Deploy frontend
cd client
vercel --prod

# For backend on Render, just connect via their dashboard
```

## Notes
- Excel file uploads work better on traditional hosting (Render) than serverless (Vercel)
- Vercel has 50MB deployment limit and serverless timeout limits
- For production, consider separate frontend/backend deployment
