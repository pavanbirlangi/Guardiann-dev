const { query } = require('../config/database');
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId } = require('../config/cognito');
const Razorpay = require('razorpay');
const crypto = require('crypto');
// const { createOrder, verifyPayment } = require('../services/razorpay');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Institution:
 *       type: object
 *       required:
 *         - name
 *         - category_id
 *         - type
 *         - starting_from
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the institution
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: The UUID of the category this institution belongs to
 *         name:
 *           type: string
 *           description: The name of the institution
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name
 *         description:
 *           type: string
 *           description: Detailed description of the institution
 *         address:
 *           type: string
 *           description: Full address of the institution
 *         city:
 *           type: string
 *           description: City where the institution is located
 *         state:
 *           type: string
 *           description: State where the institution is located
 *         thumbnail_url:
 *           type: string
 *           description: URL of the main image
 *         gallery:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         rating:
 *           type: number
 *           format: float
 *           description: Institution's rating (0-5)
 *         contact:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *             website:
 *               type: string
 *         booking_amount:
 *           type: number
 *           format: float
 *           description: Amount charged for booking a visit
 *         visiting_hours:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *         type:
 *           type: string
 *           description: Type of institution (e.g., International, Engineering, JEE/NEET, MBA)
 *         starting_from:
 *           type: number
 *           format: float
 *           description: Starting fee amount
 *         courses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: string
 *         infrastructure:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon_url:
 *                 type: string
 *         fees:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               period:
 *                 type: string
 *               includes:
 *                 type: array
 *                 items:
 *                   type: string
 */

/**
 * @swagger
 * /api/institutions:
 *   get:
 *     summary: Get all institutions with filters
 *     tags: [Institutions]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by institution type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, city, or state
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *         description: Maximum starting fee
 *     responses:
 *       200:
 *         description: List of institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Institution'
 */
