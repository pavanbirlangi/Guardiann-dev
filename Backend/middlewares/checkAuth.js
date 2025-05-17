const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, userPoolId, clientId } = require('../config/cognito');

// Initialize JWT verifier
const verifier = CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: 'access',
    clientId: clientId
});

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

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the token
        const payload = await verifier.verify(token);
        
        // Get user role from Cognito
        const role = await getUserRole(payload.username);
        
        // Add user info to request
        req.user = {
            username: payload.username,
            role: role
        };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Check role middleware
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
}; 