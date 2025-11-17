import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Auth } from 'aws-amplify';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      await Auth.forgotPassword(email);
      setCodeSent(true);
      toast.success('Código enviado. Revisa tu email.');
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast.error(error.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      toast.success('Contraseña restablecida. Puedes iniciar sesión.');
      router.push('/login');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (codeSent) {
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
            Restablecer Contraseña
          </h1>

          <p style={{
            textAlign: 'center',
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: '1.5rem',
          }}>
            Ingresa el código que enviamos a <strong>{email}</strong>
          </p>

          <form onSubmit={handleResetPassword}>
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

            <Input
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              helperText="Mínimo 8 caracteres"
            />

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              style={{ marginTop: '1rem' }}
            >
              Restablecer contraseña
            </Button>
          </form>

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
  }

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
          ¿Olvidaste tu contraseña?
        </h1>

        <p style={{
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          marginBottom: '1.5rem',
        }}>
          Ingresa tu email y te enviaremos un código para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSendCode}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            loading={loading}
            fullWidth
            style={{ marginTop: '1rem' }}
          >
            Enviar código
          </Button>
        </form>

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

