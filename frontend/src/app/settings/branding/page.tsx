'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTheme } from '@/contexts/ThemeContext';
import { BrandedHeader } from '@/components/BrandedHeader';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

interface BrandingData {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  header_image_url?: string;
  favicon_url?: string;
  footer_html?: string;
}

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { branding, loading: themeLoading } = useTheme();
  const { uploadFile, uploading, progress } = useFileUpload();
  
  const [formData, setFormData] = useState<BrandingData>({
    logo_url: '',
    primary_color: '#9333ea',
    secondary_color: '#f3f4f6',
    accent_color: '#3b82f6',
    font_family: 'Inter, system-ui, sans-serif',
    header_image_url: '',
    favicon_url: '',
    footer_html: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    // Check auth
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth || isAuth !== 'true') {
      router.push('/');
      return;
    }
    
    // Load current branding
    if (branding) {
      setFormData({
        logo_url: branding.logo_url || '',
        primary_color: branding.primary_color || '#9333ea',
        secondary_color: branding.secondary_color || '#f3f4f6',
        accent_color: branding.accent_color || '#3b82f6',
        font_family: branding.font_family || 'Inter, system-ui, sans-serif',
        header_image_url: branding.header_image_url || '',
        favicon_url: branding.favicon_url || '',
        footer_html: branding.footer_html || '',
      });
    }
  }, [branding, router]);

  const handleFileUpload = async (file: File, assetType: 'logo' | 'banner' | 'favicon') => {
    setUploadingType(assetType);
    const result = await uploadFile({ assetType, file });
    
    if (result) {
      const fieldMap = {
        logo: 'logo_url',
        banner: 'header_image_url',
        favicon: 'favicon_url',
      };
      
      setFormData(prev => ({
        ...prev,
        [fieldMap[assetType]]: result.publicUrl,
      }));
      
      toast.success(`${assetType} subido exitosamente`);
    } else {
      toast.error(`Error al subir ${assetType}`);
    }
    
    setUploadingType(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await api.put('/tenant/branding', formData);
      
      if (response.data.success) {
        toast.success('Branding actualizado correctamente');
        // Reload theme
        window.location.reload();
      } else {
        toast.error(response.data.error?.message || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast.error(error.response?.data?.error?.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <BrandedHeader showBackButton={true} backHref="/settings" title="Configuración de Marca" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Personaliza tu Marca</h2>
          
          {/* Logo Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la Organización
            </label>
            <div className="flex items-center space-x-4">
              {formData.logo_url && (
                <img src={formData.logo_url} alt="Logo" className="h-16 w-auto border rounded" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingType === 'logo' ? `Subiendo... ${progress}%` : 'Subir Logo'}
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (máx 2MB)</p>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon (ícono del navegador)
            </label>
            <div className="flex items-center space-x-4">
              {formData.favicon_url && (
                <img src={formData.favicon_url} alt="Favicon" className="h-8 w-8 border rounded" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/x-icon,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'favicon');
                  }}
                  className="hidden"
                  id="favicon-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="favicon-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {uploadingType === 'favicon' ? `Subiendo... ${progress}%` : 'Subir Favicon'}
                </label>
                <p className="text-xs text-gray-500 mt-1">ICO, PNG 32x32px</p>
              </div>
            </div>
          </div>

          {/* Header/Banner Image */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de Header (Landing Page)
            </label>
            <div className="flex items-center space-x-4">
              {formData.header_image_url && (
                <img src={formData.header_image_url} alt="Header" className="h-20 w-auto border rounded" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'banner');
                  }}
                  className="hidden"
                  id="header-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="header-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {uploadingType === 'banner' ? `Subiendo... ${progress}%` : 'Subir Header'}
                </label>
                <p className="text-xs text-gray-500 mt-1">1200x400px recomendado</p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Colores de Marca</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Primario
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#9333ea"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Secundario
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#f3f4f6"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de Acento
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipografía
            </label>
            <select
              value={formData.font_family}
              onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Open Sans, sans-serif">Open Sans</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="Poppins, sans-serif">Poppins</option>
              <option value="Lato, sans-serif">Lato</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
            </select>
          </div>

          {/* Footer HTML */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML del Footer (opcional)
            </label>
            <textarea
              value={formData.footer_html}
              onChange={(e) => setFormData({ ...formData, footer_html: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              placeholder="<p>&copy; 2025 Mi Empresa. Todos los derechos reservados.</p>"
            />
            <p className="text-xs text-gray-500 mt-1">HTML que se mostrará en el footer de tus páginas públicas</p>
          </div>

          {/* Preview Section */}
          <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h3>
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg text-white text-center font-semibold"
                style={{ backgroundColor: formData.primary_color }}
              >
                Botón Primario
              </div>
              <div 
                className="p-4 rounded-lg border-2 text-center font-semibold"
                style={{ 
                  borderColor: formData.primary_color,
                  color: formData.primary_color,
                  backgroundColor: formData.secondary_color
                }}
              >
                Botón Secundario
              </div>
              <div 
                className="p-4 rounded-lg text-white text-center font-semibold"
                style={{ 
                  backgroundColor: formData.accent_color,
                  fontFamily: formData.font_family
                }}
              >
                Texto con tipografía seleccionada
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              onClick={() => router.push('/settings')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-6 py-2 rounded-md text-white font-medium transition disabled:opacity-50"
              style={{ backgroundColor: formData.primary_color }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
