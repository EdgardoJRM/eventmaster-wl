'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

interface PublicEvent {
  event: {
    id: string;
    title: string;
    description: string;
    banner_image_url?: string;
    location_name?: string;
    location_address?: string;
    start_date: string;
    end_date: string;
    capacity: number | null;
    total_registrations: number;
    is_full: boolean;
    waitlist_enabled: boolean;
    custom_fields: any[];
  };
  tenant: {
    name: string;
    logo_url?: string;
    primary_color?: string;
  };
}

export default function PublicEventPage() {
  const params = useParams();
  const theme = useTheme();
  const tenantSlug = params?.tenantSlug as string;
  const eventSlug = params?.eventSlug as string;
  const [eventData, setEventData] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [tenantSlug, eventSlug]);

  async function loadEvent() {
    try {
      const response = await api.get(`/public/events/${tenantSlug}/${eventSlug}`);
      if (response.data.success) {
        setEventData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);

    try {
      const response = await api.post(
        `/public/events/${tenantSlug}/${eventSlug}/register`,
        formData
      );

      if (response.data.success) {
        alert('¡Registro exitoso! Recibirás un email con tu código QR.');
        setShowRegistration(false);
        setFormData({ name: '', email: '', phone: '' });
        loadEvent();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al registrarse');
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando evento...</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Evento no encontrado</div>
      </div>
    );
  }

  const { event, tenant } = eventData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con branding del tenant */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-10" />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                {tenant.name}
              </h1>
            )}
          </div>
        </div>
      </header>

      {/* Banner del evento */}
      {event.banner_image_url && (
        <div className="w-full h-64 md:h-96 relative">
          <img
            src={event.banner_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(event.start_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {event.location_name && (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location_name}
              </div>
            )}

            {event.capacity && (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {event.total_registrations} / {event.capacity} registrados
              </div>
            )}
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {event.location_address && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Ubicación</h3>
              <p className="text-gray-700">{event.location_address}</p>
            </div>
          )}

          {/* Botón de registro */}
          {!showRegistration ? (
            <div className="text-center">
              {event.is_full && !event.waitlist_enabled ? (
                <div className="inline-block px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium">
                  Evento lleno
                </div>
              ) : (
                <button
                  onClick={() => setShowRegistration(true)}
                  className="px-8 py-4 text-white rounded-lg font-medium text-lg transition hover:opacity-90"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {event.is_full ? 'Unirse a lista de espera' : 'Registrarse al evento'}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="max-w-md mx-auto space-y-4">
              <h3 className="text-xl font-bold mb-4">Formulario de Registro</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {registering ? 'Registrando...' : 'Confirmar registro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

