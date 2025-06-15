const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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
router.get('/', adminController.getPublicPlatformSettings);

module.exports = router; 