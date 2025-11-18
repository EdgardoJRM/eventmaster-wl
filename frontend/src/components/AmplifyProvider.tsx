'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { config } from '@/config';

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: config.cognito.userPoolId,
          userPoolClientId: config.cognito.userPoolClientId,
          loginWith: {
            email: true,
          },
        },
      },
    }, {
      ssr: true,
    });
  }, []);

  return <>{children}</>;
}

