# 💬 Corporate Chat - Internal Messaging System

A real-time messaging system designed for internal corporate communication between production teams, managers, and directors.

## ✨ Main Features

- ✅ **Real-time Chat** - Instant messaging powered by Socket.io.
- ✅ **Role-Based Access** - Team, Production Manager, Lab Manager, Admin.
- ✅ **Chat Escalation** - Transform 1-to-1 chats into group discussions with one click.
- ✅ **Flash Messages** - Urgent messages (prod_manager only) requiring read confirmation, auto-archives chat.
- ✅ **Shared Closure** - Multi-approval system to officially close discussions.
- ✅ **Archived History** - Full access to past and closed conversations.
- ✅ **PWA Ready** - Installable as a desktop app for all employees.
- ✅ **AI Assistant** - Integrated AI for data analysis and reports (Groq/OpenAI).

## 💾 MongoDB Configuration (Cloud vs Local)

This application supports two data management modes:

### Option A: MongoDB Atlas (Cloud)
Best for quick start and low maintenance. Data is hosted on MongoDB servers.
- **URI**: `mongodb+srv://<user>:<password>@cluster.xyz.mongodb.net/chat_aziendale`

### Option B: MongoDB Community Server (Local) - ✅ Recommended for Enterprise
Best for maximum privacy and control. Data never leaves the corporate network.
1. Download and install **MongoDB Community Server** on your corporate server.
2. Ensure the service is running on the default port `27017`.
3. In the `.env` file, use the local connection string:
   - **URI**: `mongodb://127.0.0.1:27017/chat_aziendale`
4. IT can manage backups locally using `mongodump` without additional storage costs.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or Local)

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_key
AI_PROVIDER=groq
CORS_ORIGIN=*  # Use specific origin in production (e.g., http://192.168.1.100:5001)
```

Optionally, create a `.env` file in the `client` directory for production:

```env
VITE_API_URL=http://your-server-ip:5001
```

### 3. Start App (Dev Mode)

**Terminal 1 - Backend:**
```bash
cd server
node index.js
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Open browser: `http://localhost:5173`

---

## 📦 Production Deployment (On-Premise)

This section explains how to install the application on the corporate server from scratch.

### Prerequisites on Corporate Server 🖥️
1. **Node.js 18+**.
2. **Git** (recommended).
3. **Internal Static IP** (e.g., 192.168.1.100).

### Step 1: Clone the Project
```bash
git clone https://github.com/AndreT900/chat_aziendale.git
cd chat_aziendale
```

### Step 2: Build and Install
```bash
# Backend
cd server
npm install

# Frontend Build
cd ../client
npm install
npm run build
```

### Step 3: Start with PM2 (Process Manager)
```bash
npm install -g pm2
cd ../server
pm2 start index.js --name "chat-aziendale"
pm2 save
pm2 startup
```

---

## � User Management

```bash
cd server
node createUser.js <username> <password> [role] [department]
```

**Roles:** `team`, `prod_manager`, `lab_manager`, `admin`.

---

## 📂 Project Structure

```
chat_aziendale/
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── context/      # Auth Context
│   └── dist/             # Production Build
├── server/               # Backend Node.js
│   ├── controllers/      # Business Logic
│   ├── models/           # MongoDB Schemas
│   ├── routes/           # API Endpoints
│   └── index.js          # Entry point
```

## �️ Security
- ✅ Password hashing with Bcrypt.
- ✅ JWT Authentication.
- ✅ Middleware route protection.
- ✅ AI Guardrails (Analyses only database data).

---
*Last Update: January 31, 2026*
