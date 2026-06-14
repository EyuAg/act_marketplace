require('dotenv').config();

module.exports = {
    secret: process.env.SESSION_SECRET || 'default_secret_change_me',
    name: 'act.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 86400000, // 24 hours
        sameSite: 'lax'
    }
};
