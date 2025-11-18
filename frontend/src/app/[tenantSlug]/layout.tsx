'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import api from '@/lib/api';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  header_image_url?: string;
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      try {
        const response = await api.get(`/public/tenants/${tenantSlug}`);
        if (response.data.success) {
          setTenant(response.data.data);
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
      } finally {
        setLoading(false);
      }
    }

    if (tenantSlug) {
      loadTenant();
    }
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Organización no encontrada</div>
      </div>
    );
  }

  return (
    <ThemeProvider
      theme={{
        primaryColor: tenant.primary_color,
        secondaryColor: tenant.secondary_color,
        accentColor: tenant.accent_color,
        logoUrl: tenant.logo_url,
        fontFamily: tenant.font_family,
        headerImageUrl: tenant.header_image_url,
      }}
    >
      {children}
    </ThemeProvider>
  );
}

