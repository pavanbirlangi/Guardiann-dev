const express = require('express');
const router = express.Router();
const {
    getAllInstitutions,
    getInstitutionBySlug,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    getInstitutionsByCategory,
    getInstitutionDetails
} = require('../controllers/institutionController');
const { verifyToken, checkRole } = require('../middlewares/checkAuth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Institution:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         country:
 *           type: string
 *         thumbnail_url:
 *           type: string
 *         rating:
 *           type: number
 *         type:
 *           type: string
 *         category_name:
 *           type: string
 *         category_slug:
 *           type: string
 *         average_rating:
 *           type: number
 *         total_bookings:
 *           type: integer
 *     InstitutionDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Institution'
 *         - type: object
 *           properties:
 *             images:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   url:
 *                     type: string
 *                   is_thumbnail:
 *                     type: boolean
 *             courses:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   fee_range_min:
 *                     type: number
 *                   fee_range_max:
 *                     type: number
 *             infrastructure:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   icon_url:
 *                     type: string
 *             fees:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   course_level:
 *                     type: string
 *                   fee_amount:
 *                     type: number
 *                   fee_currency:
 *                     type: string
 *                   fee_type:
 *                     type: string
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_id:
 *           type: string
 *         institution_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         visit_date:
 *           type: string
 *           format: date
 *         visit_time:
 *           type: string
 *           format: time
 *         amount:
 *           type: number
 *         institution_name:
 *           type: string
 *         institution_thumbnail:
 *           type: string
 */

/**
 * @swagger
 * /api/institutions/list/{category}:
 *   get:
 *     summary: Get institutions by category
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     institutions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Institution'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */

/**
 * @swagger
 * /api/institutions/details/{id}:
 *   get:
 *     summary: Get institution details
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
 *                   $ref: '#/components/schemas/InstitutionDetails'
 *       404:
 *         description: Institution not found
 */

/**
 * @swagger
 * /api/institutions/search:
 *   get:
 *     summary: Search institutions
 *     tags: [Institutions]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Search results
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

/**
 * @swagger
 * /api/institutions/filter:
 *   get:
 *     summary: Filter institutions
 *     tags: [Institutions]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
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
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *         description: Maximum fee
 *     responses:
 *       200:
 *         description: Filtered institutions
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

/**
 * @swagger
 * /api/institutions/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings
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
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */

// Public routes
router.get('/', getAllInstitutions);
router.get('/list/:category', getInstitutionsByCategory);
router.get('/details/:id', getInstitutionDetails);
router.get('/:slug', getInstitutionBySlug);

// Admin routes
router.post('/', verifyToken, checkRole(['ADMIN']), createInstitution);
router.put('/:id', verifyToken, checkRole(['ADMIN']), updateInstitution);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), deleteInstitution);

module.exports = router; 