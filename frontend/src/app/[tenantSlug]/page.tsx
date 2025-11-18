'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';

interface PublicEvent {
  event_id: string;
  title: string;
  short_description?: string;
  banner_image_url?: string;
  dates: {
    start: number;
    end: number;
  };
  location: {
    name: string;
    is_virtual: boolean;
  };
  registered_count: number;
  capacity: number;
  slug: string;
}

export default function TenantPublicPage() {
  const params = useParams();
  const router = useRouter();
  const { branding, setBranding } = useTheme();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const tenantSlug = params?.tenantSlug as string;

  useEffect(() => {
    // En producción, cargar datos del tenant y eventos públicos desde API
    // Por ahora, mostrar eventos demo
    const loadTenantData = async () => {
      try {
        // TODO: Fetch tenant branding and public events
        // const response = await fetch(`/api/public/${tenantSlug}`);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading tenant data:', error);
        setLoading(false);
      }
    };

    loadTenantData();
  }, [tenantSlug]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: branding?.primary_color || '#9333ea' }}></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-primary text-white" style={{
        background: `linear-gradient(135deg, ${branding?.primary_color || '#9333ea'} 0%, ${branding?.accent_color || '#3b82f6'} 100%)`
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {branding?.logo_url && (
            <div className="mb-6">
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-white p-4">
                <Image
                  src={branding.logo_url}
                  alt={branding.tenant_name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
          
          <h1 className="text-5xl font-bold mb-4">
            {branding?.tenant_name || 'EventMaster'}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Descubre y regístrate en nuestros próximos eventos
          </p>
        </div>
      </div>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Próximos Eventos</h2>
          <p className="text-gray-600">Encuentra el evento perfecto para ti</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay eventos publicados aún</h3>
            <p className="text-gray-600 mb-8">Vuelve pronto para ver nuestros próximos eventos</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 rounded-lg font-medium text-white transition"
              style={{ backgroundColor: branding?.primary_color || '#9333ea' }}
            >
              Ir al Login (Organizador)
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Link
                key={event.event_id}
                href={`/${tenantSlug}/evento/${event.slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
              >
                {event.banner_image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={event.banner_image_url}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.dates.start)}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary">
                    {event.title}
                  </h3>

                  {event.short_description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.short_description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {event.location.is_virtual ? 'Virtual' : event.location.name}
                    </div>

                    {event.capacity > 0 && (
                      <div className="text-sm font-medium text-gray-700">
                        {event.registered_count}/{event.capacity} registrados
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} {branding?.tenant_name || 'EventMaster'}. Todos los derechos reservados.
          </p>
          {branding?.footer_html && (
            <div
              className="mt-4 text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: branding.footer_html }}
            />
          )}
        </div>
      </footer>
    </div>
  );
}

