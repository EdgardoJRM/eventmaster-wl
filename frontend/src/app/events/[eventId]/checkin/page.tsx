'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';

interface CheckIn {
  participant: {
    id: string;
    name: string;
    email: string;
    checked_in_at: string;
  };
  status: string;
}

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [qrData, setQrData] = useState('');
  const [checkInResult, setCheckInResult] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  const handleCheckIn = async () => {
    if (!qrData.trim()) {
      alert('Por favor ingresa el código QR');
      return;
    }

    setLoading(true);
    setCheckInResult(null);

    try {
      const response = await apiClient.post('/checkin', {
        qr_code_data: qrData,
        event_id: eventId,
      });

      if (response.data.success) {
        setCheckInResult(response.data.data);
        setQrData('');
        // Recargar check-ins recientes
        loadRecentCheckIns();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al hacer check-in');
    } finally {
      setLoading(false);
    }
  };

  async function loadRecentCheckIns() {
    // TODO: Implementar endpoint para obtener check-ins recientes
    // Por ahora, usar el endpoint de participantes
    try {
      const response = await apiClient.get(`/events/${eventId}/participants?checked_in=true&limit=10`);
      if (response.data.success) {
        setRecentCheckIns(response.data.data.participants || []);
      }
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  }

  useEffect(() => {
    loadRecentCheckIns();
  }, [eventId]);

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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Check-in</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Escanear QR Code</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código QR
                  </label>
                  <input
                    type="text"
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckIn();
                      }
                    }}
                    placeholder="Pega o escanea el código QR"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    autoFocus
                  />
                </div>
                <StyledButton onClick={handleCheckIn} className="w-full" disabled={loading}>
                  {loading ? 'Procesando...' : 'Hacer Check-in'}
                </StyledButton>

                {checkInResult && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      checkInResult.status === 'checked_in'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <p className="font-semibold">
                      {checkInResult.status === 'checked_in'
                        ? '✓ Check-in Exitoso'
                        : '⚠ Ya estaba registrado'}
                    </p>
                    <p className="text-sm mt-1">
                      {checkInResult.participant.name} ({checkInResult.participant.email})
                    </p>
                    {checkInResult.participant.checked_in_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(checkInResult.participant.checked_in_at).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Check-ins Recientes</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentCheckIns.length > 0 ? (
                  recentCheckIns.map((checkIn: any) => (
                    <div key={checkIn.id} className="border-b pb-2">
                      <p className="font-medium">{checkIn.name}</p>
                      <p className="text-sm text-gray-500">{checkIn.email}</p>
                      {checkIn.checked_in_at && (
                        <p className="text-xs text-gray-400">
                          {new Date(checkIn.checked_in_at).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No hay check-ins aún</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


