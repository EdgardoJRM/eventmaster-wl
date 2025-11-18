'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsApi, participantsApi } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface Event {
  event_id: string;
  title: string;
  dates: {
    start: number;
    end: number;
  };
  registered_count: number;
  checked_in_count: number;
}

interface CheckInResult {
  success: boolean;
  participant?: {
    name: string;
    email: string;
    registration_number: string;
    checked_in: boolean;
    checkin_time?: number;
  };
  error?: {
    message: string;
  };
}

export default function EventCheckinPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<CheckInResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
      router.push('/');
      return;
    }

    if (eventId) {
      loadEvent();
    }
  }, [eventId, router]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getById(eventId);
      if (response.success && response.data) {
        setEvent(response.data);
      } else {
        toast.error('Evento no encontrado');
      }
    } catch (err: any) {
      console.error('Error loading event:', err);
      toast.error('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    setScanning(true);
    setLastScan(null);

    // Cleanup previous scanner if exists
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    console.log('QR Scanned:', decodedText);

    // Stop scanner temporarily
    stopScanner();

    try {
      // Parse QR data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (e) {
        toast.error('QR inválido');
        setTimeout(() => startScanner(), 2000);
        return;
      }

      // Validate QR structure
      if (!qrData.participant_id || !qrData.event_id || qrData.type !== 'event_checkin') {
        toast.error('QR code no válido para este evento');
        setTimeout(() => startScanner(), 2000);
        return;
      }

      // Validate event ID
      if (qrData.event_id !== eventId) {
        toast.error('Este QR es para otro evento');
        setTimeout(() => startScanner(), 2000);
        return;
      }

      // Process check-in
      const response = await participantsApi.checkIn(eventId, qrData.participant_id);

      if (response.success) {
        const participant = response.data?.participant || response.data;
        
        setLastScan({
          success: true,
          participant: {
            name: participant.name,
            email: participant.email,
            registration_number: participant.registration_number,
            checked_in: true,
            checkin_time: participant.checkin_time || Math.floor(Date.now() / 1000),
          },
        });

        setScanCount(prev => prev + 1);
        
        // Reload event to update stats
        loadEvent();

        // Success sound/vibration
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }

        toast.success(`✅ Check-in exitoso: ${participant.name}`);

        // Auto-restart scanner after 3 seconds
        setTimeout(() => {
          setLastScan(null);
          startScanner();
        }, 3000);
      } else {
        setLastScan({
          success: false,
          error: { message: response.error?.message || 'Error al hacer check-in' },
        });

        toast.error(response.error?.message || 'Error al hacer check-in');

        // Restart scanner after 2 seconds
        setTimeout(() => {
          setLastScan(null);
          startScanner();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMsg = error.response?.data?.error?.message || 'Error al procesar check-in';
      
      setLastScan({
        success: false,
        error: { message: errorMsg },
      });

      toast.error(errorMsg);

      // Restart scanner after 2 seconds
      setTimeout(() => {
        setLastScan(null);
        startScanner();
      }, 2000);
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignore common scanning errors (not actual errors)
    if (errorMessage.includes('NotFoundException') || errorMessage.includes('No QR code found')) {
      return;
    }
    console.warn('Scan error:', errorMessage);
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">Evento no encontrado</p>
          </div>
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.dates.start * 1000).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const checkInPercentage = event.registered_count > 0 
    ? Math.round((event.checked_in_count / event.registered_count) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={`/events/${eventId}`} className="text-purple-600 hover:text-purple-700 font-medium">
                ← Volver al Evento
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sesión: {scanCount} check-ins</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
          <p className="text-gray-600 mb-4">📅 {startDate}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{event.registered_count}</div>
              <div className="text-sm text-gray-600">Registrados</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{event.checked_in_count}</div>
              <div className="text-sm text-gray-600">Check-ins</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{checkInPercentage}%</div>
              <div className="text-sm text-gray-600">Asistencia</div>
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Scanner de Check-in
          </h2>

          {!scanning && !lastScan && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-purple-100 rounded-full mb-6">
                <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Listo para escanear</h3>
              <p className="text-gray-600 mb-8">Activa la cámara para empezar a hacer check-in de participantes</p>
              <button
                onClick={startScanner}
                className="bg-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-purple-700 transition text-lg"
              >
                🎥 Activar Cámara
              </button>
            </div>
          )}

          {scanning && (
            <div>
              <div id="qr-reader" className="rounded-lg overflow-hidden mb-4"></div>
              <div className="flex justify-center">
                <button
                  onClick={stopScanner}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  ⏹ Detener Scanner
                </button>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Apunta la cámara hacia el código QR del participante
              </p>
            </div>
          )}

          {lastScan && (
            <div className={`p-8 rounded-lg ${
              lastScan.success 
                ? 'bg-green-50 border-2 border-green-500' 
                : 'bg-red-50 border-2 border-red-500'
            }`}>
              {lastScan.success && lastScan.participant ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 mb-2">✅ Check-in Exitoso</h3>
                  <div className="bg-white rounded-lg p-4 my-4">
                    <p className="text-xl font-semibold text-gray-900">{lastScan.participant.name}</p>
                    <p className="text-sm text-gray-600">{lastScan.participant.email}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Registro: {lastScan.participant.registration_number}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Escaneando siguiente participante en 3 segundos...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-red-900 mb-2">❌ Error</h3>
                  <p className="text-red-700">{lastScan.error?.message}</p>
                  <p className="text-sm text-gray-600 mt-4">
                    Reintentando en 2 segundos...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Instrucciones</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Activa la cámara y apunta hacia el código QR</li>
            <li>✓ El check-in se procesará automáticamente</li>
            <li>✓ Verás una confirmación visual y sonora</li>
            <li>✓ El scanner se reiniciará automáticamente para el siguiente participante</li>
            <li>✓ Los duplicados serán detectados automáticamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

