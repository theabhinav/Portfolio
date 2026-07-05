# Deployment Guide: Render & MongoDB Atlas

This guide walks you through deploying your full-stack Career Decision research application online using **Render** (free tier) and **MongoDB Atlas** (free cloud database).

---

## Part 1: Set up MongoDB Atlas (Cloud Database)

Render services do not store databases. You need a free cloud database.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Create a new project and build a database cluster:
   - Select **M0 (Free Tier)**.
   - Choose a provider (e.g., AWS) and region closest to you (e.g., Mumbai, Singapore).
   - Click **Create**.
3. Create a Database User:
   - Enter a username and a strong password (write this down).
   - Select **Read and write to any database**.
4. Set IP Access List:
   - Choose **Allow Access from Anywhere** (IP `0.0.0.0/0`) since Render's server IPs change dynamically.
5. Get your Connection String:
   - Go to your database deployment and click **Connect** -> **Drivers**.
   - Copy the connection string. It will look like this:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   - Replace `<username>` and `<password>` with your database user details.

---

## Part 2: Deploying Backend to Render

Render will host your Express API.

1. Go to [Render](https://render.com) and log in with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `abhinav-2007tiwari/Research`.
4. Configure the Web Service settings:
   - **Name**: `career-research-backend` (or similar)
   - **Environment / Runtime**: `Node`
   - **Region**: Select closest to your Atlas database (e.g., Singapore).
   - **Branch**: `main`
   - **Root Directory**: `backend` *(CRITICAL: Set this to run only from the backend folder)*
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Configure Environment Variables (under the **Environment** tab):
   - Click **Add Environment Variable** and add:
     - `PORT` = `10000` (Render's default port)
     - `MONGO_URI` = *(Your MongoDB Atlas connection string from Part 1)*
     - `JWT_SECRET` = *(Any long random secret string, e.g. `my_super_secret_jwt_key_1928`)*
     - `ADMIN_USERNAME` = `admin`
     - `ADMIN_PASSWORD` = `admin123` *(Or any username/password you want to set for admin panel login)*
6. Click **Deploy Web Service**.
7. Once successfully deployed, copy the Web Service URL at the top left (e.g., `https://career-research-backend.onrender.com`). **This is your backend URL**.

---

## Part 3: Deploying Frontend to Render

Render will compile and host your React Vite app.

1. On Render, click **New +** -> **Static Site**.
2. Connect your GitHub repository `abhinav-2007tiwari/Research`.
3. Configure the Static Site settings:
   - **Name**: `career-research-study` (this will be the URL participants visit)
   - **Branch**: `main`
   - **Root Directory**: `frontend` *(CRITICAL: Set this to run only from the frontend folder)*
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist` *(Vite compiles static assets inside the `dist` folder)*
4. Configure Environment Variables (under the **Environment** tab):
   - Click **Add Environment Variable** and add:
     - `VITE_API_BASE_URL` = `https://career-research-backend.onrender.com/api` *(Replace this with your deployed backend URL from Part 2, followed by `/api`)*
5. Click **Deploy Static Site**.

Once successfully compiled, your frontend site will be live! Participants can open the static site URL to fill out the survey, and you can log in to the admin panel from `https://your-frontend-site.onrender.com/admin/login`.

---

## Part 4: Auto-Seeding the Deployed Admin

When your backend deploys on Render for the first time, it automatically connects to MongoDB Atlas. However, the database is empty, so there will be no admin user.

* The backend server code in `backend/server.js` contains an auto-creation hook for the admin! If no admins are found in the database on boot, it automatically creates a default admin user using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables you set in Render.
* You can immediately log into the admin dashboard on your live site using those credentials.
