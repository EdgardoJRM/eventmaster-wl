import React from 'react';
import { useTheme } from './ThemeProvider';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();

  const baseStyles = {
    fontFamily: theme.typography.fontFamily,
    borderRadius: theme.layout.borderRadius,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const sizeStyles = {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      padding: '0.75rem 1.5rem',
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      padding: '1rem 2rem',
      fontSize: theme.typography.fontSize.lg,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: '#FFFFFF',
      border: 'none',
      '&:hover': {
        backgroundColor: theme.colors.secondary,
      },
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      color: '#FFFFFF',
      border: 'none',
      '&:hover': {
        backgroundColor: theme.colors.primary,
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
      border: `2px solid ${theme.colors.primary}`,
      '&:hover': {
        backgroundColor: theme.colors.primary,
        color: '#FFFFFF',
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text,
      border: 'none',
      '&:hover': {
        backgroundColor: theme.colors.surface,
      },
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      style={combinedStyles}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : theme.colors.primary}`,
              borderTop: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          Loading...
        </span>
      ) : (
        children
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

