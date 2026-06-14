require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fileUpload = require('express-fileupload');

// Import modular configurations and pool
const sessionConfig = require('./config/session');
const { loadUserData } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const {
    authLimiter,
    cors,
    corsOptions,
    generalLimiter,
    helmet,
    requestLogger
} = require('./middleware/security');

// Import modular routers
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const myListingsRoutes = require('./routes/my-listings');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const messagesRouter = require('./routes/messages');

const app = express();

// ============ ENGINE SETUP ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ============ GLOBAL MIDDLEWARES ============
app.use((req, res, next) => {
    res.locals.user = null;
    res.locals.isAdmin = false;
    res.locals.unreadCount = 0;
    next();
});
app.use(requestLogger());
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(generalLimiter);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true
}));
app.use(session(sessionConfig));

// Inject user variables globally to all templates
app.use(loadUserData);

// ============ ROUTE MOUNTING ============
app.use('/', indexRoutes);            // /, /about, /contact
app.use(['/login', '/register', '/forgot-password', '/reset-password'], authLimiter);
app.use('/', authRoutes);             // /login, /register, /logout
app.use('/listings', listingsRoutes); // /listings, /listings/search, /listings/:id
app.use('/my-listings', myListingsRoutes); // /my-listings, /my-listings/create, etc.
app.use('/profile', profileRoutes);   // /profile, /profile/:id
app.use('/admin', adminRoutes);       // /admin, /admin/users, etc.
app.use('/messages', messagesRouter);

// ============ ERROR HANDLERS ============
app.use(notFound);
app.use(errorHandler);

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════
    🎓 ACT Marketplace is running!
    📍 http://localhost:${PORT}
    ═══════════════════════════════════════
    `);
});

module.exports = app;