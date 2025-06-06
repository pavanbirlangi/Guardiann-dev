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

/**
 * Get complete user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserData = async (req, res) => {
    try {
        // Get user details from Cognito first to get the username
        const command = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: req.user.username
        });

        const cognitoUser = await cognitoClient.send(command);
        const username = cognitoUser.Username;

        // Query to get user data using the username as cognito_id
        const result = await db.query(
            `SELECT 
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
                updated_at,
                last_login,
                is_active
            FROM users 
            WHERE cognito_id = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                debug: {
                    username: username
                }
            });
        }

        // Format dates to ISO string
        const userData = {
            ...result.rows[0],
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at.toISOString(),
            last_login: result.rows[0].last_login ? result.rows[0].last_login.toISOString() : null
        };

        res.json({
            success: true,
            message: 'User data retrieved successfully',
            data: userData
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateUserData = async (req, res) => {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: req.user.username
    });
    const cognitoUser = await cognitoClient.send(command);
    const username = cognitoUser.Username;

    const { full_name, phone, profile_picture_url, address, city, state, country } = req.body;

    const result = await db.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        profile_picture_url = COALESCE($3, profile_picture_url),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        country = COALESCE($7, country),
        updated_at = CURRENT_TIMESTAMP
      WHERE cognito_id = $8
      RETURNING *`,
      [full_name, phone, profile_picture_url, address, city, state, country, username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User data updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getUserBookings = async (req, res) => {
    try {
        const { username } = req.user;

        // Get user id from users table
        const userResult = await db.query(
            'SELECT id FROM users WHERE cognito_id = $1',
            [username]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user_id = userResult.rows[0].id;

        // Get bookings with institution details
        const result = await db.query(
            `SELECT 
                b.*,
                i.name as institution_name,
                i.thumbnail_url,
                i.category_id,
                c.name as category_name
            FROM bookings b
            LEFT JOIN institutions i ON b.institution_id = i.id
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC`,
            [user_id]
        );

        // Transform the data to ensure all fields are properly formatted
        const bookings = result.rows.map(booking => ({
            ...booking,
            thumbnail_url: booking.thumbnail_url || null,
            institution_name: booking.institution_name || 'Unknown Institution',
            category_name: booking.category_name || 'Uncategorized'
        }));

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Export all functions
module.exports = {
  getUserDashboard,
  getAdminDashboard,
  getUserProfile,
    updateUserProfile,
    getUserData,
    updateUserData,
    getUserBookings
}; 