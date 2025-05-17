const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

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