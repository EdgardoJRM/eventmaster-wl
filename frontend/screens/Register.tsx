import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Auth } from 'aws-amplify';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.name) {
      newErrors.name = 'Nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const { user } = await Auth.signUp({
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email,
          name: formData.name,
          phone_number: formData.phone || undefined,
        },
      });

      toast.success('Registro exitoso. Verifica tu email.');
      router.push(`/verify-code?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
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
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          Crear Cuenta
        </h1>

        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre completo"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Teléfono (opcional)"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
          />

          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required
            helperText="Mínimo 8 caracteres"
          />

          <Input
            label="Confirmar contraseña"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            required
          />

          <Button
            type="submit"
            loading={loading}
            fullWidth
            style={{ marginTop: '1rem' }}
          >
            Registrarse
          </Button>
        </form>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
        }}>
          ¿Ya tienes cuenta?{' '}
          <a
            href="/login"
            style={{
              color: theme.colors.primary,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Inicia sesión
          </a>
        </p>
      </Card>
    </div>
  );
};

