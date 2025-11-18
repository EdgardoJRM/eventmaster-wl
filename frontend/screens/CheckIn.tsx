import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

interface CheckInResult {
  participant_id: string;
  name: string;
  status: string;
  checked_in_at?: number;
  message: string;
}

export default function CheckIn() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [qrCode, setQrCode] = useState('');
  const [manualEntry, setManualEntry] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Request camera access for QR scanning
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error('Camera access denied:', err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCheckIn = async (qrData?: string) => {
    const qrToCheck = qrData || manualEntry || qrCode;
    if (!qrToCheck) {
      toast.error('Please enter or scan a QR code');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.checkIn({
        qr_code: qrToCheck,
        event_id: selectedEventId || undefined,
      });

      if (response.data.success) {
        setLastCheckIn(response.data.data);
        toast.success('Check-in successful!');
        setManualEntry('');
        setQrCode('');
      } else {
        const error = response.data.error;
        if (error.code === 'ALREADY_CHECKED') {
          toast.error('Participant already checked in');
          setLastCheckIn(error.data);
        } else {
          toast.error(error.message || 'Check-in failed');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to access check-in</div>;
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
          Check-in Scanner
        </h1>

        <Card title="Scan QR Code">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: 500,
              color: theme.colors.text,
            }}>
              Select Event (Optional)
            </label>
            <Input
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              placeholder="Event ID"
            />
          </div>

          {/* Camera View */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto 1.5rem',
            borderRadius: theme.layout.borderRadius,
            overflow: 'hidden',
            backgroundColor: '#000',
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
            }} />
          </div>

          {/* Manual Entry */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: 500,
              color: theme.colors.text,
            }}>
              Or Enter QR Code Manually
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder="Paste QR code data here"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckIn();
                  }
                }}
              />
              <Button
                variant="primary"
                onClick={() => handleCheckIn()}
                loading={loading}
              >
                Check In
              </Button>
            </div>
          </div>
        </Card>

        {/* Last Check-in Result */}
        {lastCheckIn && (
          <Card
            title="Last Check-in"
            style={{ marginTop: '1.5rem' }}
          >
            <div style={{
              padding: '1rem',
              backgroundColor: lastCheckIn.status === 'checked_in'
                ? theme.colors.success + '20'
                : theme.colors.warning + '20',
              borderRadius: theme.layout.borderRadius,
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: theme.colors.text,
              }}>
                {lastCheckIn.name}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
              }}>
                Status: {lastCheckIn.status}
              </div>
              {lastCheckIn.checked_in_at && (
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                }}>
                  Checked in at: {new Date(lastCheckIn.checked_in_at * 1000).toLocaleString()}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

