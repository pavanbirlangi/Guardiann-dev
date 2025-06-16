const { 
    AdminGetUserCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminInitiateAuthCommand,
    AdminRespondToAuthChallengeCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId, clientSecret } = require('../config/cognito');
const crypto = require('crypto');
const { syncUserToRDS } = require('../utils/syncUser');

// Helper function to calculate SECRET_HASH
const calculateSecretHash = (username) => {
    const message = username + clientId;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
};

// Helper function to generate a secure password
const generateSecurePassword = () => {
    const length = 16;
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numberChars = "0123456789";
    const specialChars = "!@#$%^&*()_+";
    
    // Ensure at least one character from each required set
    let password = [
        lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
        uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
        numberChars[Math.floor(Math.random() * numberChars.length)],
        specialChars[Math.floor(Math.random() * specialChars.length)]
    ];
    
    // Fill the rest of the password with random characters from all sets
    const allChars = lowercaseChars + uppercaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    
    // Shuffle the password array to ensure random distribution
    for (let i = password.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [password[i], password[j]] = [password[j], password[i]];
    }
    
    return password.join('');
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
        const { email, name, picture, id: googleId } = userInfo;
        
        console.log('Google user info:', { email, name, picture, googleId });

        let cognitoId;
        let isNewUser = false;

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
                isNewUser = true;
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

                // Authenticate the new user
                const authCommand = new AdminInitiateAuthCommand({
                    UserPoolId: userPoolId,
                    ClientId: clientId,
                    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
                    AuthParameters: {
                        USERNAME: email,
                        PASSWORD: securePassword,
                        SECRET_HASH: calculateSecretHash(email)
                    }
                });

                const authResponse = await cognitoClient.send(authCommand);

                // Prepare the auth data
                const authData = {
                    message: 'Google authentication successful',
                    user: {
                        email,
                        name,
                        picture,
                        role: 'USER'
                    },
                    tokens: {
                        accessToken: authResponse.AuthenticationResult.AccessToken,
                        idToken: authResponse.AuthenticationResult.IdToken,
                        refreshToken: authResponse.AuthenticationResult.RefreshToken
                    }
                };

                // Sync user to RDS with Google ID
                try {
                    console.log('Syncing new Google user to RDS:', { email, cognitoId, googleId });
                    await syncUserToRDS(cognitoId, email, googleId);
                } catch (syncError) {
                    console.error('Error syncing new Google user to RDS:', syncError);
                }

                // Redirect to frontend with auth data
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
                const redirectUrl = `${frontendUrl}/auth/google/callback?data=${encodeURIComponent(JSON.stringify(authData))}`;
                return res.redirect(redirectUrl);
            } else {
                throw error;
            }
        }

        if (!cognitoId) {
            throw new Error('Failed to get or create Cognito user ID');
        }

        // For existing users, we need to authenticate with Cognito
        // First, get the user's current password or generate a new one
        const securePassword = generateSecurePassword();
        
        // Update the user's password in Cognito
        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: securePassword,
            Permanent: true
        });

        await cognitoClient.send(setPasswordCommand);

        // Authenticate with Cognito
        const authCommand = new AdminInitiateAuthCommand({
            UserPoolId: userPoolId,
            ClientId: clientId,
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: email,
                PASSWORD: securePassword,
                SECRET_HASH: calculateSecretHash(email)
            }
        });

        const authResponse = await cognitoClient.send(authCommand);

        // Get user role
        const role = await getUserRole(email);

        // Sync user to RDS with Google ID
        try {
            console.log('Syncing existing Google user to RDS:', { email, cognitoId, googleId });
            await syncUserToRDS(cognitoId, email, googleId);
        } catch (syncError) {
            console.error('Error syncing existing Google user to RDS:', syncError);
        }

        // Prepare the auth data using Cognito tokens
        const authData = {
            message: 'Google authentication successful',
            user: {
                email,
                name,
                picture,
                role
            },
            tokens: {
                accessToken: authResponse.AuthenticationResult.AccessToken,
                idToken: authResponse.AuthenticationResult.IdToken,
                refreshToken: authResponse.AuthenticationResult.RefreshToken
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