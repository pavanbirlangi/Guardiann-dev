const { 
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  GlobalSignOutCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  InitiateAuthCommand
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
    
    // Get complete user details from Cognito
    const getUserCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email
    });
    const userData = await cognitoClient.send(getUserCommand);
    
    // Extract user attributes
    const name = userData.UserAttributes.find(attr => attr.Name === 'name')?.Value;
    const role = userData.UserAttributes.find(attr => attr.Name === 'custom:role')?.Value || 'USER';
    const picture = userData.UserAttributes.find(attr => attr.Name === 'picture')?.Value;

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
        name,
        picture,
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

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: calculateSecretHash(refreshToken)
      }
    });

    const response = await cognitoClient.send(command);

    // Get user details to include in response
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: response.AuthenticationResult.IdToken
    });
    const userData = await cognitoClient.send(getUserCommand);
    
    // Extract user attributes
    const email = userData.UserAttributes.find(attr => attr.Name === 'email')?.Value;
    const name = userData.UserAttributes.find(attr => attr.Name === 'name')?.Value;
    const role = userData.UserAttributes.find(attr => attr.Name === 'custom:role')?.Value || 'USER';
    const picture = userData.UserAttributes.find(attr => attr.Name === 'picture')?.Value;

    res.json({
      success: true,
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken || refreshToken // Keep old refresh token if new one not provided
      },
      user: {
        email,
        name,
        picture,
        role
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Failed to refresh token',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  completeNewPasswordChallenge,
  refreshToken
}; 