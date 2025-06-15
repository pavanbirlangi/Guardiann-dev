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
                CAST(b.amount AS FLOAT) as amount,
                b.status,
                b.payment_id,
                b.pdf_url,
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

/**
 * Get admin dashboard statistics
 */
const getAdminStats = async (req, res) => {
  try {
    // Get total stats with monthly growth
    const totalStatsQuery = `
      WITH current_month AS (
        SELECT 
          (SELECT COUNT(*) FROM categories WHERE is_active = true) as total_categories,
          (SELECT COUNT(*) FROM institutions) as total_institutions,
          (SELECT COUNT(*) FROM bookings) as total_bookings,
          (SELECT COALESCE(SUM(CAST(amount AS FLOAT)), 0) FROM bookings WHERE status = 'confirmed') as total_revenue
      ),
      last_month AS (
        SELECT 
          (SELECT COUNT(*) FROM categories WHERE is_active = true) as last_month_categories,
          (SELECT COUNT(*) FROM institutions) as last_month_institutions,
          (SELECT COUNT(*) FROM bookings WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as last_month_bookings,
          (SELECT COALESCE(SUM(CAST(amount AS FLOAT)), 0) FROM bookings 
           WHERE status = 'confirmed' 
           AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as last_month_revenue
      ),
      this_month AS (
        SELECT 
          (SELECT COUNT(*) FROM categories WHERE is_active = true) as new_categories,
          (SELECT COUNT(*) FROM institutions) as new_institutions,
          (SELECT COUNT(*) FROM bookings WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_bookings
      )
      SELECT 
        t.total_categories,
        t.total_institutions,
        t.total_bookings,
        t.total_revenue,
        tm.new_categories as categories_growth,
        tm.new_institutions as institutions_growth,
        tm.new_bookings as bookings_growth,
        CASE 
          WHEN lm.last_month_revenue = 0 THEN 0
          ELSE TRUNC(((t.total_revenue - lm.last_month_revenue)::numeric / lm.last_month_revenue) * 1000) / 10
        END as revenue_growth
      FROM current_month t
      CROSS JOIN last_month lm
      CROSS JOIN this_month tm
    `;

    const totalStatsResult = await pool.query(totalStatsQuery);
    const totalStats = totalStatsResult.rows[0];

    // Get recent bookings
    const recentBookingsQuery = `
      SELECT 
        b.id as booking_id,
        b.visitor_name,
        b.visitor_email,
        b.booking_date,
        b.status,
        CAST(b.amount AS FLOAT) as amount,
        i.name as institution_name,
        c.name as category_name
      FROM bookings b
      JOIN institutions i ON b.institution_id = i.id
      JOIN categories c ON i.category_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `;

    // Get monthly stats for the last 6 months
    const monthlyStatsQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') as month,
        COUNT(*) as bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN CAST(b.amount AS FLOAT) ELSE 0 END), 0) as revenue
      FROM bookings b
      WHERE b.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY DATE_TRUNC('month', b.created_at)
      ORDER BY DATE_TRUNC('month', b.created_at)
    `;

    // Get category distribution
    const categoryStatsQuery = `
      WITH category_data AS (
        SELECT 
          c.name,
          COUNT(b.id) as value,
          ROW_NUMBER() OVER (ORDER BY COUNT(b.id) DESC) as rn
        FROM categories c
        LEFT JOIN institutions i ON c.id = i.category_id
        LEFT JOIN bookings b ON i.id = b.institution_id AND b.status = 'confirmed'
        WHERE c.is_active = true
        GROUP BY c.name, c.id
      )
      SELECT 
        name,
        value,
        CASE 
          WHEN rn % 8 = 1 THEN '#3b82f6'  -- Blue
          WHEN rn % 8 = 2 THEN '#10b981'  -- Green
          WHEN rn % 8 = 3 THEN '#f59e0b'  -- Orange
          WHEN rn % 8 = 4 THEN '#8b5cf6'  -- Purple
          WHEN rn % 8 = 5 THEN '#ef4444'  -- Red
          WHEN rn % 8 = 6 THEN '#06b6d4'  -- Cyan
          WHEN rn % 8 = 7 THEN '#f97316'  -- Deep Orange
          ELSE '#6b7280'                  -- Gray
        END as color
      FROM category_data
      ORDER BY value DESC
    `;

    // Get institution growth
    const institutionGrowthQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as institutions
      FROM institutions
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    const [recentBookings, monthlyStats, categoryStats, institutionGrowth] = await Promise.all([
      pool.query(recentBookingsQuery),
      pool.query(monthlyStatsQuery),
      pool.query(categoryStatsQuery),
      pool.query(institutionGrowthQuery)
    ]);

    // Format the data for the frontend
    const formattedCategoryStats = categoryStats.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value) || 0,
      color: row.color
    }));

    res.json({
      success: true,
      data: {
        totalStats: {
          totalCategories: parseInt(totalStats.total_categories),
          totalInstitutions: parseInt(totalStats.total_institutions),
          totalBookings: parseInt(totalStats.total_bookings),
          totalRevenue: parseFloat(totalStats.total_revenue),
          categoriesGrowth: parseInt(totalStats.categories_growth),
          institutionsGrowth: parseInt(totalStats.institutions_growth),
          bookingsGrowth: parseInt(totalStats.bookings_growth),
          revenueGrowth: parseFloat(totalStats.revenue_growth)
        },
        recentBookings: recentBookings.rows,
        monthlyStats: monthlyStats.rows,
        categoryStats: formattedCategoryStats,
        institutionGrowth: institutionGrowth.rows
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
};

/**
 * Get platform settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPlatformSettings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM platform_settings ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // If no settings exist, create default settings
      const defaultSettings = {
        site_name: 'Guardiann',
        site_description: 'Your trusted partner in finding the perfect educational institution',
        contact_email: 'admin@guardiann.com',
        support_phone: '+91 98765 43210',
        address: {
          street: '',
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        },
        social_media: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: ''
        }
      };

      const insertResult = await pool.query(
        'INSERT INTO platform_settings (site_name, site_description, contact_email, support_phone, address, social_media) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [
          defaultSettings.site_name,
          defaultSettings.site_description,
          defaultSettings.contact_email,
          defaultSettings.support_phone,
          JSON.stringify(defaultSettings.address),
          JSON.stringify(defaultSettings.social_media)
        ]
      );

      return res.json({
        success: true,
        data: {
          siteName: insertResult.rows[0].site_name,
          siteDescription: insertResult.rows[0].site_description,
          contactEmail: insertResult.rows[0].contact_email,
          supportPhone: insertResult.rows[0].support_phone,
          address: insertResult.rows[0].address,
          socialMedia: insertResult.rows[0].social_media
        }
      });
    }

    const settings = result.rows[0];
    res.json({
      success: true,
      data: {
        siteName: settings.site_name,
        siteDescription: settings.site_description,
        contactEmail: settings.contact_email,
        supportPhone: settings.support_phone,
        address: settings.address,
        socialMedia: settings.social_media
      }
    });
  } catch (error) {
    console.error('Error getting platform settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform settings'
    });
  }
};

/**
 * Update platform settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updatePlatformSettings = async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      contactEmail,
      supportPhone,
      address,
      socialMedia
    } = req.body;

    // Validate required fields
    if (!siteName || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Site name and contact email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (supportPhone && !phoneRegex.test(supportPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if settings exist
    const checkResult = await pool.query(
      'SELECT id FROM platform_settings ORDER BY id DESC LIMIT 1'
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new settings if none exist
      result = await pool.query(
        `INSERT INTO platform_settings 
         (site_name, site_description, contact_email, support_phone, address, social_media)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          siteName,
          siteDescription,
          contactEmail,
          supportPhone,
          JSON.stringify(address),
          JSON.stringify(socialMedia)
        ]
      );
    } else {
      // Update existing settings
      result = await pool.query(
        `UPDATE platform_settings 
         SET site_name = $1,
             site_description = $2,
             contact_email = $3,
             support_phone = $4,
             address = $5,
             social_media = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          siteName,
          siteDescription,
          contactEmail,
          supportPhone,
          JSON.stringify(address),
          JSON.stringify(socialMedia),
          checkResult.rows[0].id
        ]
      );
    }

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update settings'
      });
    }

    const settings = result.rows[0];
    res.json({
      success: true,
      data: {
        siteName: settings.site_name,
        siteDescription: settings.site_description,
        contactEmail: settings.contact_email,
        supportPhone: settings.support_phone,
        address: settings.address,
        socialMedia: settings.social_media
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update platform settings'
    });
  }
};

const getPublicPlatformSettings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        site_name as "siteName",
        site_description as "siteDescription",
        contact_email as "contactEmail",
        support_phone as "supportPhone",
        address,
        social_media as "socialMedia"
      FROM platform_settings 
      ORDER BY id DESC 
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Platform settings not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching public platform settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platform settings'
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
    downloadBookingReceipt,
    getAdminStats,
    getPlatformSettings,
    updatePlatformSettings,
    getPublicPlatformSettings
}; 