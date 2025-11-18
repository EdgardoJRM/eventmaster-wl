export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://YOUR_API_GATEWAY_URL/dev',
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
    userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  },
};

