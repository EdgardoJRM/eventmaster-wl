import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface TenantTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    headerImageUrl?: string;
    loginBackgroundUrl?: string;
  };
  layout: {
    headerHeight: string;
    footerHeight: string;
    borderRadius: string;
    shadow: string;
  };
}

const defaultTheme: TenantTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#10B981',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFont: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  branding: {
    logoUrl: '',
    faviconUrl: '',
  },
  layout: {
    headerHeight: '64px',
    footerHeight: '80px',
    borderRadius: '8px',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
};

interface ThemeContextType {
  theme: TenantTheme;
  updateTheme: (updates: Partial<TenantTheme>) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  tenantSlug?: string;
  initialTheme?: Partial<TenantTheme>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  tenantSlug,
  initialTheme,
}) => {
  const [theme, setTheme] = useState<TenantTheme>({
    ...defaultTheme,
    ...initialTheme,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      if (!tenantSlug) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch tenant branding from API
        const response = await fetch(`/api/tenant/${tenantSlug}/branding`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const tenantBranding = data.data.branding;
            
            setTheme((prev) => ({
              ...prev,
              colors: {
                ...prev.colors,
                primary: tenantBranding.primary_color || prev.colors.primary,
                secondary: tenantBranding.secondary_color || prev.colors.secondary,
                accent: tenantBranding.accent_color || prev.colors.accent,
              },
              typography: {
                ...prev.typography,
                fontFamily: tenantBranding.font_family || prev.typography.fontFamily,
              },
              branding: {
                logoUrl: tenantBranding.logo_url || prev.branding.logoUrl,
                faviconUrl: tenantBranding.favicon_url || prev.branding.faviconUrl,
                headerImageUrl: tenantBranding.header_image_url,
                loginBackgroundUrl: tenantBranding.login_background_url,
              },
            }));

            // Update favicon
            if (tenantBranding.favicon_url) {
              const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
              if (link) {
                link.href = tenantBranding.favicon_url;
              }
            }

            // Update CSS variables
            const root = document.documentElement;
            root.style.setProperty('--color-primary', tenantBranding.primary_color || defaultTheme.colors.primary);
            root.style.setProperty('--color-secondary', tenantBranding.secondary_color || defaultTheme.colors.secondary);
            root.style.setProperty('--color-accent', tenantBranding.accent_color || defaultTheme.colors.accent);
            root.style.setProperty('--font-family', tenantBranding.font_family || defaultTheme.typography.fontFamily);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [tenantSlug]);

  const updateTheme = (updates: Partial<TenantTheme>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

