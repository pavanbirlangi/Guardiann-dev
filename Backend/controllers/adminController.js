const { query } = require('../config/database');
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');

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

/**
 * Get all bookings with filtering options
 */
const getAllBookings = async (req, res) => {
    try {
        const { status, category, search } = req.query;
        let query = `
            SELECT 
                b.booking_id,
                b.visitor_name,
                b.visitor_email,
                b.visitor_phone,
                b.booking_date,
                b.visit_date,
                b.visit_time,
                b.amount,
                b.status,
                b.payment_id,
                i.name as institution_name,
                c.name as category_name
            FROM bookings b
            JOIN institutions i ON b.institution_id = i.id
            JOIN categories c ON i.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ` AND b.status = $${params.length + 1}`;
            params.push(status);
        }

        if (category && category !== 'all') {
            query += ` AND c.name = $${params.length + 1}`;
            params.push(category);
        }

        if (search) {
            query += ` AND (
                b.visitor_name ILIKE $${params.length + 1} OR
                i.name ILIKE $${params.length + 1} OR
                b.booking_id ILIKE $${params.length + 1}
            )`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY b.booking_date DESC`;

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
};

/**
 * Update booking status
 */
const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const result = await pool.query(
            'UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING *',
            [status, bookingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking status'
        });
    }
};

/**
 * Generate and download booking receipt
 */
const downloadBookingReceipt = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await pool.query(`
            SELECT 
                b.*,
                i.name as institution_name,
                i.address as institution_address,
                i.city as institution_city,
                i.state as institution_state
            FROM bookings b
            JOIN institutions i ON b.institution_id = i.id
            WHERE b.booking_id = $1
        `, [bookingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = result.rows[0];

        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${bookingId}.pdf`);

        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('Booking Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Booking ID: ${booking.booking_id}`);
        doc.text(`Institution: ${booking.institution_name}`);
        doc.text(`Visitor: ${booking.visitor_name}`);
        doc.text(`Email: ${booking.visitor_email}`);
        doc.text(`Phone: ${booking.visitor_phone}`);
        doc.text(`Visit Date: ${booking.visit_date}`);
        doc.text(`Visit Time: ${booking.visit_time}`);
        doc.text(`Amount: ₹${booking.amount}`);
        doc.text(`Status: ${booking.status}`);
        doc.text(`Payment ID: ${booking.payment_id}`);
        doc.moveDown();
        doc.text(`Institution Address: ${booking.institution_address}, ${booking.institution_city}, ${booking.institution_state}`);

        doc.end();
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate receipt'
        });
    }
};

module.exports = {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getAllBookings,
    updateBookingStatus,
    downloadBookingReceipt
}; 