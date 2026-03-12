// ============================================================
// SAFEGUARD — MongoDB Database Connection
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅  MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error(`❌  Database connection failed: ${err.message}`);
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄  MongoDB reconnected.');
});

module.exports = connectDB;
