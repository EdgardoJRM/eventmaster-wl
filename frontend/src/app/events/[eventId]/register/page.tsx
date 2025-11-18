'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsApi, participantsApi } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Event {
  event_id: string;
  title: string;
  short_description?: string;
  description: string;
  banner_image_url?: string;
  featured_image_url?: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_online: boolean;
  } | string;
  is_virtual: boolean;
  virtual_meeting_url?: string;
  dates: {
    start: number;
    end: number;
    timezone: string;
  };
  capacity: number;
  registered_count: number;
  checked_in_count: number;
  waitlist_enabled: boolean;
  registration_enabled: boolean;
  max_per_person: number;
  require_phone: boolean;
  custom_fields?: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  status: string;
  visibility: string;
}

export default function EventRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    custom_data: {} as Record<string, string>,
  });

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      // Esta llamada debe ser pública (sin auth)
      const response = await eventsApi.getById(eventId);
      if (response.success && response.data) {
        const eventData = response.data;
        
        // Verificar que el evento esté publicado
        if (eventData.status !== 'published') {
          setError('Este evento no está disponible públicamente.');
          setLoading(false);
          return;
        }
        
        // Verificar que el registro esté habilitado
        if (!eventData.registration_enabled) {
          setError('El registro para este evento está cerrado.');
          setLoading(false);
          return;
        }
        
        setEvent(eventData);
      } else {
        setError('Evento no encontrado');
      }
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    // Validar capacidad
    const isFull = event.capacity > 0 && event.registered_count >= event.capacity;
    if (isFull && !event.waitlist_enabled) {
      toast.error('Este evento está lleno y no acepta lista de espera');
      return;
    }
    
    setSubmitting(true);

    try {
      const payload = {
        event_id: eventId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        custom_data: Object.keys(formData.custom_data).length > 0 ? formData.custom_data : undefined,
        waitlist: isFull, // Auto-assign to waitlist if full
      };

      const response = await participantsApi.register(eventId, payload);

      if (response.success) {
        setSuccess(true);
        toast.success(isFull 
          ? '¡Registrado en lista de espera! Revisa tu email.' 
          : '¡Registro exitoso! Revisa tu email para tu QR code.'
        );
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          custom_data: {},
        });
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(error.response?.data?.error?.message || 'Error al registrarse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setFormData({
      ...formData,
      custom_data: {
        ...formData.custom_data,
        [fieldName]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error || 'Evento no encontrado'}</p>
          </div>
          <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const displayLocation = typeof event.location === 'object'
    ? (event.location.is_online ? '🌐 Evento Virtual' : `📍 ${event.location.name}`)
    : (event.is_virtual ? '🌐 Evento Virtual' : `📍 ${event.location}`);

  const startDate = new Date(event.dates.start * 1000).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isFull = event.capacity > 0 && event.registered_count >= event.capacity;
  const spotsLeft = event.capacity > 0 ? event.capacity - event.registered_count : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Toaster position="top-center" />
      
      {/* Header Banner */}
      {event.banner_image_url && (
        <div className="w-full h-64 bg-cover bg-center" style={{ backgroundImage: `url(${event.banner_image_url})` }}>
          <div className="w-full h-full bg-black bg-opacity-40 flex items-center justify-center">
            <h1 className="text-4xl font-extrabold text-white text-center px-4">{event.title}</h1>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {!event.banner_image_url && (
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
        )}
        
        {event.short_description && (
          <p className="text-xl text-gray-600 mb-8">{event.short_description}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">¡Registro Exitoso!</h3>
                </div>
                <p className="text-green-700 mb-2">
                  {isFull 
                    ? 'Has sido agregado a la lista de espera. Te notificaremos si hay lugares disponibles.' 
                    : 'Hemos enviado un email con tu código QR. Preséntalo el día del evento.'}
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Registrar otra persona →
                </button>
              </div>
            )}

            {/* Event Details Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Detalles del Evento</h2>
              
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">Fecha y Hora</p>
                    <p>{startDate}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p>{displayLocation}</p>
                  </div>
                </div>

                {event.capacity > 0 && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Capacidad</p>
                      <p>{event.registered_count} / {event.capacity} registrados</p>
                      {spotsLeft !== null && spotsLeft > 0 && (
                        <p className="text-sm text-green-600">✓ {spotsLeft} lugares disponibles</p>
                      )}
                      {isFull && (
                        <p className="text-sm text-orange-600">⚠️ Evento lleno</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isFull && event.waitlist_enabled ? 'Unirse a Lista de Espera' : 'Registrarse'}
              </h2>
              
              {isFull && event.waitlist_enabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
                  <p className="font-medium">Evento lleno</p>
                  <p>Puedes unirte a la lista de espera</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="tu@email.com"
                  />
                </div>

                {event.require_phone && (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                )}

                {/* Custom Fields */}
                {event.custom_fields && event.custom_fields.length > 0 && (
                  <>
                    {event.custom_fields.map((field) => (
                      <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            id={field.name}
                            required={field.required}
                            value={formData.custom_data[field.name] || ''}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Seleccionar...</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={field.name}
                            required={field.required}
                            value={formData.custom_data[field.name] || ''}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            rows={3}
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            id={field.name}
                            required={field.required}
                            value={formData.custom_data[field.name] || ''}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting || (isFull && !event.waitlist_enabled)}
                  className="w-full bg-purple-600 text-white py-3 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Registrando...' : isFull && event.waitlist_enabled ? 'Unirse a Lista de Espera' : 'Registrarse Ahora'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Al registrarte, recibirás un email con tu código QR de acceso.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p className="text-sm">Powered by EventMaster</p>
        </div>
      </footer>
    </div>
  );
}

