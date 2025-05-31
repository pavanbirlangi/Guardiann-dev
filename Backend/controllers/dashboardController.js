const { AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId } = require('../config/cognito');
const db = require('../config/database');

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

// Get User Profile Controller
const getUserProfile = async (req, res) => {
  try {
    // Get user details from PostgreSQL
    const query = `
      SELECT 
        id,
        email,
        full_name,
        phone,
        profile_picture_url,
        address,
        city,
        state,
        country,
        created_at,
        last_login
      FROM users 
      WHERE cognito_id = $1
    `;
    
    const result = await db.query(query, [req.user.sub]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update User Profile Controller
const updateUserProfile = async (req, res) => {
  try {
    const { full_name, phone, address, city, state, country } = req.body;

    // Update user details in PostgreSQL
    const query = `
      UPDATE users 
      SET 
        full_name = $1,
        phone = $2,
        address = $3,
        city = $4,
        state = $5,
        country = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE cognito_id = $7
      RETURNING *
    `;
    
    const result = await db.query(query, [
      full_name,
      phone,
      address,
      city,
      state,
      country,
      req.user.sub
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
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
  getAdminDashboard,
  getUserProfile,
  updateUserProfile
}; 