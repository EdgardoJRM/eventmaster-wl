'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams?.get('id') || '';
  const [qrData, setQrData] = useState('');
  const [checkInResult, setCheckInResult] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (!isAuthenticated || isAuthenticated !== 'true') {
        router.push('/');
        return;
      }
      loadRecentCheckIns();
    }
    
    checkAuth();
  }, [router]);

  async function loadRecentCheckIns() {
    try {
      const response = await apiClient.get(`/events/${eventId}/checkins/recent`);
      if (response.data.success) {
        setRecentCheckIns(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!qrData.trim()) return;

    setIsScanning(true);
    setCheckInResult(null);

    try {
      const response = await apiClient.post(`/events/${eventId}/checkin`, {
        qr_code: qrData,
      });

      if (response.data.success) {
        setCheckInResult(response.data.data);
        setQrData('');
        loadRecentCheckIns();
      }
    } catch (error: any) {
      console.error('Error during check-in:', error);
      setCheckInResult({
        participant: {
          id: '',
          name: 'Error',
          email: error.response?.data?.message || 'Error al hacer check-in',
          checked_in_at: '',
        },
        status: 'error',
      });
    } finally {
      setIsScanning(false);
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
              <h1 className="text-xl font-bold">Check-In</h1>
              <button
                onClick={() => router.push(`/event-detail?id=${eventId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                Volver al Evento
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Escanear QR</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código QR
                </label>
                <input
                  type="text"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
                  placeholder="Escanea o ingresa el código QR"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <StyledButton
                onClick={handleCheckIn}
                disabled={!qrData.trim() || isScanning}
              >
                {isScanning ? 'Procesando...' : 'Hacer Check-In'}
              </StyledButton>
            </div>

            {checkInResult && (
              <div
                className={`mt-6 p-4 rounded-md ${
                  checkInResult.status === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">
                  {checkInResult.status === 'success' ? '✓ Check-In Exitoso' : '✗ Error'}
                </h3>
                <p>
                  <strong>{checkInResult.participant.name}</strong>
                </p>
                <p className="text-sm text-gray-600">{checkInResult.participant.email}</p>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Check-Ins Recientes</h2>
            
            {recentCheckIns.length === 0 ? (
              <p className="text-gray-500">No hay check-ins recientes</p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkin: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{checkin.participant_name}</p>
                      <p className="text-sm text-gray-600">{checkin.participant_email}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(checkin.checked_in_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <CheckInContent />
    </Suspense>
  );
}

