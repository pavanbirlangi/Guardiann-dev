const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate slug from name
const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM categories ORDER BY display_order ASC'
        );

        res.json({
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
};

// Add new category
const addCategory = async (req, res) => {
    try {
        const { name, description, icon_url, subcategories, display_order } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const slug = generateSlug(name);

        // Check if slug already exists
        const existingCategory = await query(
            'SELECT id FROM categories WHERE slug = $1',
            [slug]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A category with this name already exists'
            });
        }

        const result = await query(
            `INSERT INTO categories 
            (id, name, slug, description, icon_url, subcategories, display_order) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [
                uuidv4(),
                name,
                slug,
                description || null,
                icon_url || null,
                subcategories || [],
                display_order || 0
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon_url, subcategories, display_order, is_active } = req.body;

        // Check if category exists
        const existingCategory = await query(
            'SELECT * FROM categories WHERE id = $1',
            [id]
        );

        if (existingCategory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // If name is being updated, generate new slug
        let slug = existingCategory.rows[0].slug;
        if (name && name !== existingCategory.rows[0].name) {
            slug = generateSlug(name);
            
            // Check if new slug already exists
            const slugExists = await query(
                'SELECT id FROM categories WHERE slug = $1 AND id != $2',
                [slug, id]
            );

            if (slugExists.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'A category with this name already exists'
                });
            }
        }

        const result = await query(
            `UPDATE categories 
            SET name = COALESCE($1, name),
                slug = $2,
                description = COALESCE($3, description),
                icon_url = COALESCE($4, icon_url),
                subcategories = COALESCE($5, subcategories),
                display_order = COALESCE($6, display_order),
                is_active = COALESCE($7, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *`,
            [
                name,
                slug,
                description,
                icon_url,
                subcategories,
                display_order,
                is_active,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const existingCategory = await query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );

        if (existingCategory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has associated institutions
        const hasInstitutions = await query(
            'SELECT id FROM institutions WHERE category_id = $1 LIMIT 1',
            [id]
        );

        if (hasInstitutions.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with associated institutions'
            });
        }

        await query('DELETE FROM categories WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
}; 