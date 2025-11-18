export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod',
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_BnjZCmw7O',
    userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '4qmr86u7hh5pd5s86l4lhfrubf',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  },
};

