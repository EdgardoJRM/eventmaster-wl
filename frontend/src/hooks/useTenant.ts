'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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

export function useTenant() {
  const pathname = usePathname();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      try {
        // Detectar tenant del path o subdomain
        let tenantSlug: string | null = null;

        // Opción 1: Desde el path /[tenantSlug]/...
        const pathParts = pathname?.split('/').filter(Boolean);
        if (pathParts && pathParts.length > 0) {
          // Si el primer segmento no es una ruta conocida, asumimos que es tenant
          const knownRoutes = ['dashboard', 'events', 'settings', 'verify', 'login', 'event-detail', 'event-checkin'];
          if (!knownRoutes.includes(pathParts[0])) {
            tenantSlug = pathParts[0];
          }
        }

        // Opción 2: Desde subdomain (si aplica)
        if (typeof window !== 'undefined' && !tenantSlug) {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          
          // Si hay subdomain y no es www o app
          if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app' && !hostname.includes('localhost')) {
            tenantSlug = parts[0];
          }
        }

        if (tenantSlug) {
          // Cargar datos del tenant desde el backend
          const response = await api.get(`/public/tenants/${tenantSlug}`);
          if (response.data.success) {
            setTenant(response.data.data);
          }
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTenant();
  }, [pathname]);

  return { tenant, loading };
}

