# Solon PD Policy Chatbot — Deployment Guide

## What's in this folder
- `server.js` — the backend API server (Node.js)
- `package.json` — dependency list
- `index.html` — the chatbot web page to embed in Google Sites

---

## Step 1: Upload to GitHub

1. Go to github.com and create a free account if you don't have one
2. Click "New Repository" — name it `solon-policy-bot`
3. Make it **Private**
4. Upload all 3 files (server.js, package.json, index.html)

---

## Step 2: Deploy backend to Render (free)

1. Go to render.com and sign up with your GitHub account
2. Click **"New +"** → **"Web Service"**
3. Connect your `solon-policy-bot` GitHub repo
4. Set these options:
   - **Name**: solon-policy-bot
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: (paste your API key here)
6. Click **Deploy**
7. Wait 2-3 minutes — copy your URL (looks like `https://solon-policy-bot.onrender.com`)

---

## Step 3: Update index.html with your backend URL

Open `index.html` and find this line near the bottom:
```
const BACKEND_URL = 'https://YOUR-RENDER-URL.onrender.com';
```
Replace it with your actual Render URL from Step 2.

---

## Step 4: Host index.html (also on Render)

1. In Render, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repo
3. Set **Publish Directory** to `.` (just a dot)
4. Deploy — you'll get a second URL for the chatbot page itself

---

## Step 5: Embed in Google Sites

1. Open your Google Site in edit mode
2. Click **Insert** → **Embed** → **By URL**
3. Paste the static site URL from Step 4
4. Resize the embed block to your liking
5. Publish the site

---

## Updating policies

When you add new General Orders to your Google Drive Policy folder, the bot will automatically have access to them through the Google Drive MCP connection — no code changes needed.

---

## Need help?
Ask Claude to walk you through any step.
