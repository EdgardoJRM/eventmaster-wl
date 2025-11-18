import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Auth } from 'aws-amplify';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import toast from 'react-hot-toast';

export const VerifyCode: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState('');
  const email = router.query.email as string;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    if (!email) {
      toast.error('Email no encontrado');
      router.push('/register');
      return;
    }

    setLoading(true);
    try {
      await Auth.confirmSignUp(email, code);
      toast.success('Email verificado. Puedes iniciar sesión.');
      router.push('/login');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error('Email no encontrado');
      return;
    }

    setResending(true);
    try {
      await Auth.resendSignUp(email);
      toast.success('Código reenviado. Revisa tu email.');
    } catch (error: any) {
      console.error('Error resending code:', error);
      toast.error(error.message || 'Error al reenviar código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      padding: '2rem',
    }}>
      <Card style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: 700,
          color: theme.colors.text,
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}>
          Verificar Email
        </h1>

        <p style={{
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          marginBottom: '1.5rem',
        }}>
          Ingresa el código de 6 dígitos que enviamos a:
          <br />
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify}>
          <Input
            label="Código de verificación"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            style={{
              textAlign: 'center',
              fontSize: '1.5rem',
              letterSpacing: '0.5rem',
              fontWeight: 600,
            }}
          />

          <Button
            type="submit"
            loading={loading}
            fullWidth
            style={{ marginTop: '1rem' }}
          >
            Verificar
          </Button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
        }}>
          <p style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: '0.5rem',
          }}>
            ¿No recibiste el código?
          </p>
          <Button
            variant="secondary"
            onClick={handleResendCode}
            loading={resending}
            size="sm"
          >
            Reenviar código
          </Button>
        </div>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
        }}>
          <a
            href="/login"
            style={{
              color: theme.colors.primary,
              textDecoration: 'none',
            }}
          >
            Volver a login
          </a>
        </p>
      </Card>
    </div>
  );
};

