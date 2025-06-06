const express = require('express');
const { verifyToken, checkRole } = require('../middlewares/checkAuth');
const { getUserDashboard, getAdminDashboard, getUserProfile, updateUserProfile, getUserData, updateUserData, getUserBookings } = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             fullName:
 *               type: string
 *             role:
 *               type: string
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             email:
 *               type: string
 *             full_name:
 *               type: string
 *             phone:
 *               type: string
 *             profile_picture_url:
 *               type: string
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             created_at:
 *               type: string
 *               format: date-time
 *             last_login:
 *               type: string
 *               format: date-time
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         country:
 *           type: string
 *     UserData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User's unique identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         full_name:
 *           type: string
 *           description: User's full name
 *         phone:
 *           type: string
 *           description: User's phone number
 *         profile_picture_url:
 *           type: string
 *           description: URL to user's profile picture
 *         address:
 *           type: string
 *           description: User's full address
 *         city:
 *           type: string
 *           description: User's city
 *         state:
 *           type: string
 *           description: User's state
 *         country:
 *           type: string
 *           description: User's country
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         last_login:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         is_active:
 *           type: boolean
 *           description: Account status
 */

/**
 * @swagger
 * /api/dashboard/user:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/user',
  verifyToken,
  checkRole(['USER']),
  getUserDashboard
);

/**
 * @swagger
 * /api/dashboard/user/profile:
 *   get:
 *     summary: Get user profile data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User profile not found
 */
router.get('/user/profile',
  verifyToken,
  checkRole(['USER']),
  getUserProfile
);

/**
 * @swagger
 * /api/dashboard/user/profile:
 *   put:
 *     summary: Update user profile data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User profile not found
 */
router.put('/user/profile',
  verifyToken,
  checkRole(['USER']),
  updateUserProfile
);

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/admin',
  verifyToken,
  checkRole(['ADMIN']),
  getAdminDashboard
);

/**
 * @swagger
 * /api/dashboard/user/data:
 *   get:
 *     summary: Get complete user data
 *     description: Retrieve all user data including profile information and account status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User data retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserData'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Insufficient permissions
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 */
router.get('/user/data',
    verifyToken,
    checkRole(['USER']),
    getUserData
);

/**
 * @swagger
 * /api/dashboard/user/data:
 *   put:
 *     summary: Update user data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               phone: { type: string }
 *               profile_picture_url: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: User data updated successfully
 *       404:
 *         description: User not found
 */
router.put('/user/data',
  verifyToken,
  checkRole(['USER']),
  updateUserData
);

/**
 * @swagger
 * /api/dashboard/user/bookings:
 *   get:
 *     summary: Get all bookings for the logged-in user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *       404:
 *         description: No bookings found
 */
router.get('/user/bookings',
  verifyToken,
  checkRole(['USER']),
  getUserBookings
);

module.exports = router; 