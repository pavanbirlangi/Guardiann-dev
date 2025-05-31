const express = require('express');
const { verifyToken, checkRole } = require('../middlewares/checkAuth');
const { getUserDashboard, getAdminDashboard, getUserProfile, updateUserProfile } = require('../controllers/dashboardController');

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

module.exports = router; 