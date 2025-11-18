import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

export default function Login() {
  const { theme } = useTheme();
  const { tenant } = useTenant();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In production, use Cognito for authentication
      // For now, this is a placeholder
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.data.token);
        login(data.data.token, data.data.user);
        router.push('/dashboard');
      } else {
        setError(data.error?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backgroundStyle: React.CSSProperties = tenant?.branding.login_background_url
    ? {
        backgroundImage: `url(${tenant.branding.login_background_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundColor: theme.colors.primary,
      };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.typography.fontFamily,
      ...backgroundStyle,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: theme.colors.background,
          padding: '2.5rem',
          borderRadius: theme.layout.borderRadius,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}>
          {tenant?.branding.logo_url && (
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem',
            }}>
              <img
                src={tenant.branding.logo_url}
                alt={tenant.name}
                style={{ maxHeight: '60px' }}
              />
            </div>
          )}

          <h1 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: theme.colors.text,
          }}>
            Welcome Back
          </h1>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: theme.colors.error + '20',
              color: theme.colors.error,
              borderRadius: theme.layout.borderRadius,
              fontSize: theme.typography.fontSize.sm,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div style={{
              marginBottom: '1.5rem',
              textAlign: 'right',
            }}>
              <a
                href="/forgot-password"
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.primary,
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textSecondary,
          }}>
            Don't have an account?{' '}
            <a
              href="/register"
              style={{
                color: theme.colors.primary,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

