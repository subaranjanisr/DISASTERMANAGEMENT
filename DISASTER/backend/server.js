// ============================================================
// SAFEGUARD - Main Server Entry Point
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Route imports
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');
const drillRoutes = require('./routes/drill.routes');
const achievementRoutes = require('./routes/achievement.routes');
const moduleRoutes = require('./routes/module.routes');

const errorHandler = require('./middleware/error.middleware');

const app = express();

// -------------------------------------------------------
// Database Connection
// -------------------------------------------------------
connectDB();

// -------------------------------------------------------
// Security Middleware
// -------------------------------------------------------

// Set security HTTP headers
app.use(helmet());

// Enable CORS
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://127.0.0.1:5500',   // Live Server (VSCode)
        'http://localhost:5500',
        'null',                   // Important for file:// local testing
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate Limiting — Global
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please wait 15 minutes.',
    },
});
app.use('/api/v1/auth', authLimiter);

// Data Sanitization — NoSQL injection
app.use(mongoSanitize());

// Data Sanitization — XSS attacks
app.use(xssClean());

// -------------------------------------------------------
// Request Parsing
// -------------------------------------------------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP Request Logger (development mode)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// -------------------------------------------------------
// API Routes
// -------------------------------------------------------
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/drills`, drillRoutes);
app.use(`${API}/achievements`, achievementRoutes);
app.use(`${API}/modules`, moduleRoutes);

// Health-check route
app.get(`${API}/health`, (req, res) => {
    res.status(200).json({
        success: true,
        message: '🛡️ SAFEGUARD API is healthy and running.',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
    });
});

// -------------------------------------------------------
// Global Error Handler
// -------------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------------
// Start Server
// -------------------------------------------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`💥  Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`💥  Uncaught Exception: ${err.message}`);
    process.exit(1);
});

module.exports = app;
