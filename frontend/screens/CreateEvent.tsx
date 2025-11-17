import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { apiService } from '../services/api';

interface EventFormData {
  title: string;
  description: string;
  slug: string;
  banner_image_url: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_online: boolean;
  };
  dates: {
    start: number;
    end: number;
    timezone: string;
    is_all_day: boolean;
  };
  capacity: number;
  registration: {
    enabled: boolean;
    opens_at: number;
    closes_at: number;
  };
}

export default function CreateEvent() {
  const { theme } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    location: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: 'USA',
      is_online: false,
    },
    dates: {
      start: 0,
      end: 0,
      timezone: 'America/New_York',
      is_all_day: false,
    },
    registration: {
      enabled: true,
      opens_at: 0,
      closes_at: 0,
    },
    capacity: 100,
  });

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.dates?.start || !formData.dates?.end) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createEvent(formData);
      if (response.data.success) {
        router.push(`/events/${response.data.data.event_id}`);
      }
    } catch (error: any) {
      console.error('Failed to create event:', error);
      alert(error.response?.data?.error?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      fontFamily: theme.typography.fontFamily,
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: 700,
          marginBottom: '2rem',
          color: theme.colors.text,
        }}>
          Create Event
        </h1>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: s <= step ? theme.colors.primary : theme.colors.border,
                marginRight: s < 4 ? '0.5rem' : 0,
              }}
            />
          ))}
        </div>

        <Card>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: '1.5rem',
                color: theme.colors.text,
              }}>
                Basic Information
              </h2>
              <Input
                label="Event Title"
                value={formData.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="Summer Music Festival 2024"
              />
              <Input
                label="Slug"
                value={formData.slug || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                required
                placeholder="summer-festival-2024"
                helperText="Used in the event URL"
              />
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: 500,
                  color: theme.colors.text,
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.layout.borderRadius,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily,
                    resize: 'vertical',
                  }}
                />
              </div>
              <Input
                label="Banner Image URL"
                value={formData.banner_image_url || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, banner_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: '1.5rem',
                color: theme.colors.text,
              }}>
                Location
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.location?.is_online}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location!, is_online: e.target.checked },
                    }))}
                  />
                  <span>Online Event</span>
                </label>
              </div>
              {!formData.location?.is_online && (
                <>
                  <Input
                    label="Location Name"
                    value={formData.location?.name || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location!, name: e.target.value },
                    }))}
                    required
                  />
                  <Input
                    label="Address"
                    value={formData.location?.address || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location!, address: e.target.value },
                    }))}
                    required
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                      label="City"
                      value={formData.location?.city || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        location: { ...prev.location!, city: e.target.value },
                      }))}
                      required
                    />
                    <Input
                      label="State"
                      value={formData.location?.state || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        location: { ...prev.location!, state: e.target.value },
                      }))}
                    />
                  </div>
                  <Input
                    label="Country"
                    value={formData.location?.country || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location!, country: e.target.value },
                    }))}
                    required
                  />
                </>
              )}
            </div>
          )}

          {/* Step 3: Dates */}
          {step === 3 && (
            <div>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: '1.5rem',
                color: theme.colors.text,
              }}>
                Date & Time
              </h2>
              <Input
                label="Start Date & Time"
                type="datetime-local"
                onChange={(e) => {
                  const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                  setFormData((prev) => ({
                    ...prev,
                    dates: { ...prev.dates!, start: timestamp },
                  }));
                }}
                required
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                onChange={(e) => {
                  const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                  setFormData((prev) => ({
                    ...prev,
                    dates: { ...prev.dates!, end: timestamp },
                  }));
                }}
                required
              />
              <Input
                label="Timezone"
                value={formData.dates?.timezone || 'America/New_York'}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  dates: { ...prev.dates!, timezone: e.target.value },
                }))}
              />
            </div>
          )}

          {/* Step 4: Settings */}
          {step === 4 && (
            <div>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: '1.5rem',
                color: theme.colors.text,
              }}>
                Settings
              </h2>
              <Input
                label="Capacity"
                type="number"
                value={formData.capacity?.toString() || '100'}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  capacity: parseInt(e.target.value) || 100,
                }))}
                required
              />
              <div style={{ marginTop: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.registration?.enabled}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      registration: { ...prev.registration!, enabled: e.target.checked },
                    }))}
                  />
                  <span>Enable Registration</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem',
          }}>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {step < 4 ? (
                <Button variant="primary" onClick={() => setStep(step + 1)}>
                  Next Step
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Create Event
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

