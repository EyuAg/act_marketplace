const path = require('path');

module.exports = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    uploadDir: path.join(__dirname, '../public/uploads'),
    
    generateFilename(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = path.extname(originalName);
        return `${timestamp}-${random}${ext}`;
    }
};