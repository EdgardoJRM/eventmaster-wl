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

      // Usar endpoint REST para verificar el magic link
      const { authApi } = await import('@/lib/api');
      const response = await authApi.verifyMagicLink(email, code);

      console.log('Verify response:', response);

      if (response.success && response.tokens) {
        // Guardar tokens en localStorage
        localStorage.setItem('authToken', response.tokens.accessToken || '');
        localStorage.setItem('idToken', response.tokens.idToken || '');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', email);

        // Redirigir al dashboard
        setLoading(false);
        setVerifying(false);
        router.push('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
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
            <StyledButton onClick={() => router.push('/')}>
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

