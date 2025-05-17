const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId } = require('../config/cognito');

const router = express.Router();

// Register new user
router.post('/register',
  [
    body('fullName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, email, password } = req.body;

      const createUserParams = {
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: 'name',
            Value: fullName
          },
          {
            Name: 'email',
            Value: email
          },
          {
            Name: 'email_verified',
            Value: 'true'
          },
          {
            Name: 'custom:role',
            Value: 'USER'
          }
        ],
        MessageAction: 'SUPPRESS'
      };

      const createUserCommand = new AdminCreateUserCommand(createUserParams);
      const response = await cognitoClient.send(createUserCommand);

      // Set user password
      const setPasswordParams = {
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true
      };
      const setPasswordCommand = new AdminSetUserPasswordCommand(setPasswordParams);
      await cognitoClient.send(setPasswordCommand);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          fullName,
          email,
          role: 'USER'
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  }
);

// Login user
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const authParams = {
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        ClientId: clientId,
        UserPoolId: userPoolId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      };

      const authCommand = new AdminInitiateAuthCommand(authParams);
      const response = await cognitoClient.send(authCommand);

      // Get user details to include role and name in response
      const getUserParams = {
        UserPoolId: userPoolId,
        Username: email
      };
      const getUserCommand = new AdminGetUserCommand(getUserParams);
      const userDetails = await cognitoClient.send(getUserCommand);

      const role = userDetails.UserAttributes.find(
        attr => attr.Name === 'custom:role'
      )?.Value;

      const fullName = userDetails.UserAttributes.find(
        attr => attr.Name === 'name'
      )?.Value;

      res.json({
        success: true,
        message: 'Login successful',
        tokens: response.AuthenticationResult,
        user: {
          fullName,
          email,
          role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: error.message
      });
    }
  }
);

module.exports = router; 