'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token no encontrado');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.verifyMagicLink(token);
        console.log('Verify response:', response); // Debug log
        
        if (response.success && response.data?.user) {
          // Save user information
          localStorage.setItem('userId', response.data.user.id);
          localStorage.setItem('userEmail', response.data.user.email);
          localStorage.setItem('username', response.data.user.username || response.data.user.email);
          localStorage.setItem('displayName', response.data.user.displayName || response.data.user.username);
          localStorage.setItem('cognitoUsername', response.data.cognitoUsername);
          localStorage.setItem('isAuthenticated', 'true');
          
          // Save JWT tokens for API authentication
          if (response.data.tokens) {
            localStorage.setItem('authToken', response.data.tokens.accessToken);
            localStorage.setItem('idToken', response.data.tokens.idToken);
            localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
            localStorage.setItem('tokenTimestamp', Date.now().toString());
          }
          
          setStatus('success');
          setMessage('¡Autenticación exitosa!');
          
          // Redirect to dashboard after 1 second
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          console.error('Unexpected response format:', response);
          setStatus('error');
          setMessage('Error en la verificación: Formato de respuesta inesperado');
        }
      } catch (error) {
        console.error('Verify error:', error);
        const err = error as { response?: { data?: { error?: { message?: string } } } };
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Error al verificar el token');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 animate-pulse">
              <svg className="w-8 h-8 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificando...</h1>
            <p className="text-gray-600">Estamos verificando tu identidad</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido!</h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirigiendo al dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 animate-pulse">
            <svg className="w-8 h-8 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cargando...</h1>
          <p className="text-gray-600">Por favor espera</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

