'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import apiClient from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';
import { useTenant } from '@/hooks/useTenant';

export default function BrandingPage() {
  const router = useRouter();
  const { tenant, loading: tenantLoading } = useTenant();
  const [formData, setFormData] = useState({
    logo_url: '',
    primary_color: '#3f5e78',
    secondary_color: '#f5f5f5',
    accent_color: '#007bff',
    font_family: 'Inter, sans-serif',
    header_image_url: '',
    login_background_image_url: '',
    footer_html: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (tenant) {
      setFormData({
        logo_url: tenant.logo_url || '',
        primary_color: tenant.primary_color || '#3f5e78',
        secondary_color: tenant.secondary_color || '#f5f5f5',
        accent_color: tenant.accent_color || '#007bff',
        font_family: tenant.font_family || 'Inter, sans-serif',
        header_image_url: tenant.header_image_url || '',
        login_background_image_url: tenant.login_background_image_url || '',
        footer_html: tenant.footer_html || '',
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await apiClient.put('/tenant/updateBranding', formData);
      if (response.data.success) {
        alert('Branding actualizado exitosamente');
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al actualizar branding');
    } finally {
      setSaving(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => router.push('/dashboard')} className="text-primary">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Configuración de Branding</h2>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://..."
              />
              {formData.logo_url && (
                <img src={formData.logo_url} alt="Logo preview" className="mt-2 h-20" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Primario
                </label>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="block w-full h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Secundario
                </label>
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="block w-full h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Accento
                </label>
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="block w-full h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente
              </label>
              <input
                type="text"
                value={formData.font_family}
                onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Inter, sans-serif"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Image URL
              </label>
              <input
                type="url"
                value={formData.header_image_url}
                onChange={(e) => setFormData({ ...formData, header_image_url: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Background Image URL
              </label>
              <input
                type="url"
                value={formData.login_background_image_url}
                onChange={(e) => setFormData({ ...formData, login_background_image_url: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer HTML
              </label>
              <textarea
                rows={6}
                value={formData.footer_html}
                onChange={(e) => setFormData({ ...formData, footer_html: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="<div>Custom Footer</div>"
              />
            </div>

            <div className="flex justify-end">
              <StyledButton type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </StyledButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


