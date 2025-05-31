const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/checkAuth');
const {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/adminController');

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
router.get('/categories',
    verifyToken,
    checkRole(['ADMIN']),
    getAllCategories
);

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
router.post('/categories',
    verifyToken,
    checkRole(['ADMIN']),
    addCategory
);

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
router.put('/categories/:id',
    verifyToken,
    checkRole(['ADMIN']),
    updateCategory
);

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
router.delete('/categories/:id',
    verifyToken,
    checkRole(['ADMIN']),
    deleteCategory
);

module.exports = router; 