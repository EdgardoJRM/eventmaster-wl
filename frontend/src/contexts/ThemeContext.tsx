'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TenantBranding {
  tenant_id: string;
  tenant_name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  header_image_url?: string;
  footer_html?: string;
  favicon_url?: string;
}

interface ThemeContextType {
  branding: TenantBranding | null;
  loading: boolean;
  setBranding: (branding: TenantBranding) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  branding: null,
  loading: true,
  setBranding: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar branding del tenant desde localStorage o API
    const loadBranding = async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        if (userId) {
          // En producción, esto vendría del API
          // Por ahora, usamos valores por defecto con el userId como tenant_id
          const defaultBranding: TenantBranding = {
            tenant_id: userId,
            tenant_name: localStorage.getItem('displayName') || 'EventMaster',
            slug: localStorage.getItem('username') || 'eventmaster',
            logo_url: '',
            primary_color: '#9333ea', // Purple-600
            secondary_color: '#f3f4f6', // Gray-100
            accent_color: '#3b82f6', // Blue-500
            font_family: 'Inter, system-ui, sans-serif',
            header_image_url: '',
            footer_html: '',
            favicon_url: '',
          };

          // Intentar cargar desde API si existe
          // const response = await api.get(`/tenant/${userId}/branding`);
          // setBranding(response.data.branding);
          
          setBranding(defaultBranding);
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  // Aplicar CSS variables cuando cambia el branding
  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      
      // Colores
      root.style.setProperty('--color-primary', branding.primary_color);
      root.style.setProperty('--color-secondary', branding.secondary_color);
      root.style.setProperty('--color-accent', branding.accent_color);
      
      // Fuente
      root.style.setProperty('--font-family', branding.font_family);
      
      // Actualizar favicon si existe
      if (branding.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = branding.favicon_url;
        }
      }
      
      // Actualizar title
      document.title = `${branding.tenant_name} - Gestión de Eventos`;
    }
  }, [branding]);

  return (
    <ThemeContext.Provider value={{ branding, loading, setBranding }}>
      {children}
    </ThemeContext.Provider>
  );
}
