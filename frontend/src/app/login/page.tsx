'use client';

import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { StyledButton } from '@/components/StyledButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Iniciar custom auth flow (magic link)
      await signIn({
        username: email,
        options: {
          authFlowType: 'CUSTOM_WITHOUT_SRP',
        },
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending magic link:', err);
      setError(err.message || 'Error al enviar el magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Te enviaremos un enlace mágico a tu email
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">¡Magic link enviado!</p>
              <p className="text-sm mt-1">
                Revisa tu email ({email}) y haz clic en el enlace para iniciar sesión.
              </p>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <StyledButton 
              type="submit" 
              className="w-full" 
              disabled={loading || success}
            >
              {loading ? 'Enviando...' : success ? 'Enviado ✓' : 'Enviar Magic Link'}
            </StyledButton>
          </div>
          {success && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-primary hover:underline"
              >
                Enviar a otro email
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
