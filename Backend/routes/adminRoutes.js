const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middlewares/checkAuth');
const {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getAllBookings,
    updateBookingStatus,
    downloadBookingReceipt,
    getAdminStats
} = require('../controllers/adminController');

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get public platform settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Platform settings retrieved successfully
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
 *                     siteName:
 *                       type: string
 *                     siteDescription:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                     supportPhone:
 *                       type: string
 *                     address:
 *                       type: object
 *                     socialMedia:
 *                       type: object
 */
router.get('/settings', adminController.getPublicPlatformSettings);

// Admin routes with authentication
router.use(verifyToken);
router.use(checkRole(['ADMIN']));

/**
 * @swagger
 * /api/dashboard/admin/categories:
 *   get:
 *     summary: Get all categories (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
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
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/categories', getAllCategories);

/**
 * @swagger
 * /api/dashboard/admin/categories:
 *   post:
 *     summary: Add a new category (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Description of the category
 *               icon_url:
 *                 type: string
 *                 description: URL of the category icon
 *               subcategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of subcategories
 *               display_order:
 *                 type: integer
 *                 description: Order in which the category should be displayed
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input or category already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/categories', addCategory);

/**
 * @swagger
 * /api/dashboard/admin/categories/{id}:
 *   put:
 *     summary: Update a category (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Description of the category
 *               icon_url:
 *                 type: string
 *                 description: URL of the category icon
 *               subcategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of subcategories
 *               display_order:
 *                 type: integer
 *                 description: Order in which the category should be displayed
 *               is_active:
 *                 type: boolean
 *                 description: Whether the category is active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input or category name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put('/categories/:id', updateCategory);

/**
 * @swagger
 * /api/dashboard/admin/categories/{id}:
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete category with associated institutions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete('/categories/:id', deleteCategory);

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         booking_id:
 *           type: string
 *           description: Unique booking identifier
 *         visitor_name:
 *           type: string
 *           description: Name of the visitor
 *         visitor_email:
 *           type: string
 *           format: email
 *           description: Email of the visitor
 *         visitor_phone:
 *           type: string
 *           description: Phone number of the visitor
 *         booking_date:
 *           type: string
 *           format: date-time
 *           description: Date when the booking was made
 *         visit_date:
 *           type: string
 *           format: date
 *           description: Date of the visit
 *         visit_time:
 *           type: string
 *           format: time
 *           description: Time of the visit
 *         amount:
 *           type: number
 *           description: Booking amount
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           description: Current status of the booking
 *         payment_id:
 *           type: string
 *           description: Payment reference ID
 *         institution_name:
 *           type: string
 *           description: Name of the institution
 *         category_name:
 *           type: string
 *           description: Category of the institution
 */

/**
 * @swagger
 * /api/dashboard/admin/bookings:
 *   get:
 *     summary: Get all bookings with filtering options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, confirmed, cancelled]
 *         description: Filter by booking status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by institution category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in visitor name, institution name, or booking ID
 *     responses:
 *       200:
 *         description: List of bookings
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
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/bookings', getAllBookings);

/**
 * @swagger
 * /api/dashboard/admin/bookings/{bookingId}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *                 description: New status for the booking
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/bookings/:bookingId/status', updateBookingStatus);

/**
 * @swagger
 * /api/dashboard/admin/bookings/{bookingId}/receipt:
 *   get:
 *     summary: Download booking receipt
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: PDF receipt file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/bookings/:bookingId/receipt', downloadBookingReceipt);

/**
 * @swagger
 * /api/dashboard/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', getAdminStats);

/**
 * @swagger
 * /api/dashboard/admin/settings:
 *   get:
 *     summary: Get platform settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/settings', adminController.getPlatformSettings);

/**
 * @swagger
 * /api/dashboard/admin/settings:
 *   put:
 *     summary: Update platform settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *               siteDescription:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               supportPhone:
 *                 type: string
 *               address:
 *                 type: object
 *               socialMedia:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/settings', adminController.updatePlatformSettings);

module.exports = router; 