const { 
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  GlobalSignOutCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId, clientSecret } = require('../config/cognito');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const crypto = require('crypto');

// Function to calculate SECRET_HASH
const calculateSecretHash = (username) => {
  const message = username + clientId;
  const hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(message);
  return hmac.digest('base64');
};

// Helper function to get user role from Cognito
const getUserRole = async (username) => {
    try {
        const command = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: username
        });
        const response = await cognitoClient.send(command);
        const roleAttribute = response.UserAttributes.find(attr => attr.Name === 'custom:role');
        return roleAttribute ? roleAttribute.Value : 'USER';
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'USER';
    }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const command = new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: calculateSecretHash(email)
        }
    });

    const response = await cognitoClient.send(command);
    
    // Get user role
    const role = await getUserRole(email);

    // If MFA is required
    if (response.ChallengeName === 'MFA_SETUP' || response.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      return res.status(200).json({
        message: 'MFA setup required',
        challengeName: response.ChallengeName,
        session: response.Session
      });
    }

    // If NEW_PASSWORD_REQUIRED
    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return res.status(200).json({
        message: 'New password required',
        challengeName: response.ChallengeName,
        session: response.Session,
        userAttributes: response.ChallengeParameters.userAttributes
      });
    }

    // Successful login
    res.json({
      message: 'Login successful',
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        idToken: response.AuthenticationResult.IdToken
      },
      user: {
        email,
        role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

// Handle new password required challenge
const completeNewPasswordChallenge = async (req, res) => {
  try {
    const { email, newPassword, session } = req.body;

    const command = new AdminRespondToAuthChallengeCommand({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ClientId: clientId,
        UserPoolId: userPoolId,
        ChallengeResponses: {
            USERNAME: email,
            NEW_PASSWORD: newPassword,
            SECRET_HASH: calculateSecretHash(email)
        },
        Session: session
    });

    const response = await cognitoClient.send(command);

    res.json({
      message: 'Password changed successfully',
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        idToken: response.AuthenticationResult.IdToken
      }
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({
      message: 'Error changing password',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const { accessToken } = req.body;

    const command = new GlobalSignOutCommand({
        AccessToken: accessToken
    });

    await cognitoClient.send(command);

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Error logging out',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  completeNewPasswordChallenge
}; 