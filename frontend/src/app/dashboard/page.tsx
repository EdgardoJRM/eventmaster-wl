'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

interface DashboardStats {
  total_events: number;
  total_participants: number;
  total_check_ins: number;
  upcoming_events: number;
  recent_events: any[];
  weekly_stats: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
        loadStats();
      } catch (error) {
        router.push('/login');
      }
    }

    checkAuth();
  }, [router]);

  async function loadStats() {
    try {
      const response = await apiClient.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">EventMaster</h1>
              <button
                onClick={() => router.push('/events')}
                className="text-gray-600 hover:text-gray-900"
              >
                Eventos
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="text-gray-600 hover:text-gray-900"
              >
                Configuración
              </button>
            </div>
            <div className="flex items-center">
              <StyledButton onClick={handleSignOut} variant="outline">
                Cerrar Sesión
              </StyledButton>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Eventos</h3>
                <p className="text-3xl font-bold mt-2">{stats.total_events}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Participantes</h3>
                <p className="text-3xl font-bold mt-2">{stats.total_participants}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Check-ins</h3>
                <p className="text-3xl font-bold mt-2">{stats.total_check_ins}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Próximos Eventos</h3>
                <p className="text-3xl font-bold mt-2">{stats.upcoming_events}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Eventos Recientes</h3>
            {stats?.recent_events && stats.recent_events.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_events.map((event: any) => (
                  <div key={event.id} className="border-b pb-4">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(event.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.total_registrations} registrados • {event.total_check_ins} check-ins
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay eventos aún</p>
            )}
          </div>

          <div className="mt-6">
            <StyledButton onClick={() => router.push('/events/new')}>
              Crear Nuevo Evento
            </StyledButton>
          </div>
        </div>
      </main>
    </div>
  );
}

