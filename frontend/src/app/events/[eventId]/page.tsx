'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location_name: string;
  location_address: string;
  status: string;
  total_registrations: number;
  total_check_ins: number;
  capacity: number | null;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'checkin'>('overview');

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens) {
          router.push('/login');
          return;
        }
        loadEvent();
      } catch (error) {
        router.push('/login');
      }
    }

    checkAuth();
  }, [router, eventId]);

  async function loadEvent() {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      if (response.data.success) {
        setEvent(response.data.data);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    try {
      const response = await apiClient.post(`/events/${eventId}/publish`);
      if (response.data.success) {
        loadEvent();
        alert('Evento publicado exitosamente');
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al publicar evento');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Evento no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push('/events')} className="text-primary">
                ← Eventos
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <span
                className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  event.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {event.status}
              </span>
            </div>
            <div className="flex space-x-2">
              <StyledButton
                variant="outline"
                onClick={() => router.push(`/events/${eventId}/edit`)}
              >
                Editar
              </StyledButton>
              {event.status === 'draft' && (
                <StyledButton onClick={handlePublish}>Publicar Evento</StyledButton>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'participants'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Participantes
                </button>
                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'checkin'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Check-in
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                    <p className="text-gray-700">{event.description || 'Sin descripción'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Fecha y Hora</h3>
                    <p className="text-gray-700">
                      {new Date(event.start_date).toLocaleString('es-ES')} -{' '}
                      {new Date(event.end_date).toLocaleString('es-ES')}
                    </p>
                  </div>
                  {event.location_name && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Ubicación</h3>
                      <p className="text-gray-700">{event.location_name}</p>
                      {event.location_address && (
                        <p className="text-gray-500 text-sm">{event.location_address}</p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-gray-500">Registrados</p>
                      <p className="text-2xl font-bold">{event.total_registrations}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-ins</p>
                      <p className="text-2xl font-bold">{event.total_check_ins}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Capacidad</p>
                      <p className="text-2xl font-bold">
                        {event.capacity || 'Ilimitado'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'participants' && (
                <div>
                  <p className="text-gray-500">Lista de participantes (próximamente)</p>
                </div>
              )}

              {activeTab === 'checkin' && (
                <div>
                  <p className="text-gray-500">Scanner de QR (próximamente)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

