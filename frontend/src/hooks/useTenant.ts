'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

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
  login_background_image_url?: string;
  footer_html?: string;
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenant() {
      try {
        const response = await apiClient.get('/tenant');
        if (response.data.success) {
          setTenant(response.data.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tenant');
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, []);

  return { tenant, loading, error };
}


