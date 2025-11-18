import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      region: process.env.NEXT_PUBLIC_REGION || 'us-east-1',
    },
  },
};

Amplify.configure(amplifyConfig, { ssr: true });

export default Amplify;

