const validators = {
    isValidEmail(email) {
        const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        return re.test(email);
    },
    
    isValidStudentId(id) {
        const re = /^[A-Za-z0-9]{5,20}$/;
        return re.test(id);
    },
    
    isValidPrice(price) {
        return !isNaN(price) && price > 0;
    },
    
    sanitizeInput(input) {
        return input.toString().trim().replace(/[<>]/g, '');
    }
};

module.exports = validators;