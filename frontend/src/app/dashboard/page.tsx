'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { BrandedHeader } from '@/components/BrandedHeader';
import { StatsCard } from '@/components/StatsCard';
import { useTheme } from '@/contexts/ThemeContext';

interface Event {
  event_id: string;
  id?: string; // Fallback for compatibility
  title: string;
  description: string;
  location: {
    name: string;
    address: string;
    is_online: boolean;
  } | string; // Support both object and string for backward compatibility
  dates?: {
    start: number; // Unix timestamp
    end: number;
    timezone: string;
    is_all_day: boolean;
  };
  start_date?: string | number; // Fallback for compatibility
  end_date?: string | number; // Fallback for compatibility
  capacity?: number;
  registered_count?: number;
  registration_count?: number; // Alias for registered_count (backward compatibility)
  checkin_count?: number;
  checked_in_count?: number; // Alias for checkin_count
  status?: string;
  slug?: string;
  created_at?: number;
  updated_at?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const email = localStorage.getItem('userEmail');
    
    if (!isAuthenticated || isAuthenticated !== 'true') {
      router.push('/');
      return;
    }

    const displayName = localStorage.getItem('displayName') || email || '';
    setUserEmail(displayName);
    loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      // response.data.events es el array de eventos del Lambda
      setEvents(response.data?.events || []);
    } catch {
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`¿Estás seguro de eliminar el evento "${eventTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await eventsApi.delete(eventId);
      toast.success('Evento eliminado correctamente');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error al eliminar el evento');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    localStorage.removeItem('cognitoUsername');
    localStorage.removeItem('authToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  const { branding } = useTheme();

  // Calcular stats
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'published').length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
  const totalCheckins = events.reduce((sum, e) => sum + (e.checked_in_count || e.checkin_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      <BrandedHeader showLogout={true} showSettings={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Eventos"
            value={totalEvents}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="primary"
          />
          <StatsCard
            title="Eventos Activos"
            value={activeEvents}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="success"
          />
          <StatsCard
            title="Total Registros"
            value={totalRegistrations}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="accent"
          />
          <StatsCard
            title="Check-ins"
            value={totalCheckins}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            color="warning"
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Mis Eventos</h2>
            <p className="text-gray-600 mt-1">Administra y controla tus eventos</p>
          </div>
          
          <Link
            href="/events/new"
            className="btn-primary flex items-center space-x-2 shadow-lg"
            style={{ backgroundColor: branding?.primary_color }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Evento</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-4">Cargando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes eventos aún</h3>
            <p className="text-gray-600 mb-6">Crea tu primer evento para empezar a gestionar participantes</p>
            <Link
              href="/events/new"
              className="inline-flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primer Evento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {event.description || 'Sin descripción'}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {(() => {
                      const dateValue = event.dates?.start || event.start_date;
                      if (!dateValue) return 'Sin fecha';
                      const timestamp = typeof dateValue === 'number' ? dateValue : new Date(dateValue).getTime() / 1000;
                      return new Date(timestamp * 1000).toLocaleDateString();
                    })()}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {typeof event.location === 'object' && event.location !== null
                      ? (event.location.name || event.location.address || 'Sin ubicación')
                      : (typeof event.location === 'string' ? event.location : 'Sin ubicación')}
                  </div>
                  {(event.registered_count !== undefined || event.registration_count !== undefined) && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {event.registered_count || event.registration_count || 0} registrados • {event.checked_in_count || event.checkin_count || 0} check-ins
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/events/${event.event_id || event.id}`}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition text-center"
                    >
                      Ver detalles
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteEvent(event.event_id || event.id || '', event.title);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium transition"
                      title="Eliminar evento"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Copy Registration Link */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const registrationLink = `${window.location.origin}/events/${event.event_id || event.id}/register`;
                      navigator.clipboard.writeText(registrationLink);
                      toast.success('Link de registro copiado');
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition border border-blue-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Copiar link de registro</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

