// Static category definitions — kept in-memory (no DB table needed)
const CATEGORIES = [
    { slug: 'Textbooks',   label: 'Textbooks',    icon: '📚' },
    { slug: 'Electronics', label: 'Electronics',  icon: '💻' },
    { slug: 'Furniture',   label: 'Furniture',    icon: '🪑' },
    { slug: 'Clothing',    label: 'Clothing',     icon: '👕' },
    { slug: 'Sports',      label: 'Sports',       icon: '⚽' },
    { slug: 'Stationery',  label: 'Stationery',   icon: '✏️'  },
    { slug: 'Other',       label: 'Other',        icon: '📦' },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

class Category {
    static getAll() {
        return CATEGORIES;
    }

    static getConditions() {
        return CONDITIONS;
    }

    static findBySlug(slug) {
        return CATEGORIES.find(c => c.slug === slug) || null;
    }

    static getSlugs() {
        return CATEGORIES.map(c => c.slug);
    }
}

module.exports = Category;