const getAllInstitutions = async (req, res) => {
    try {
        const { city, type, category, search, minRating, maxFee } = req.query;
        let query = `
            SELECT i.*, c.name as category_name
            FROM institutions i
            JOIN categories c ON i.category_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (city) {
            query += ` AND i.city ILIKE $${paramCount}`;
            params.push(`%${city}%`);
            paramCount++;
        }

        if (type) {
            query += ` AND i.type ILIKE $${paramCount}`;
            params.push(`%${type}%`);
            paramCount++;
        }

        if (category) {
            query += ` AND c.slug = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (search) {
            query += ` AND (
                i.name ILIKE $${paramCount}
                OR i.description ILIKE $${paramCount}
                OR i.city ILIKE $${paramCount}
                OR i.state ILIKE $${paramCount}
            )`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (minRating) {
            query += ` AND i.rating >= $${paramCount}`;
            params.push(minRating);
            paramCount++;
        }

        if (maxFee) {
            query += ` AND i.starting_from <= $${paramCount}`;
            params.push(maxFee);
            paramCount++;
        }

        query += ` ORDER BY i.name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching institutions:', error);
        res.status(500).json({ error: 'Failed to fetch institutions' });
    }
};

/**
 * @swagger
 * /api/institutions/{slug}:
 *   get:
 *     summary: Get institution by slug
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Institution slug
 *     responses:
 *       200:
 *         description: Institution details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       404:
 *         description: Institution not found
 */
const getInstitutionBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query(
            `SELECT i.*, c.name as category_name
             FROM institutions i
             JOIN categories c ON i.category_id = c.id
             WHERE i.slug = $1`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching institution:', error);
        res.status(500).json({ error: 'Failed to fetch institution' });
    }
};

/**
 * @swagger
 * /api/institutions:
 *   post:
 *     summary: Create a new institution
 *     tags: [Institutions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Institution'
 *     responses:
 *       201:
 *         description: Institution created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 */
const createInstitution = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['category_id', 'name', 'type', 'starting_from'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const {
            category_id,
            name,
            description,
            address,
            city,
            state,
            thumbnail_url,
            gallery,
            rating,
            contact,
            booking_amount,
            visiting_hours,
            type,
            starting_from,
            courses,
            infrastructure,
            fees
        } = req.body;

        // Validate category_id exists
        const categoryCheck = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [category_id]
        );

        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category_id: Category does not exist'
            });
        }

        // Generate slug from name
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check if slug already exists
        const slugCheck = await pool.query(
            'SELECT id FROM institutions WHERE slug = $1',
            [slug]
        );

        if (slugCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An institution with this name already exists'
            });
        }

        // Ensure JSON fields are properly formatted
        const galleryArray = Array.isArray(gallery) ? gallery : [];
        const visitingHoursArray = Array.isArray(visiting_hours) ? visiting_hours.map(hour => ({
            day: hour.day,
            start_time: hour.start_time,
            end_time: hour.end_time
        })) : [];
        const coursesArray = Array.isArray(courses) ? courses : [];
        const infrastructureArray = Array.isArray(infrastructure) ? infrastructure : [];
        const contactObj = typeof contact === 'object' ? contact : {};
        const feesObj = typeof fees === 'object' ? fees : {};

        // Create institution
        const result = await pool.query(
            `INSERT INTO institutions (
                id, category_id, name, slug, description, address, city, state,
                thumbnail_url, gallery, rating, contact, booking_amount, visiting_hours,
                type, starting_from, courses, infrastructure, fees
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *`,
            [
                uuidv4(),
                category_id,
                name,
                slug,
                description || null,
                address || null,
                city || null,
                state || null,
                thumbnail_url || null,
                JSON.stringify(galleryArray),
                rating || 0,
                JSON.stringify(contactObj),
                booking_amount || 0,
                JSON.stringify(visitingHoursArray),
                type,
                starting_from,
                JSON.stringify(coursesArray),
                JSON.stringify(infrastructureArray),
                JSON.stringify(feesObj)
            ]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating institution:', error);
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({
                success: false,
                message: 'An institution with this name or slug already exists'
            });
        }
        
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Invalid category_id: Category does not exist'
            });
        }

        if (error.code === '22P02') { // Invalid JSON syntax
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data format',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create institution',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @swagger
 * /api/institutions/{id}:
 *   put:
 *     summary: Update an institution
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Institution ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Institution'
 *     responses:
 *       200:
 *         description: Institution updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Institution'
 *       404:
 *         description: Institution not found
 */
const updateInstitution = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            category_id,
            name,
            description,
            address,
            city,
            state,
            thumbnail_url,
            gallery,
            rating,
            contact,
            booking_amount,
            visiting_hours,
            type,
            starting_from,
            courses,
            infrastructure,
            fees
        } = req.body;

        // Validate required fields
        const requiredFields = ['category_id', 'name', 'type', 'starting_from'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate category_id exists
        const categoryCheck = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [category_id]
        );

        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category_id: Category does not exist'
            });
        }

        // Check if institution exists
        const institutionCheck = await pool.query(
            'SELECT id FROM institutions WHERE id = $1',
            [id]
        );

        if (institutionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        // Ensure JSON fields are properly formatted
        const galleryArray = Array.isArray(gallery) ? gallery : [];
        const visitingHoursArray = Array.isArray(visiting_hours) ? visiting_hours.map(hour => ({
            day: hour.day,
            start_time: hour.start_time,
            end_time: hour.end_time
        })) : [];
        const coursesArray = Array.isArray(courses) ? courses : [];
        const infrastructureArray = Array.isArray(infrastructure) ? infrastructure : [];
        const contactObj = typeof contact === 'object' ? contact : {};
        const feesObj = typeof fees === 'object' ? fees : {};

        const result = await pool.query(
            `UPDATE institutions
             SET category_id = $1,
                 name = $2,
                 description = $3,
                 address = $4,
                 city = $5,
                 state = $6,
                 thumbnail_url = $7,
                 gallery = $8,
                 rating = $9,
                 contact = $10,
                 booking_amount = $11,
                 visiting_hours = $12,
                 type = $13,
                 starting_from = $14,
                 courses = $15,
                 infrastructure = $16,
                 fees = $17,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $18
             RETURNING *`,
            [
                category_id,
                name,
                description || null,
                address || null,
                city || null,
                state || null,
                thumbnail_url || null,
                JSON.stringify(galleryArray),
                rating || 0,
                JSON.stringify(contactObj),
                booking_amount || 0,
                JSON.stringify(visitingHoursArray),
                type,
                starting_from,
                JSON.stringify(coursesArray),
                JSON.stringify(infrastructureArray),
                JSON.stringify(feesObj),
                id
            ]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating institution:', error);
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({
                success: false,
                message: 'An institution with this name already exists'
            });
        }
        
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Invalid category_id: Category does not exist'
            });
        }

        if (error.code === '22P02') { // Invalid JSON syntax
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data format',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update institution',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @swagger
 * /api/institutions/{id}:
 *   delete:
 *     summary: Delete an institution
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Institution ID
 *     responses:
 *       200:
 *         description: Institution deleted successfully
 *       404:
 *         description: Institution not found
 */
const deleteInstitution = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM institutions WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        res.json({ message: 'Institution deleted successfully' });
    } catch (error) {
        console.error('Error deleting institution:', error);
        res.status(500).json({ error: 'Failed to delete institution' });
    }
};

/**
 * @swagger
 * /api/institutions/list/{category}:
 *   get:
 *     summary: Get institutions by category slug
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by institution type
 *     responses:
 *       200:
 *         description: List of institutions in the category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Institution'
 */
const getInstitutionsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { city, type } = req.query;

        console.log('Fetching institutions for category:', category);
        console.log('Query parameters:', { city, type });

        // First, get the category ID from the slug
        const categoryResult = await pool.query(
            'SELECT id FROM categories WHERE slug = $1',
            [category]
        );

        console.log('Category query result:', categoryResult.rows);

        if (categoryResult.rows.length === 0) {
            console.log('Category not found:', category);
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const categoryId = categoryResult.rows[0].id;
        console.log('Found category ID:', categoryId);

        let query = `
            SELECT i.*, c.name as category_name
            FROM institutions i
            JOIN categories c ON i.category_id = c.id
            WHERE i.category_id = $1
        `;
        const params = [categoryId];
        let paramCount = 2;

        if (city) {
            query += ` AND i.city ILIKE $${paramCount}`;
            params.push(`%${city}%`);
            paramCount++;
        }

        if (type) {
            query += ` AND i.type ILIKE $${paramCount}`;
            params.push(`%${type}%`);
            paramCount++;
        }

        query += ` ORDER BY i.name`;

        console.log('Executing query:', query);
        console.log('Query parameters:', params);

        const result = await pool.query(query, params);
        
        console.log('Query result:', result.rows);

        if (result.rows.length === 0) {
            console.log('No institutions found for category:', category);
            return res.status(404).json({
                success: false,
                message: 'No institutions found for this category'
            });
        }

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching institutions by category:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch institutions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @swagger
 * /api/institutions/details/{id}:
 *   get:
 *     summary: Get institution details by ID
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Institution ID
 *     responses:
 *       200:
 *         description: Institution details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Institution'
 *       404:
 *         description: Institution not found
 */
const getInstitutionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT i.*, c.name as category_name
             FROM institutions i
             JOIN categories c ON i.category_id = c.id
             WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching institution details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch institution details'
        });
    }
};

/**
 * @swagger
 * /api/institutions/book:
 *   post:
 *     summary: Create a booking
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - institution_id
 *               - visit_date
 *               - visit_time
 *               - amount
 *             properties:
 *               institution_id:
 *                 type: string
 *                 format: uuid
 *               visit_date:
 *                 type: string
 *                 format: date
 *               visit_time:
 *                 type: string
 *                 format: time
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *               contact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *     responses:
 *       200:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
const createBooking = async (req, res) => {
    try {
        const {
            institution_id,
            visit_date,
            visit_time,
            amount,
            notes,
            visitor_name,
            visitor_email,
            visitor_phone
        } = req.body;

        console.log('Received booking request:', {
            institution_id,
            visit_date,
            visit_time,
            amount,
            notes,
            visitor_name,
            visitor_email,
            visitor_phone
        });

        const userId = req.user.id;
        console.log('User ID:', userId);

        // Create booking with pending status
        const result = await pool.query(
            `INSERT INTO bookings (
                user_id,
                institution_id,
                status,
                visit_date,
                visit_time,
                amount,
                notes,
                visitor_name,
                visitor_email,
                visitor_phone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                userId,
                institution_id,
                'pending',
                visit_date,
                visit_time,
                amount,
                notes,
                visitor_name,
                visitor_email,
                visitor_phone
            ]
        );

        console.log('Booking created:', result.rows[0]);

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: result.rows[0].booking_id,
            notes: {
                booking_id: result.rows[0].booking_id
            }
        };

        console.log('Creating Razorpay order with options:', options);

        const order = await razorpay.orders.create(options);
        console.log('Razorpay order created:', order);

        res.json({
            success: true,
            data: {
                booking: result.rows[0],
                payment: {
                    order_id: order.id,
                    amount: order.amount,
                    currency: order.currency
                }
            }
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getBookingDetails = async (req, res) => {
    try {
        const { booking_id } = req.params;

        // Get booking details with institution and category information
        const result = await pool.query(
            `SELECT 
                b.*,
                i.name as institution_name,
                i.thumbnail_url,
                i.address as institution_address,
                i.city as institution_city,
                i.state as institution_state,
                i.contact as institution_contact,
                i.visiting_hours,
                c.name as category_name,
                c.slug as category_slug
            FROM bookings b
            LEFT JOIN institutions i ON b.institution_id = i.id
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE b.booking_id = $1`,
            [booking_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Transform the data
        const booking = {
            ...result.rows[0],
            institution_contact: result.rows[0].institution_contact || {},
            visiting_hours: result.rows[0].visiting_hours || [],
            thumbnail_url: result.rows[0].thumbnail_url || null
        };

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create Razorpay order
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, booking_id } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({
        success: false,
        message: 'Amount and booking_id are required'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: booking_id,
      notes: {
        booking_id: booking_id
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
};

// Verify Razorpay payment webhook
const verifyPaymentWebhook = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id
    } = req.body;

    console.log('Verifying payment:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id
    });

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update booking status and payment details
      const result = await pool.query(
        `UPDATE bookings 
         SET status = 'confirmed', 
             payment_id = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = $2
         RETURNING *`,
        [razorpay_payment_id, booking_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      console.log('Payment verified and booking updated:', result.rows[0]);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: result.rows[0]
      });
    } else {
      console.error('Invalid payment signature');
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all functions
module.exports = {
    getAllInstitutions,
    getInstitutionBySlug,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    getInstitutionsByCategory,
    getInstitutionDetails,
    createBooking,
    getBookingDetails,
    createPaymentOrder,
    verifyPaymentWebhook
}; 