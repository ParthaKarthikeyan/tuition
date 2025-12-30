# Deployment Guide: GitHub Pages + PythonAnywhere

This guide will help you deploy the Tuition Tracker app for **free** using:
- **Frontend**: GitHub Pages (free static hosting)
- **Backend**: PythonAnywhere (free Python hosting with persistent files)

## Prerequisites

1. A GitHub account (free): https://github.com
2. A PythonAnywhere account (free): https://www.pythonanywhere.com

---

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Name your repository: `tuition`
3. Make it **Public** (required for free GitHub Pages)
4. Click "Create repository"

---

## Step 2: Push Your Code to GitHub

Open a terminal in `D:\tuition` and run:

```bash
cd D:\tuition
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ParthaKarthikeyan/tuition.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Set Up PythonAnywhere Backend

### 3.1 Create PythonAnywhere Account
1. Go to https://www.pythonanywhere.com
2. Sign up for a free "Beginner" account
3. Note your username (e.g., `johndoe`)

### 3.2 Upload Backend Files
1. Go to the **Files** tab
2. Create a new directory: `tuition`
3. Upload these files from `D:\tuition\backend\`:
   - `main.py`
   - `wsgi.py`
   - `requirements.txt`
4. Create a `data` folder inside `tuition`
5. Upload the JSON files from `D:\tuition\backend\data\`:
   - `students.json`
   - `classes.json`
   - `sessions.json`
   - `attendance.json`
   - `payments.json`

Your file structure should look like:
```
/home/YOUR_USERNAME/tuition/
├── main.py
├── wsgi.py
├── requirements.txt
└── data/
    ├── students.json
    ├── classes.json
    ├── sessions.json
    ├── attendance.json
    └── payments.json
```

### 3.3 Install Dependencies
1. Go to the **Consoles** tab
2. Start a new **Bash** console
3. Run:
```bash
cd ~/tuition
pip3 install --user fastapi uvicorn pydantic
```

### 3.4 Create Web App
1. Go to the **Web** tab
2. Click "Add a new web app"
3. Click "Next" (use free subdomain)
4. Select **Manual configuration**
5. Select **Python 3.10** (or latest available)

### 3.5 Configure ASGI
1. In the Web tab, scroll to "Code" section
2. Set **Source code**: `/home/YOUR_USERNAME/tuition`
3. Set **Working directory**: `/home/YOUR_USERNAME/tuition`

4. Scroll to "WSGI configuration file" and click on it
5. **Replace ALL contents** with:

```python
import sys
import os

# Add your project directory to the sys.path
project_home = '/home/YOUR_USERNAME/tuition'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set the data directory environment variable
os.chdir(project_home)

# Import FastAPI app
from main import app

# PythonAnywhere WSGI expects 'application'
application = app
```

Replace `YOUR_USERNAME` with your PythonAnywhere username.

### 3.6 Update CORS in main.py
1. Go to **Files** tab
2. Open `/home/YOUR_USERNAME/tuition/main.py`
3. Find the `ALLOWED_ORIGINS` list and add your GitHub Pages URL:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    "https://YOUR_GITHUB_USERNAME.github.io",
]
```

### 3.7 Reload Web App
1. Go back to **Web** tab
2. Click the green **Reload** button
3. Your API is now live at: `https://YOUR_USERNAME.pythonanywhere.com/api`

Test it by visiting: `https://YOUR_USERNAME.pythonanywhere.com/api/dashboard`

---

## Step 4: Deploy Frontend to GitHub Pages

### 4.1 Update Configuration Files

Before building, update these files with your usernames:

**frontend/vite.config.js** - Update the base path:
```javascript
base: process.env.NODE_ENV === 'production' ? '/tuition/' : '/',
```

**frontend/package.json** - Update homepage:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/tuition"
```

### 4.2 Create Environment File

Create a file `frontend/.env.production` with:
```
VITE_API_URL=https://YOUR_PYTHONANYWHERE_USERNAME.pythonanywhere.com/api
```

### 4.3 Build and Deploy

```bash
cd D:\tuition\frontend
npm install
npm run build
npm run deploy
```

This will:
1. Build the production version
2. Push it to the `gh-pages` branch
3. GitHub Pages will automatically serve it

### 4.4 Enable GitHub Pages
1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/tuition`
2. Click **Settings** → **Pages**
3. Under "Source", select: `Deploy from a branch`
4. Select branch: `gh-pages` / `/ (root)`
5. Click **Save**

Wait 2-3 minutes, then visit: `https://YOUR_GITHUB_USERNAME.github.io/tuition`

---

## Summary

| Component | URL |
|-----------|-----|
| Frontend | `https://YOUR_GITHUB_USERNAME.github.io/tuition` |
| Backend API | `https://YOUR_PYTHONANYWHERE_USERNAME.pythonanywhere.com/api` |

---

## Troubleshooting

### "CORS Error" in browser console
- Make sure your GitHub Pages URL is in the `ALLOWED_ORIGINS` list in `main.py`
- Reload the web app on PythonAnywhere

### "404 Not Found" on page refresh
- The 404.html redirect should handle this
- Make sure 404.html was deployed to GitHub Pages

### API not responding
- Check the error log in PythonAnywhere Web tab
- Make sure all JSON files exist in the `data` folder
- Try reloading the web app

### Data not persisting
- PythonAnywhere free tier keeps files permanently
- Make sure the `data` folder has write permissions

---

## Updating the App

### To update the frontend:
```bash
cd D:\tuition\frontend
npm run deploy
```

### To update the backend:
1. Upload changed files to PythonAnywhere
2. Click "Reload" in the Web tab

---

## Costs

- **GitHub Pages**: Free (for public repos)
- **PythonAnywhere**: Free (Beginner account)
  - Limitations: 512MB disk, 100 CPU seconds/day
  - More than enough for personal use!

