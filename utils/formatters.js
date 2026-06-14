const formatters = {
    formatPrice(price) {
        return `ETB ${parseFloat(price).toFixed(2)}`;
    },
    
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            if (hours < 1) return 'Just now';
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
        
        return d.toLocaleDateString();
    },
    
    truncate(str, length) {
        if (str.length <= length) return str;
        return str.substr(0, length) + '...';
    }
};

module.exports = formatters;