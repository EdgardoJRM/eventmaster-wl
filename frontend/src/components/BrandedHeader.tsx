'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface BrandedHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  showLogout?: boolean;
  children?: React.ReactNode;
}

export function BrandedHeader({
  showBackButton = false,
  backHref = '/dashboard',
  title,
  showLogout = false,
  children,
}: BrandedHeaderProps) {
  const { branding } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b-2" style={{ borderBottomColor: branding?.primary_color || '#9333ea' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => router.push(backHref)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
            )}

            {/* Logo + Title */}
            <div className="flex items-center space-x-3">
              {branding?.logo_url ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                  <Image
                    src={branding.logo_url}
                    alt={branding.tenant_name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: branding?.primary_color || '#9333ea' }}
                >
                  {branding?.tenant_name?.charAt(0).toUpperCase() || 'E'}
                </div>
              )}

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {title || branding?.tenant_name || 'EventMaster'}
                </h1>
                {!title && (
                  <p className="text-xs text-gray-500">Gestión de Eventos</p>
                )}
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {children}
            
            {showLogout && (
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

