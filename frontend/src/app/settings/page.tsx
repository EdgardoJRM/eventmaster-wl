'use client';

import { useRouter } from 'next/navigation';
import { StyledButton } from '@/components/StyledButton';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push('/dashboard')} className="text-primary">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Configuración</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Branding</h3>
              <p className="text-gray-600 mb-4">
                Personaliza los colores, logo y estilo de tu plataforma
              </p>
              <StyledButton onClick={() => router.push('/settings/branding')}>
                Configurar Branding
              </StyledButton>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Staff</h3>
              <p className="text-gray-600 mb-4">
                Gestiona los usuarios de tu organización
              </p>
              <StyledButton variant="outline" disabled>
                Próximamente
              </StyledButton>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Email y SMS</h3>
              <p className="text-gray-600 mb-4">
                Configura las opciones de comunicación
              </p>
              <StyledButton variant="outline" disabled>
                Próximamente
              </StyledButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

