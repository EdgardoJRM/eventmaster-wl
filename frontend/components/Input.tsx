import React from 'react';
import { useTheme } from './ThemeProvider';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  style: propStyle,
  ...props
}) => {
  const { theme } = useTheme();

  const inputStyles: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    border: `1px solid ${error ? theme.colors.error : theme.colors.border}`,
    borderRadius: theme.layout.borderRadius,
    transition: 'border-color 0.2s ease',
    outline: 'none',
    ...propStyle,
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 500,
    color: theme.colors.text,
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: theme.colors.error, marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      <input
        className={className}
        style={inputStyles}
        {...props}
      />
      {error && (
        <p style={{
          marginTop: '0.25rem',
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.error,
        }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p style={{
          marginTop: '0.25rem',
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

