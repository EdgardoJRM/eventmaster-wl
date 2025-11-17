import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { Button } from '../components/Button';
import Link from 'next/link';

interface DashboardStats {
  total_events: number;
  total_participants: number;
  total_checkins: number;
  upcoming_events: number;
  events_by_status: {
    draft: number;
    published: number;
    cancelled: number;
    completed: number;
  };
  recent_events: Array<{
    event_id: string;
    title: string;
    registered_count: number;
    checked_in_count: number;
    dates: { start: number };
  }>;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, authLoading]);

  const loadStats = async () => {
    try {
      const response = await apiService.getDashboardStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isAuthenticated) {
    return null;
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
          Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: theme.colors.textSecondary }}>{user?.email}</span>
          <Link href="/events">
            <Button variant="primary">Events</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <StatCard
            title="Total Events"
            value={stats?.total_events || 0}
            color={theme.colors.primary}
          />
          <StatCard
            title="Total Participants"
            value={stats?.total_participants || 0}
            color={theme.colors.accent}
          />
          <StatCard
            title="Check-ins"
            value={stats?.total_checkins || 0}
            color={theme.colors.success}
          />
          <StatCard
            title="Upcoming Events"
            value={stats?.upcoming_events || 0}
            color={theme.colors.warning}
          />
        </div>

        {/* Events by Status */}
        {stats && (
          <div style={{
            backgroundColor: theme.colors.surface,
            padding: '1.5rem',
            borderRadius: theme.layout.borderRadius,
            marginBottom: '2rem',
          }}>
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              marginBottom: '1rem',
              color: theme.colors.text,
            }}>
              Events by Status
            </h2>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <StatusBadge label="Draft" count={stats.events_by_status.draft} color={theme.colors.textSecondary} />
              <StatusBadge label="Published" count={stats.events_by_status.published} color={theme.colors.success} />
              <StatusBadge label="Cancelled" count={stats.events_by_status.cancelled} color={theme.colors.error} />
              <StatusBadge label="Completed" count={stats.events_by_status.completed} color={theme.colors.primary} />
            </div>
          </div>
        )}

        {/* Recent Events */}
        {stats && stats.recent_events.length > 0 && (
          <div style={{
            backgroundColor: theme.colors.surface,
            padding: '1.5rem',
            borderRadius: theme.layout.borderRadius,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                color: theme.colors.text,
                margin: 0,
              }}>
                Recent Events
              </h2>
              <Link href="/events">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.recent_events.map((event) => (
                <EventCard key={event.event_id} event={event} theme={theme} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/events/new">
            <Button variant="primary" size="lg">
              Create New Event
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const { theme } = useTheme();
  
  return (
    <div style={{
      backgroundColor: theme.colors.surface,
      padding: '1.5rem',
      borderRadius: theme.layout.borderRadius,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: '0.5rem',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: 700,
        color: theme.colors.text,
      }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: color,
      }} />
      <span style={{ fontWeight: 500 }}>{label}: {count}</span>
    </div>
  );
}

function EventCard({ event, theme }: { event: any; theme: any }) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div style={{
      padding: '1rem',
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.layout.borderRadius,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          margin: 0,
          marginBottom: '0.5rem',
          color: theme.colors.text,
        }}>
          {event.title}
        </h3>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
        }}>
          {formatDate(event.dates.start)} • {event.registered_count} registered • {event.checked_in_count} checked in
        </div>
      </div>
      <Link href={`/events/${event.event_id}`}>
        <Button variant="outline" size="sm">View</Button>
      </Link>
    </div>
  );
}

