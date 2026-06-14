const validator = require('validator');

const allowedCategories = ['Textbooks', 'Electronics', 'Clothing', 'Furniture', 'Other'];
const allowedConditions = ['New', 'Like New', 'Good', 'Fair'];

function cleanText(value) {
    return validator.trim(String(value || ''));
}

const validateRegistration = (req, res, next) => {
    const { name, email, student_id, password, confirm_password } = req.body;
    const errors = [];
    const cleanName = cleanText(name);
    const cleanEmail = validator.normalizeEmail(cleanText(email)) || '';
    const cleanStudentId = cleanText(student_id);
    
    if (cleanName.length < 2 || cleanName.length > 100) {
        errors.push('Name must be at least 2 characters');
    }
    
    if (!cleanEmail || !validator.isEmail(cleanEmail)) {
        errors.push('Valid email is required');
    }
    
    if (cleanStudentId.length < 5 || cleanStudentId.length > 20) {
        errors.push('Valid Student ID is required');
    }
    
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    if (password !== confirm_password) {
        errors.push('Passwords do not match');
    }
    
    if (errors.length > 0) {
        return res.render('pages/register', { 
            title: 'Register', 
            error: errors.join(', '),
            formData: req.body
        });
    }

    req.body.name = cleanName;
    req.body.email = cleanEmail;
    req.body.student_id = cleanStudentId;
    
    next();
};

const validateListing = (req, res, next) => {
    const { title, description, price, category, condition } = req.body;
    const errors = [];
    const cleanTitle = cleanText(title);
    const cleanDescription = cleanText(description);
    const numericPrice = Number(price);
    
    if (cleanTitle.length < 3 || cleanTitle.length > 200) {
        errors.push('Title must be at least 3 characters');
    }
    
    if (cleanDescription.length < 10 || cleanDescription.length > 2000) {
        errors.push('Description must be at least 10 characters');
    }
    
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 1000000) {
        errors.push('Valid price is required');
    }
    
    if (!allowedCategories.includes(category)) {
        errors.push('Category is required');
    }
    
    if (!allowedConditions.includes(condition)) {
        errors.push('Condition is required');
    }
    
    if (errors.length > 0) {
        const isEdit = req.path.startsWith('/edit/');
        return res.render(isEdit ? 'pages/edit-listing' : 'pages/create-listing', {
            title: isEdit ? 'Edit Listing' : 'Sell an Item',
            error: errors.join(', '),
            formData: req.body,
            listing: { id: req.params.id, title, description, price, category, condition }
        });
    }

    req.body.title = cleanTitle;
    req.body.description = cleanDescription;
    req.body.price = numericPrice.toFixed(2);
    
    next();
};

module.exports = { validateRegistration, validateListing };
