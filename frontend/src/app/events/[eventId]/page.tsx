'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsApi, participantsApi } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { BrandedHeader } from '@/components/BrandedHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface Event {
  event_id: string;
  tenant_id: string;
  title: string;
  description: string;
  slug?: string;
  location: {
    name: string;
    address: string;
    is_online: boolean;
  };
  dates: {
    start: number;
    end: number;
    timezone: string;
    is_all_day: boolean;
  };
  capacity: number;
  registered_count: number;
  checked_in_count: number;
  status: string;
  created_at: number;
}

interface Participant {
  participant_id: string;
  name: string;
  email: string;
  phone?: string;
  registration_number: string;
  status: string;
  registered_at: number;
  checked_in: boolean;
  checkin_time?: number;
  custom_data?: Record<string, any>;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'pending' | 'waitlist'>('all');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
      router.push('/');
      return;
    }

    if (eventId) {
      loadEventData();
    }
  }, [eventId, router]);

  // Filter participants when search or filter changes
  useEffect(() => {
    let filtered = [...participants];

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'checked_in') {
        filtered = filtered.filter(p => p.checked_in);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(p => !p.checked_in && p.status === 'registered');
      } else if (statusFilter === 'waitlist') {
        filtered = filtered.filter(p => p.status === 'waitlist');
      }
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.registration_number.toLowerCase().includes(term)
      );
    }

    setFilteredParticipants(filtered);
  }, [participants, searchTerm, statusFilter]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const eventResponse = await eventsApi.getById(eventId);
      
      if (eventResponse.success && eventResponse.data) {
        setEvent(eventResponse.data);
        
        // Load participants if available
        try {
          const participantsResponse = await participantsApi.getByEvent(eventId);
          if (participantsResponse.success && participantsResponse.data) {
            setParticipants(participantsResponse.data.participants || []);
          }
        } catch (err) {
          console.log('No participants yet or error loading:', err);
        }
      }
    } catch (error: any) {
      console.error('Error loading event:', error);
      toast.error('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (participantId: string) => {
    try {
      await participantsApi.checkIn(eventId, participantId);
      toast.success('Check-in realizado correctamente');
      loadEventData();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Error al realizar check-in');
    }
  };

  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No hay participantes para exportar');
      return;
    }

    // CSV Header
    const headers = ['Nombre', 'Email', 'Teléfono', 'Número de Registro', 'Estado', 'Check-in', 'Fecha Registro', 'Fecha Check-in'];
    
    // CSV Rows
    const rows = filteredParticipants.map(p => [
      p.name,
      p.email,
      p.phone || '',
      p.registration_number,
      p.status === 'waitlist' ? 'Lista de Espera' : 'Registrado',
      p.checked_in ? 'Sí' : 'No',
      new Date(p.registered_at * 1000).toLocaleString('es-ES'),
      p.checkin_time ? new Date(p.checkin_time * 1000).toLocaleString('es-ES') : ''
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `participantes-${event?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${filteredParticipants.length} participantes exportados`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Evento no encontrado</h2>
          <p className="text-gray-600 mb-6">El evento que buscas no existe o no tienes acceso.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const availableSpots = event.capacity - event.registered_count;
  const checkInPercentage = event.registered_count > 0 
    ? Math.round((event.checked_in_count / event.registered_count) * 100)
    : 0;

  const { branding } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      <BrandedHeader 
        showBackButton={true} 
        backHref="/dashboard"
        title={event.title}
      >
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          event.status === 'published' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {event.status === 'published' ? 'Publicado' : 'Borrador'}
        </span>
      </BrandedHeader>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Date & Time */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Fecha y Hora</p>
                <p className="text-sm text-gray-600">{formatDate(event.dates.start)}</p>
                <p className="text-sm text-gray-600">
                  {formatTime(event.dates.start)} - {formatTime(event.dates.end)}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ubicación</p>
                <p className="text-sm text-gray-600">{event.location.name}</p>
                {event.location.address && (
                  <p className="text-sm text-gray-500">{event.location.address}</p>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Capacidad</p>
                <p className="text-sm text-gray-600">
                  {event.registered_count} / {event.capacity} registrados
                </p>
                <p className="text-sm text-gray-500">
                  {availableSpots > 0 ? `${availableSpots} lugares disponibles` : 'Evento lleno'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">Registrados</p>
                  <p className="text-3xl font-bold text-purple-600">{event.registered_count}</p>
                </div>
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Check-ins</p>
                  <p className="text-3xl font-bold text-green-600">{event.checked_in_count}</p>
                  <p className="text-xs text-green-700">{checkInPercentage}% asistencia</p>
                </div>
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Disponibles</p>
                  <p className="text-3xl font-bold text-blue-600">{availableSpots}</p>
                  <p className="text-xs text-blue-700">de {event.capacity} totales</p>
                </div>
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'details'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detalles del Evento
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'participants'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Participantes ({participants.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {event.description || 'Sin descripción'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Adicional</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID del Evento</dt>
                      <dd className="text-sm text-gray-900 font-mono">{event.event_id}</dd>
                    </div>
                    {event.slug && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Slug</dt>
                        <dd className="text-sm text-gray-900">{event.slug}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Zona Horaria</dt>
                      <dd className="text-sm text-gray-900">{event.dates.timezone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Creado el</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(event.created_at * 1000).toLocaleDateString('es-MX')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex space-x-4 pt-4 border-t">
                  <Link
                    href={`/events/${eventId}/edit`}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition text-center"
                  >
                    Editar Evento
                  </Link>
                  <button
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition"
                  >
                    Compartir
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Buscar por nombre, email o número de registro..."
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="all">Todos ({participants.length})</option>
                      <option value="checked_in">Check-in realizado ({participants.filter(p => p.checked_in).length})</option>
                      <option value="pending">Pendientes ({participants.filter(p => !p.checked_in && p.status === 'registered').length})</option>
                      <option value="waitlist">Lista de espera ({participants.filter(p => p.status === 'waitlist').length})</option>
                    </select>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={exportToCSV}
                    disabled={filteredParticipants.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                  </button>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{filteredParticipants.length}</span> de{' '}
                    <span className="font-medium">{participants.length}</span> participantes
                  </p>
                  <Link
                    href={`/events/${eventId}/checkin`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Scanner QR
                  </Link>
                </div>

                {/* Participants Table */}
                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {participants.length === 0 ? 'No hay participantes' : 'No se encontraron participantes'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {participants.length === 0 
                        ? 'Aún no hay participantes registrados en este evento.' 
                        : 'Intenta con otro filtro o término de búsqueda.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registro #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-in
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredParticipants.map((participant) => (
                          <tr key={participant.participant_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(participant.registered_at * 1000).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{participant.email}</div>
                              {participant.phone && (
                                <div className="text-xs text-gray-500">{participant.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {participant.registration_number}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {participant.status === 'waitlist' ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                  Lista de Espera
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Registrado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {participant.checked_in ? (
                                <div>
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    ✓ Realizado
                                  </span>
                                  {participant.checkin_time && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(participant.checkin_time * 1000).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              {!participant.checked_in && participant.status !== 'waitlist' && (
                                <button
                                  onClick={() => handleCheckIn(participant.participant_id)}
                                  className="text-purple-600 hover:text-purple-900 font-medium"
                                  title="Hacer check-in"
                                >
                                  Check-in
                                </button>
                              )}
                              <button
                                onClick={() => toast('Función de reenviar QR próximamente', { icon: '📧' })}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                                title="Reenviar QR"
                              >
                                Reenviar QR
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

