const express = require('express');
const { body } = require('express-validator');
const { login, logout, completeNewPasswordChallenge, refreshToken } = require('../controllers/authController');
const { register, verifyEmail, forgotPassword, confirmForgotPassword } = require('../controllers/registerController');
const { verifyToken } = require('../middlewares/checkAuth');
const { handleGoogleCallback } = require('../controllers/oauthController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 8 characters)
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         tokens:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *             idToken:
 *               type: string
 *         user:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             role:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/register',
  [
    body('fullName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  register
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user's email with code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid verification code
 */
router.post('/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').notEmpty()
  ],
  verifyEmail
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  login
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout',
  verifyToken,
  [
    body('accessToken').notEmpty()
  ],
  logout
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Initiate forgot password process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code sent
 *       400:
 *         description: Invalid email
 */
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
  ],
  forgotPassword
);

/**
 * @swagger
 * /api/auth/confirm-forgot-password:
 *   post:
 *     summary: Reset password with verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid input
 */
router.post('/confirm-forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  confirmForgotPassword
);

/**
 * @swagger
 * /api/auth/complete-new-password:
 *   post:
 *     summary: Complete new password challenge
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *               - session
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 characters)
 *               session:
 *                 type: string
 *                 description: Session token from NEW_PASSWORD_REQUIRED challenge
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     idToken:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid session
 */
router.post('/complete-new-password',
    [
        body('email').isEmail().normalizeEmail(),
        body('newPassword').isLength({ min: 8 }),
        body('session').notEmpty()
    ],
    completeNewPasswordChallenge
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to use for getting a new access token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token',
  [
    body('refreshToken').notEmpty()
  ],
  refreshToken
);

// Google OAuth routes
router.get('/google', (req, res) => {
  const { redirect_uri } = req.query;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=email profile` +
    `&access_type=offline` +
    `&prompt=consent`;
  
  res.redirect(googleAuthUrl);
});

router.get('/google/callback', handleGoogleCallback);

module.exports = router; 