const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

// Debug: Log environment variables
console.log('Cognito Configuration:');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not Set');
console.log('AWS_USER_POOL_ID:', process.env.AWS_USER_POOL_ID);
console.log('AWS_CLIENT_ID:', process.env.AWS_CLIENT_ID);
console.log('AWS_CLIENT_SECRET:', process.env.AWS_CLIENT_SECRET ? 'Set' : 'Not Set');

if (!process.env.AWS_REGION) {
    throw new Error('AWS_REGION is not set in environment variables');
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not set in environment variables');
}

if (!process.env.AWS_USER_POOL_ID) {
    throw new Error('AWS_USER_POOL_ID is not set in environment variables');
}

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const userPoolId = process.env.AWS_USER_POOL_ID;
const clientId = process.env.AWS_CLIENT_ID;
const clientSecret = process.env.AWS_CLIENT_SECRET;

module.exports = {
    cognitoClient,
    userPoolId,
    clientId,
    clientSecret
}; 