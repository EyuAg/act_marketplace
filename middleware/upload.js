const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// File upload configuration
const uploadConfig = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    
    validateFile(file) {
        if (!file) return { valid: false, error: 'No file provided' };
        
        if (file.size > this.maxSize) {
            return { valid: false, error: 'File too large. Max 5MB' };
        }
        
        if (!this.allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Invalid file type. Use JPEG, PNG, or WebP' };
        }
        
        return { valid: true };
    },
    
    generateFilename(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = path.extname(originalName).toLowerCase();
        return `${timestamp}-${random}${ext}`;
    }
};

module.exports = { uploadConfig };
