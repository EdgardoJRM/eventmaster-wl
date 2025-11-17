import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import { Button } from '../components/Button';

interface Event {
  event_id: string;
  title: string;
  description: string;
  banner_image_url: string;
  location: {
    name: string;
    address: string;
    city: string;
    state?: string;
    country: string;
  };
  dates: {
    start: number;
    end: number;
    timezone: string;
  };
  capacity: number;
  registered_count: number;
  registration: {
    enabled: boolean;
    opens_at: number;
    closes_at: number;
  };
  tenant: {
    name: string;
    branding: {
      primary_color: string;
      logo_url: string;
    };
  };
}

const PublicEventPageContent: React.FC = () => {
  const router = useRouter();
  const tenantSlug = router.query.tenant as string;
  const eventSlug = router.query.slug as string;
  const { theme } = useTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug || !eventSlug) return;

    const fetchEvent = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.eventmasterwl.com/v1'}/public/events/${tenantSlug}/${eventSlug}`);
        const data = await response.json();
        
        if (data.success) {
          setEvent(data.data);
        } else {
          setError(data.error?.message || 'Event not found');
        }
      } catch (err) {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [tenantSlug, eventSlug]);

  if (loading) {
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

  if (error || !event) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: theme.typography.fontFamily,
      }}>
        <h1 style={{ color: theme.colors.error }}>Event Not Found</h1>
        <p style={{ color: theme.colors.textSecondary }}>{error}</p>
      </div>
    );
  }

  const isRegistrationOpen = () => {
    const now = Math.floor(Date.now() / 1000);
    return (
      event.registration.enabled &&
      now >= event.registration.opens_at &&
      now <= event.registration.closes_at &&
      event.registered_count < event.capacity
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
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
      }}>
        {event.tenant.branding.logo_url && (
          <img
            src={event.tenant.branding.logo_url}
            alt={event.tenant.name}
            style={{ maxHeight: '40px' }}
          />
        )}
      </header>

      {/* Hero Banner */}
      {event.banner_image_url && (
        <div style={{
          width: '100%',
          height: '400px',
          backgroundImage: `url(${event.banner_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      )}

      {/* Event Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: 700,
          marginBottom: '1rem',
          color: theme.colors.text,
        }}>
          {event.title}
        </h1>

        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <strong style={{ color: theme.colors.textSecondary }}>Date & Time</strong>
            <p>{formatDate(event.dates.start)}</p>
          </div>
          <div>
            <strong style={{ color: theme.colors.textSecondary }}>Location</strong>
            <p>
              {event.location.name}
              <br />
              {event.location.address}, {event.location.city}
              {event.location.state && `, ${event.location.state}`}
            </p>
          </div>
        </div>

        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.layout.borderRadius,
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.xl,
            marginBottom: '1rem',
          }}>
            About This Event
          </h2>
          <p style={{
            lineHeight: 1.6,
            color: theme.colors.textSecondary,
          }}>
            {event.description}
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.layout.borderRadius,
        }}>
          <p style={{
            marginBottom: '1rem',
            fontSize: theme.typography.fontSize.lg,
          }}>
            {event.registered_count} of {event.capacity} registered
          </p>
          
          {isRegistrationOpen() ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.href = `/${tenantSlug}/evento/${eventSlug}/registro`}
            >
              Register Now
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              disabled
            >
              Registration Closed
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '4rem',
        padding: '2rem',
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
        borderTop: `1px solid ${theme.colors.border}`,
      }}>
        <p>© {new Date().getFullYear()} {event.tenant.name}</p>
      </footer>
    </div>
  );
};

export default function PublicEventPage() {
  const router = useRouter();
  const tenantSlug = router.query.tenant as string;

  return (
    <ThemeProvider tenantSlug={tenantSlug}>
      <PublicEventPageContent />
    </ThemeProvider>
  );
}

