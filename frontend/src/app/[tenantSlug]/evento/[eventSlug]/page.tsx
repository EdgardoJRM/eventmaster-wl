'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

interface PublicEvent {
  event: {
    id: string;
    title: string;
    description: string;
    banner_image_url?: string;
    location_name?: string;
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

export const dynamicParams = true;

export default function PublicEventPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const eventSlug = params.eventSlug as string;
  const [eventData, setEventData] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [tenantSlug, eventSlug]);

  async function loadEvent() {
    try {
      const response = await apiClient.get(
        `/public/events/${tenantSlug}/${eventSlug}`
      );
      if (response.data.success) {
        setEventData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
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
    <div className="min-h-screen bg-white">
      {event.banner_image_url && (
        <div className="w-full h-64 bg-cover bg-center" style={{ backgroundImage: `url(${event.banner_image_url})` }} />
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          {tenant.logo_url && (
            <img src={tenant.logo_url} alt={tenant.name} className="h-12 mb-4" />
          )}
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          {event.description && (
            <p className="text-lg text-gray-700 mb-6">{event.description}</p>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Fecha y Hora</h3>
              <p className="text-gray-900">
                {new Date(event.start_date).toLocaleString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {event.location_name && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Ubicación</h3>
                <p className="text-gray-900">{event.location_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          {event.is_full && !event.waitlist_enabled ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Evento lleno
            </div>
          ) : (
            <>
              {!showRegistration ? (
                <StyledButton onClick={() => setShowRegistration(true)}>
                  Registrarse al Evento
                </StyledButton>
              ) : (
                <RegistrationForm event={event} onSuccess={() => setShowRegistration(false)} />
              )}
            </>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm">
          {event.total_registrations} personas registradas
          {event.capacity && ` de ${event.capacity} disponibles`}
        </div>
      </div>
    </div>
  );
}

function RegistrationForm({ event, onSuccess }: { event: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [participantData, setParticipantData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/participants/register', {
        event_id: event.id,
        ...formData,
      });

      if (response.data.success) {
        setParticipantData(response.data.data);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (success && participantData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-800 mb-2">¡Registro Exitoso!</h3>
        <p className="text-green-700 mb-4">
          Tu código QR ha sido enviado a {participantData.email}
        </p>
        {participantData.qr_code_url && (
          <img
            src={participantData.qr_code_url}
            alt="QR Code"
            className="mx-auto w-48 h-48"
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4">Registro al Evento</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        {event.require_phone && (
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        )}
        <StyledButton type="submit" className="w-full" disabled={loading}>
          {loading ? 'Registrando...' : 'Confirmar Registro'}
        </StyledButton>
      </div>
    </form>
  );
}


