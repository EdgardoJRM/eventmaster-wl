'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  useThemeColors?: boolean;
}

export function StyledButton({ 
  variant = 'primary', 
  children, 
  className = '', 
  useThemeColors = false,
  ...props 
}: StyledButtonProps) {
  let theme;
  try {
    theme = useTheme();
  } catch {
    theme = null;
  }

  // Si hay theme y useThemeColors es true, usar colores dinámicos
  if (theme && theme.branding && useThemeColors) {
    const styles = {
      primary: {
        backgroundColor: theme.branding.primary_color,
        color: '#ffffff',
      },
      secondary: {
        backgroundColor: theme.branding.secondary_color,
        color: theme.branding.primary_color,
      },
      outline: {
        border: `2px solid ${theme.branding.primary_color}`,
        color: theme.branding.primary_color,
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

  // Fallback a colores estáticos
  const variantStyles = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border-2 border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


