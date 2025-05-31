const { 
    AdminGetUserCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId } = require('../config/cognito');
const crypto = require('crypto');
const { syncUserToRDS } = require('../utils/syncUser');

// Helper function to generate a secure password
const generateSecurePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
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

// Handle Google OAuth callback
const handleGoogleCallback = async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for tokens using Google OAuth
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`
            }
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info from Google');
        }

        const userInfo = await userInfoResponse.json();
        const { email, name, picture } = userInfo;

        let cognitoId;

        // Check if user exists in Cognito
        try {
            const getUserCommand = new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: email
            });
            const cognitoUser = await cognitoClient.send(getUserCommand);
            cognitoId = cognitoUser.UserAttributes.find(attr => attr.Name === 'sub')?.Value;
        } catch (error) {
            // If user doesn't exist, create new user
            if (error.name === 'UserNotFoundException') {
                // Generate a secure password that meets Cognito requirements
                const securePassword = generateSecurePassword();
                
                const createUserCommand = new AdminCreateUserCommand({
                    UserPoolId: userPoolId,
                    Username: email,
                    UserAttributes: [
                        {
                            Name: 'name',
                            Value: name
                        },
                        {
                            Name: 'email',
                            Value: email
                        },
                        {
                            Name: 'picture',
                            Value: picture
                        },
                        {
                            Name: 'custom:role',
                            Value: 'USER'
                        },
                        {
                            Name: 'email_verified',
                            Value: 'true'
                        }
                    ],
                    MessageAction: 'SUPPRESS',
                    TemporaryPassword: securePassword
                });

                const createUserResponse = await cognitoClient.send(createUserCommand);
                cognitoId = createUserResponse.User.Attributes.find(attr => attr.Name === 'sub')?.Value;

                // Set the permanent password immediately to avoid force change password
                const setPasswordCommand = new AdminSetUserPasswordCommand({
                    UserPoolId: userPoolId,
                    Username: email,
                    Password: securePassword,
                    Permanent: true
                });

                await cognitoClient.send(setPasswordCommand);
            } else {
                throw error;
            }
        }

        if (!cognitoId) {
            throw new Error('Failed to get or create Cognito user ID');
        }

        // Sync user to RDS
        try {
            console.log('Syncing Google user to RDS:', { email, cognitoId });
            await syncUserToRDS(cognitoId, email);
        } catch (syncError) {
            console.error('Error syncing Google user to RDS:', syncError);
            // Continue with the response even if sync fails
            // The user can still be synced later
        }

        // Get user role
        const role = await getUserRole(email);

        // Prepare the auth data
        const authData = {
            message: 'Google authentication successful',
            user: {
                email,
                name,
                picture,
                role
            },
            tokens: {
                accessToken: tokens.access_token,
                idToken: tokens.id_token,
                refreshToken: tokens.refresh_token
            }
        };

        // Redirect to frontend with auth data
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const redirectUrl = `${frontendUrl}/auth/google/callback?data=${encodeURIComponent(JSON.stringify(authData))}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google authentication error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`;
        res.redirect(errorUrl);
    }
};

module.exports = {
    handleGoogleCallback
}; 