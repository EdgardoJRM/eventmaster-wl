'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

interface Event {
  id: string;
  slug: string;
  title: string;
  start_date: string;
  status: string;
  total_registrations: number;
  total_check_ins: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens) {
          router.push('/login');
          return;
        }
        loadEvents();
      } catch (error) {
        router.push('/login');
      }
    }

    checkAuth();
  }, [router]);

  async function loadEvents() {
    try {
      const response = await apiClient.get('/events');
      if (response.data.success) {
        setEvents(response.data.data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
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
            <div className="flex items-center">
              <StyledButton onClick={() => router.push('/events/new')}>
                Crear Evento
              </StyledButton>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Eventos</h2>

          {events.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {events.map((event) => (
                  <li key={event.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(event.start_date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {event.total_registrations} registrados
                            </p>
                            <p className="text-sm text-gray-500">
                              {event.total_check_ins} check-ins
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              event.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.status}
                          </span>
                          <StyledButton
                            variant="outline"
                            onClick={() => router.push(`/events/${event.id}`)}
                          >
                            Ver
                          </StyledButton>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 mb-4">No hay eventos aún</p>
              <StyledButton onClick={() => router.push('/events/new')}>
                Crear Primer Evento
              </StyledButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


