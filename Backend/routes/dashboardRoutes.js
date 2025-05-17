const express = require('express');
const { verifyToken, checkRole } = require('../middlewares/checkAuth');
const { getUserDashboard, getAdminDashboard } = require('../controllers/dashboardController');

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