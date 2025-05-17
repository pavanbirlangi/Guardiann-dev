const { 
    AdminGetUserCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId } = require('../config/cognito');
const crypto = require('crypto');

// Helper function to generate a secure password that meets Cognito requirements
const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one character from each required set
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Add more random characters to meet minimum length
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 8; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
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

        // Check if user exists in Cognito
        try {
            const getUserCommand = new AdminGetUserCommand({
                UserPoolId: userPoolId,
                Username: email
            });
            await cognitoClient.send(getUserCommand);
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

                await cognitoClient.send(createUserCommand);

                // Set the permanent password immediately to avoid force change password
                const setPasswordCommand = new AdminSetUserPasswordCommand({
                    UserPoolId: userPoolId,
                    Username: email,
                    Password: securePassword,
                    Permanent: true
                });

                await cognitoClient.send(setPasswordCommand);
            }
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