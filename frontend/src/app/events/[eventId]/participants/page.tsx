'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  checked_in: boolean;
  checked_in_at?: string;
  qr_code_url?: string;
  created_at: string;
}

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens) {
          router.push('/login');
          return;
        }
        loadParticipants();
      } catch (error) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router, eventId, filterCheckedIn, pagination.page]);

  async function loadParticipants() {
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filterCheckedIn !== 'all') {
        params.checked_in = filterCheckedIn === 'checked';
      }
      if (search) {
        params.search = search;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/events/${eventId}/participants?${queryString}`);
      
      if (response.data.success) {
        setParticipants(response.data.data.participants || []);
        setPagination(response.data.data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadParticipants();
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Participantes</h2>
            <StyledButton onClick={() => router.push(`/events/${eventId}/checkin`)}>
              Check-in
            </StyledButton>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              <select
                value={filterCheckedIn}
                onChange={(e) => {
                  setFilterCheckedIn(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="all">Todos</option>
                <option value="checked">Check-in</option>
                <option value="not-checked">Sin check-in</option>
              </select>
              <StyledButton type="submit">Buscar</StyledButton>
            </form>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          participant.checked_in
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {participant.checked_in ? 'Check-in' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(participant.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {participant.qr_code_url && (
                        <a
                          href={participant.qr_code_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver QR
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total_pages > 1 && (
            <div className="mt-4 flex justify-center space-x-2">
              <StyledButton
                variant="outline"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Anterior
              </StyledButton>
              <span className="px-4 py-2">
                Página {pagination.page} de {pagination.total_pages}
              </span>
              <StyledButton
                variant="outline"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.total_pages}
              >
                Siguiente
              </StyledButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

