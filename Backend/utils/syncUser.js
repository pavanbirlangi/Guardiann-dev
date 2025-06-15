const { query } = require('../config/database');
const { AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId } = require('../config/cognito');

/**
 * Syncs user data from Cognito to RDS database
 * @param {string} cognitoId - The Cognito sub (unique identifier)
 * @param {string} email - User's email
 * @param {string} googleId - User's Google ID (optional)
 * @returns {Promise<Object>} The synced user data
 */
const syncUserToRDS = async (cognitoId, email, googleId = null) => {
    if (!cognitoId || !email) {
        throw new Error('cognitoId and email are required');
    }

    try {
        console.log('Starting user sync to RDS:', { cognitoId, email, googleId });

        // Get user details from Cognito using the username (cognitoId)
        const command = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: cognitoId
        });
        const cognitoUser = await cognitoClient.send(command);

        // Extract user attributes
        const fullName = cognitoUser.UserAttributes.find(attr => attr.Name === 'name')?.Value || '';
        const phone = cognitoUser.UserAttributes.find(attr => attr.Name === 'phone_number')?.Value || null;
        const picture = cognitoUser.UserAttributes.find(attr => attr.Name === 'picture')?.Value || null;

        console.log('Retrieved Cognito user attributes:', { fullName, phone, picture, googleId });

        // Check if user exists in RDS using cognito_id (which is the Cognito username)
        const existingUser = await query(
            'SELECT * FROM users WHERE cognito_id = $1',
            [cognitoId]
        );

        let result;
        if (existingUser.rows.length > 0) {
            console.log('Updating existing user in RDS');
            // Update existing user using cognito_id
            result = await query(
                `UPDATE users 
                SET 
                    email = $1,
                    full_name = $2,
                    phone = $3,
                    profile_picture_url = $4,
                    google_id = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE cognito_id = $6
                RETURNING *`,
                [email, fullName, phone, picture, googleId, cognitoId]
            );
        } else {
            console.log('Creating new user in RDS');
            // Create new user with cognito_id as the username
            result = await query(
                `INSERT INTO users 
                (cognito_id, email, full_name, phone, profile_picture_url, google_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [cognitoId, email, fullName, phone, picture, googleId]
            );
        }

        if (!result.rows[0]) {
            throw new Error('Failed to sync user to RDS - no result returned');
        }

        console.log('Successfully synced user to RDS:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('Error in syncUserToRDS:', error);
        throw error;
    }
};

module.exports = {
    syncUserToRDS
}; 