'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location_name: '',
    location_address: '',
    capacity: '',
    timezone: 'America/Mexico_City',
  });

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
        const event = response.data.data;
        setFormData({
          title: event.title || '',
          description: event.description || '',
          start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
          end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
          location_name: event.location_name || '',
          location_address: event.location_address || '',
          capacity: event.capacity ? event.capacity.toString() : '',
          timezone: event.timezone || 'America/Mexico_City',
        });
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await apiClient.put(`/events/${eventId}`, {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      });

      if (response.data.success) {
        router.push(`/events/${eventId}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al actualizar evento');
    } finally {
      setSaving(false);
    }
  };

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
              <button onClick={() => router.push(`/events/${eventId}`)} className="text-primary">
                ← Evento
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Editar Evento</h2>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Fecha Inicio *
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  Fecha Fin *
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location_name" className="block text-sm font-medium text-gray-700">
                Nombre del Lugar
              </label>
              <input
                type="text"
                id="location_name"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="location_address" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                id="location_address"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacidad (dejar vacío para ilimitado)
              </label>
              <input
                type="number"
                id="capacity"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <StyledButton
                type="button"
                variant="outline"
                onClick={() => router.push(`/events/${eventId}`)}
              >
                Cancelar
              </StyledButton>
              <StyledButton type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </StyledButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

