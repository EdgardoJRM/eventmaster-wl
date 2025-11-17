import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './useAuth';

interface Tenant {
  tenant_id: string;
  slug: string;
  name: string;
  branding: {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    header_image_url?: string;
    login_background_url?: string;
    footer_text?: string;
  };
}

export function useTenant() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenant_id) {
      loadTenant();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTenant();
      if (response.data.success) {
        setTenant(response.data.data);
      } else {
        setError(response.data.error?.message || 'Failed to load tenant');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (branding: Partial<Tenant['branding']>) => {
    if (!tenant) return;

    try {
      const response = await apiService.updateTenantBranding(tenant.tenant_id, branding);
      if (response.data.success) {
        setTenant((prev) => prev ? { ...prev, branding: { ...prev.branding, ...branding } } : null);
        return { success: true };
      } else {
        return { success: false, error: response.data.error?.message };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error?.message || 'Failed to update branding',
      };
    }
  };

  return {
    tenant,
    loading,
    error,
    loadTenant,
    updateBranding,
  };
}

