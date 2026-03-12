# 🛡️ SAFEGUARD - Disaster Preparedness Learning Platform

SafeGuard is a secure, role-based platform designed to prepare students and administrators for real-world disasters through immersive VR drills, AI-powered tutoring, and comprehensive progress tracking.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and update the MONGO_URI and JWT_SECRET
cp .env.example .env

# Start dev server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if any, currently uses vanilla JS/CSS)
npm install

# Start local server (e.g., Live Server or any static host)
# Default API endpoint is http://localhost:5000
```

> **Troubleshooting**
> * If you see a "Server error: Failed to fetch" message in the browser console it
>   means the frontend could not contact the backend. Make sure the API is running
>   (see step 2) and that the `API_BASE` constant in `login.js`/`signup.js` is pointing
>   at the correct host/port. The scripts will automatically use `window.location.origin`
>   when possible to avoid CORS issues.
> * For development the backend’s CORS options already allow common localhost origins,
>   but if you serve the frontend from a different domain add that origin or use a
>   proxy.


---

## 🏛️ Architecture & Folder Structure

The project follows a clean **MVC (Model-View-Controller)** structure for maintainability and scalability.

### 🏠 Backend (`/backend`)
- **`config/`**: Database configuration and central setup.
- **`models/`**: Mongoose schemas for Users, Drills, Modules, and Achievements.
- **`controllers/`**: Core logic for Authentication, Student profiles, and Admin dashboard.
- **`routes/`**: API endpoint definitions (v1).
- **`middleware/`**: JWT validation, Role-based Access Control (RBAC), and error handling.
- **`utils/`**: Helper functions for JWT generation, Emails, and API responses.

### 🎨 Frontend (`/frontend`)
- **`signup.html/css/js`**: Multi-step registration for Students and Admins.
- **`login.html/css/js`**: Secure entry point with role-based routing.
- **`admin-dashboard.html/css/js`**: Institutional analytics portal for administrators.
- **`styles.css` / `script.js`**: Core platform branding and dashboard components.

---

## 🔐 Security Features

- **JWT Authentication**: Secure stateless authentication using Access and Refresh tokens.
- **Password Hashing**: Industry-standard `bcryptjs` encryption.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `student`, `admin`, and `superadmin`.
- **Validation**: Strict input validation using `express-validator`.
- **Protected Routes**: Security middleware to prevent unauthorized data access.
- **Account Lockout**: Temporary lockout after multiple failed login attempts.

---

## 🕹️ Key Features

- **Immersive VR Drills**: (Logic ready for integration)
- **Preparedness Score**: Dynamic scoring based on drill completion and accuracy.
- **AI Safety Tutor**: Intelligent chatbot for on-the-spot safety guidance.
- **Institutional Analytics**: Admins can monitor the safety level of their entire campus.
- **Gamified Achievements**: XP points, badges, and streaks to encourage regular training.

---

## 📄 License
© 2026 SAFEGUARD. All rights reserved. Every life matters.
