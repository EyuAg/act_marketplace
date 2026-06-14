function errorHandler(err, req, res, next) {
    console.error('Error:', err.stack);
    
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong. Please try again later.'
        : err.message;
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(status).json({ error: message });
    }
    
    res.status(status).render('pages/error', {
        title: 'Error',
        status: status,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
}

function notFound(req, res) {
    res.status(404).render('pages/404', { 
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
}

module.exports = { errorHandler, notFound };