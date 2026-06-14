const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const corsOptions = {
    origin: true,
    credentials: true
};

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many attempts. Please try again later.'
});

function requestLogger() {
    const logsDir = path.join(__dirname, '../logs');
    fs.mkdirSync(logsDir, { recursive: true });

    const accessLog = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
    return morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        stream: process.env.NODE_ENV === 'production' ? accessLog : process.stdout
    });
}

module.exports = {
    helmet,
    cors,
    corsOptions,
    generalLimiter,
    authLimiter,
    requestLogger
};
