const pool = require('../config/database');

const categoryController = {
    // Get all active categories
    getAllCategories: async (req, res) => {
        try {
            const query = `
                SELECT id, name, slug, description, subcategories, display_order
                FROM categories
                WHERE is_active = true
                ORDER BY display_order ASC
            `;
            
            const result = await pool.query(query);
            
            res.status(200).json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching categories',
                error: error.message
            });
        }
    }
};

module.exports = categoryController; 