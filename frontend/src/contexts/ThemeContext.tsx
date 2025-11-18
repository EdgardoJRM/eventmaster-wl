'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  fontFamily: string;
  headerImageUrl?: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  theme: initialTheme 
}: { 
  children: React.ReactNode;
  theme?: Partial<ThemeContextType>;
}) {
  const [theme, setTheme] = useState<ThemeContextType>({
    primaryColor: initialTheme?.primaryColor || '#9333ea', // purple-600
    secondaryColor: initialTheme?.secondaryColor || '#f5f5f5',
    accentColor: initialTheme?.accentColor || '#3b82f6', // blue-500
    logoUrl: initialTheme?.logoUrl,
    fontFamily: initialTheme?.fontFamily || 'Inter, sans-serif',
    headerImageUrl: initialTheme?.headerImageUrl,
  });

  useEffect(() => {
    if (initialTheme) {
      setTheme({
        primaryColor: initialTheme.primaryColor || '#9333ea',
        secondaryColor: initialTheme.secondaryColor || '#f5f5f5',
        accentColor: initialTheme.accentColor || '#3b82f6',
        logoUrl: initialTheme.logoUrl,
        fontFamily: initialTheme.fontFamily || 'Inter, sans-serif',
        headerImageUrl: initialTheme.headerImageUrl,
      });

      // Aplicar CSS variables
      document.documentElement.style.setProperty('--primary-color', initialTheme.primaryColor || '#9333ea');
      document.documentElement.style.setProperty('--secondary-color', initialTheme.secondaryColor || '#f5f5f5');
      document.documentElement.style.setProperty('--accent-color', initialTheme.accentColor || '#3b82f6');
      document.documentElement.style.setProperty('--font-family', initialTheme.fontFamily || 'Inter, sans-serif');
    }
  }, [initialTheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

