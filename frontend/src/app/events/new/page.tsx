'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';
import toast, { Toaster } from 'react-hot-toast';

export default function NewEventPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await eventsApi.create({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      });

      if (response.success) {
        toast.success('Evento creado correctamente');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push('/dashboard')} className="text-purple-600 hover:text-purple-700 font-medium">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Crear Nuevo Evento</h2>

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
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


