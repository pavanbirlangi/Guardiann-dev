const { 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId, clientSecret } = require('../config/cognito');
const { syncUserToRDS } = require('../utils/syncUser');
const crypto = require('crypto');

// Function to calculate SECRET_HASH
const calculateSecretHash = (username) => {
  const message = username + clientId;
  const hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(message);
  return hmac.digest('base64');
};

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const signUpParams = {
      ClientId: clientId,
      Username: email,
      Password: password,
      SecretHash: calculateSecretHash(email),
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
          Name: 'custom:role',
          Value: 'USER'
        }
      ]
    };

    // Sign up the user
    const signUpCommand = new SignUpCommand(signUpParams);
    const signUpResponse = await cognitoClient.send(signUpCommand);

    // Get user details to get the Cognito sub
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: email
    });
    const userDetails = await cognitoClient.send(getUserCommand);
    const cognitoId = userDetails.UserAttributes.find(attr => attr.Name === 'sub')?.Value;

    if (!cognitoId) {
      throw new Error('Failed to get Cognito ID for the user');
    }

    console.log('Attempting to sync user to RDS:', { email, cognitoId });

    // Sync user to RDS
    try {
      const syncedUser = await syncUserToRDS(cognitoId, email);
      console.log('Successfully synced user to RDS:', syncedUser);
    } catch (syncError) {
      console.error('Error syncing user to RDS:', syncError);
      // Continue with the response even if sync fails
      // The user can still be synced later
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification code.',
      user: {
        fullName,
        email,
        role: 'USER',
        verified: false
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
};

// Verify user's email with the code
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const params = {
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
      SecretHash: calculateSecretHash(email)
    };

    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

// Initiate forgot password process
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const params = {
      ClientId: clientId,
      Username: email,
      SecretHash: calculateSecretHash(email)
    };

    const command = new ForgotPasswordCommand(params);
    await cognitoClient.send(command);

    res.json({
      success: true,
      message: 'Verification code has been sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating password reset',
      error: error.message
    });
  }
};

// Confirm forgot password with verification code
const confirmForgotPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const params = {
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: calculateSecretHash(email)
    };

    const command = new ConfirmForgotPasswordCommand(params);
    await cognitoClient.send(command);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Confirm forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  forgotPassword,
  confirmForgotPassword
}; 