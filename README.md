# BillHouse — Create. Send. Get Paid.

BillHouse is a modern, premium invoicing SaaS platform built for freelancers, creative agencies, SMEs, and enterprise clients. It automates billing, payment reminders, GST/TDS tax compliance calculations, and cash flow reporting.

This repository implements **Module 1: Landing Page & Authentication**.

---

## Tech Stack & Architecture

- **Frontend**: React.js (TypeScript) + Vite + Tailwind CSS v3 + Recharts + React Router v6
- **Backend**: Node.js + Express.js (TypeScript) + Mongoose + JWT Authentication + Nodemailer (Ethereal Dev mailer)
- **Database**: MongoDB Atlas

---

## Directory Structure

```
d:\BillHouse\
├── Logo.png                 # Source Brand Logo asset
├── README.md                # Project setup and startup guide (this file)
├── backend/                 # Node.js + Express + TypeScript api server
│   ├── src/
│   │   ├── index.ts         # Main server bootstrap
│   │   ├── middleware/      # Auth & logic interceptors
│   │   ├── models/          # Mongoose collections schema definition
│   │   ├── routes/          # Express route bindings
│   │   └── services/        # Email transporters (Nodemailer/SendGrid)
│   ├── tsconfig.json
│   ├── package.json
│   └── .env                 # Environment secrets
└── frontend/                # Vite + React + TypeScript + Tailwind web application
    ├── src/
    │   ├── assets/          # Favicons, logo images, graphics
    │   ├── components/      # Common inputs, buttons, section wrappers
    │   ├── context/         # AuthContext JWT session providers
    │   ├── layouts/         # Split Auth pages and landing page wrappers
    │   ├── pages/           # Signup, Login, Reset password, Verification views
    │   ├── routes/          # Navigation routers and Protected Guards
    │   ├── styles/          # Tailwind custom theme css
    │   ├── utils/           # Axios interceptors config
    │   ├── App.tsx          
    │   └── main.tsx
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## Setup & Running Locally

### Prerequisites
- Node.js (v20+ recommended)
- NPM
- MongoDB Atlas cluster URL (or a local MongoDB server)

---

### Step 1: Configure Backend Environment
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create your `.env` file (copied from `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Set your environment variables inside `.env`:
   - `MONGODB_URI`: Connect to your MongoDB Atlas cluster.
   - `JWT_SECRET`: Define a secret key for signing user tokens.
   - `SMTP_*`: Leave blank to automatically create a free [Ethereal](https://ethereal.email/) sandbox SMTP account on backend startup, or supply your own SMTP credentials/SendGrid API keys.

---

### Step 2: Install and Start Backend
1. Install server dependencies:
   ```bash
   npm install
   ```
2. Run in TypeScript hot-reload development mode:
   ```bash
   npm run dev
   ```
   *The server starts on: `http://localhost:5000`*

---

### Step 3: Install and Start Frontend
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The application will open on: `http://localhost:5173`*

---

## Testing Authentication Flows

1. **Sign Up**: Submit the registration form. Look at your **backend console logs**; the Ethereal dev-mailer will print a clickable mail-sandbox URL where you can view the formatted verification email.
2. **Verify Email**: Click the verification link in the logged sandbox email. The browser redirects to `/verify-email` and updates the database state.
3. **Log In**: Sign in with verified credentials. The JWT token is securely stored in `localStorage`, and you are redirected to the protected dashboard path `/dashboard`.
4. **Guard Checks**: Try to navigate to `http://localhost:5173/dashboard` in an incognito window. The route guard blocks entry and redirects back to `/login`.
