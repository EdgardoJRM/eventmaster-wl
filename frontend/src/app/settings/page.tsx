'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandedHeader } from '@/components/BrandedHeader';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { branding } = useTheme();

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth || isAuth !== 'true') {
      router.push('/');
    }
  }, [router]);

  const settingsSections = [
    {
      title: 'Personalización',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      items: [
        {
          title: 'Marca y Branding',
          description: 'Configura logo, colores, fuentes y más',
          href: '/settings/branding',
          badge: 'Recomendado',
        },
        {
          title: 'Email Templates',
          description: 'Personaliza los emails automáticos con QR',
          href: '/settings/email-templates',
          badge: 'Importante',
        },
      ],
    },
    {
      title: 'Configuración del Tenant',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      items: [
        {
          title: 'Información de la Organización',
          description: 'Nombre, contacto y detalles generales',
          href: '#',
          badge: 'Próximamente',
        },
        {
          title: 'Dominios Personalizados',
          description: 'Configura tu propio dominio',
          href: '#',
          badge: 'Enterprise',
        },
      ],
    },
    {
      title: 'Seguridad',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      items: [
        {
          title: 'Usuarios y Permisos',
          description: 'Gestiona el equipo y sus accesos',
          href: '#',
          badge: 'Próximamente',
        },
      ],
    },
    {
      title: 'Integraciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      items: [
        {
          title: 'Webhooks',
          description: 'Notificaciones en tiempo real',
          href: '#',
          badge: 'API',
        },
        {
          title: 'Zapier & Make',
          description: 'Automatizaciones sin código',
          href: '#',
          badge: 'Enterprise',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader showBackButton={true} backHref="/dashboard" title="Configuración" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-2">Personaliza tu experiencia y configura tu organización</p>
        </div>

        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-primary">{section.icon}</div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition ${
                      item.href === '#' ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary'
                    } border-2 border-transparent`}
                    onClick={(e) => {
                      if (item.href === '#') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      {item.badge && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          item.badge === 'Recomendado' 
                            ? 'bg-green-100 text-green-800'
                            : item.badge === 'Importante'
                            ? 'bg-orange-100 text-orange-800'
                            : item.badge === 'Próximamente'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    
                    {item.href !== '#' && (
                      <div className="mt-4 flex items-center text-primary text-sm font-medium">
                        Configurar
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gradient-primary rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas ayuda?</h2>
          <p className="mb-6">Nuestro equipo está listo para ayudarte a configurar tu cuenta</p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@eventmaster.com"
              className="px-6 py-3 bg-white text-primary rounded-lg font-medium hover:bg-gray-100 transition"
            >
              📧 Contactar Soporte
            </a>
            <a
              href="#"
              className="px-6 py-3 border-2 border-white rounded-lg font-medium hover:bg-white hover:text-primary transition"
            >
              📚 Ver Documentación
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
