'use client';

import { useEffect, useState, Suspense } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { StyledButton } from '@/components/StyledButton';

function VerifyMagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email || !code) {
      setError('Enlace inválido. Faltan parámetros requeridos.');
      setLoading(false);
      return;
    }

    // Verificar el magic link automáticamente
    verifyMagicLink(email, code);
  }, [searchParams]);

  const verifyMagicLink = async (email: string, code: string) => {
    try {
      setVerifying(true);

      // Iniciar custom auth flow
      const signInOutput = await signIn({
        username: email,
        options: {
          authFlowType: 'CUSTOM_WITHOUT_SRP',
        },
      });

      console.log('SignIn output:', signInOutput);

      // Si el signIn requiere un challenge, responder con el código del magic link
      if (signInOutput.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
        await confirmSignIn({
          challengeResponse: code,
        });
      }

      // Guardar tokens en localStorage
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      
      if (session.tokens) {
        localStorage.setItem('authToken', session.tokens.accessToken?.toString() || '');
        localStorage.setItem('idToken', session.tokens.idToken?.toString() || '');
        localStorage.setItem('isAuthenticated', 'true');
        if (email) {
          localStorage.setItem('userEmail', email);
          localStorage.setItem('username', email);
        }
      }

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error verifying magic link:', err);
      setError(err.message || 'Error al verificar el magic link. El enlace puede haber expirado.');
      setLoading(false);
      setVerifying(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {verifying ? 'Verificando magic link...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <div className="text-center space-y-4">
            <StyledButton onClick={() => router.push('/login')}>
              Volver al Login
            </StyledButton>
            <p className="text-sm text-gray-600">
              Si el problema persiste, solicita un nuevo magic link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <VerifyMagicLinkContent />
    </Suspense>
  );
}

