const { AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId } = require('../config/cognito');

// User Dashboard Controller
const getUserDashboard = async (req, res) => {
  try {
    // Get user details from Cognito
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: req.user.username
    });

    const userData = await cognitoClient.send(command);

    res.json({
      success: true,
      message: 'User dashboard data retrieved successfully',
      data: {
        email: userData.Username,
        fullName: userData.UserAttributes.find(attr => attr.Name === 'name')?.Value,
        role: userData.UserAttributes.find(attr => attr.Name === 'custom:role')?.Value
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user dashboard data',
      error: error.message
    });
  }
};

// Admin Dashboard Controller
const getAdminDashboard = async (req, res) => {
  try {
    // Get admin details from Cognito
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: req.user.username
    });

    const adminData = await cognitoClient.send(command);

    res.json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      data: {
        email: adminData.Username,
        fullName: adminData.UserAttributes.find(attr => attr.Name === 'name')?.Value,
        role: adminData.UserAttributes.find(attr => attr.Name === 'custom:role')?.Value
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getUserDashboard,
  getAdminDashboard
}; 