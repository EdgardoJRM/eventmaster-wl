'use client';

import { useTheme } from '../contexts/ThemeContext';

interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function StyledButton({ variant = 'primary', children, className = '', ...props }: StyledButtonProps) {
  const theme = useTheme();

  const styles = {
    primary: {
      backgroundColor: theme.primaryColor,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.secondaryColor,
      color: theme.primaryColor,
    },
    outline: {
      border: `2px solid ${theme.primaryColor}`,
      color: theme.primaryColor,
      backgroundColor: 'transparent',
    },
  };

  return (
    <button
      style={styles[variant]}
      className={`px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

