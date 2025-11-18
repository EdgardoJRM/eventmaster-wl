import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { Button } from '../components/Button';
import Link from 'next/link';

interface Event {
  event_id: string;
  title: string;
  slug: string;
  status: string;
  dates: { start: number; end: number };
  capacity: number;
  registered_count: number;
  checked_in_count: number;
  created_at: number;
}

export default function EventsList() {
  const { theme } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated, authLoading, statusFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await apiService.getEvents(params);
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return theme.colors.success;
      case 'draft':
        return theme.colors.textSecondary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: theme.typography.fontFamily,
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: theme.typography.fontFamily,
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
    }}>
      {/* Header */}
      <header style={{
        height: theme.layout.headerHeight,
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
      }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: 700,
          color: theme.colors.text,
          margin: 0,
        }}>
          Events
        </h1>
        <Link href="/events/new">
          <Button variant="primary">Create Event</Button>
        </Link>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.layout.borderRadius,
              fontSize: theme.typography.fontSize.base,
              fontFamily: theme.typography.fontFamily,
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.layout.borderRadius,
              fontSize: theme.typography.fontSize.base,
              fontFamily: theme.typography.fontFamily,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
            }}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: theme.colors.textSecondary,
          }}>
            <p style={{ fontSize: theme.typography.fontSize.lg, marginBottom: '1rem' }}>
              No events found
            </p>
            <Link href="/events/new">
              <Button variant="primary">Create Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredEvents.map((event) => (
              <EventCard key={event.event_id} event={event} theme={theme} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ event, theme }: { event: Event; theme: any }) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return theme.colors.success;
      case 'draft':
        return theme.colors.textSecondary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <div style={{
      backgroundColor: theme.colors.surface,
      padding: '1.5rem',
      borderRadius: theme.layout.borderRadius,
      border: `1px solid ${theme.colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            margin: 0,
            color: theme.colors.text,
          }}>
            {event.title}
          </h3>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: theme.typography.fontSize.sm,
            backgroundColor: getStatusColor(event.status) + '20',
            color: getStatusColor(event.status),
            textTransform: 'capitalize',
          }}>
            {event.status}
          </span>
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
          marginBottom: '0.5rem',
        }}>
          {formatDate(event.dates.start)}
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
        }}>
          {event.registered_count} / {event.capacity} registered • {event.checked_in_count} checked in
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link href={`/events/${event.event_id}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
        <Link href={`/events/${event.event_id}/edit`}>
          <Button variant="outline" size="sm">Edit</Button>
        </Link>
      </div>
    </div>
  );
}

