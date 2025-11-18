'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandedHeader } from '@/components/BrandedHeader';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

interface EmailTemplate {
  template_id?: string;
  type: 'registration_confirmation' | 'check_in_reminder' | 'event_update';
  subject: string;
  html_template: string;
  variables: string[];
}

const DEFAULT_REGISTRATION_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Registro</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, {{PRIMARY_COLOR}} 0%, {{ACCENT_COLOR}} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    {{#if LOGO_URL}}
    <img src="{{LOGO_URL}}" alt="{{TENANT_NAME}}" style="max-height: 60px; margin-bottom: 15px;">
    {{/if}}
    <h1 style="color: white; margin: 0; font-size: 28px;">¡Registro Confirmado!</h1>
  </div>
  
  <div style="background: white; padding: 40px; border: 1px solid #e1e8ed; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>{{PARTICIPANT_NAME}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu registro para el evento <strong>{{EVENT_TITLE}}</strong> ha sido confirmado exitosamente.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
        Presenta este código QR en la entrada del evento:
      </p>
      <img src="{{QR_CODE_URL}}" alt="Código QR" style="max-width: 200px; border: 5px solid {{PRIMARY_COLOR}}; border-radius: 8px;">
      <p style="font-size: 12px; color: #666; margin-top: 15px;">
        Número de registro: <strong>{{REGISTRATION_NUMBER}}</strong>
      </p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">Detalles del Evento</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 30%;">📅 Fecha:</td>
          <td style="padding: 8px 0; font-weight: 600;">{{EVENT_DATE}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">🕐 Hora:</td>
          <td style="padding: 8px 0; font-weight: 600;">{{EVENT_TIME}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">📍 Lugar:</td>
          <td style="padding: 8px 0; font-weight: 600;">{{EVENT_LOCATION}}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{{EVENT_URL}}" style="display: inline-block; background: {{PRIMARY_COLOR}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">
        Ver Detalles del Evento
      </a>
    </p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
    {{#if FOOTER_HTML}}
    {{{FOOTER_HTML}}}
    {{else}}
    <p>&copy; {{CURRENT_YEAR}} {{TENANT_NAME}}. Todos los derechos reservados.</p>
    {{/if}}
  </div>
</body>
</html>`;

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { branding } = useTheme();
  const [activeTab, setActiveTab] = useState<'registration_confirmation'>('registration_confirmation');
  const [template, setTemplate] = useState<EmailTemplate>({
    type: 'registration_confirmation',
    subject: '¡Tu registro para {{EVENT_TITLE}} está confirmado!',
    html_template: DEFAULT_REGISTRATION_TEMPLATE,
    variables: [
      'PARTICIPANT_NAME',
      'PARTICIPANT_EMAIL',
      'EVENT_TITLE',
      'EVENT_DATE',
      'EVENT_TIME',
      'EVENT_LOCATION',
      'EVENT_URL',
      'QR_CODE_URL',
      'REGISTRATION_NUMBER',
      'PRIMARY_COLOR',
      'ACCENT_COLOR',
      'LOGO_URL',
      'TENANT_NAME',
      'FOOTER_HTML',
      'CURRENT_YEAR',
    ],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth || isAuth !== 'true') {
      router.push('/');
      return;
    }
    loadTemplate();
  }, [router, activeTab]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenant/email-templates/${activeTab}`);
      if (response.data.success && response.data.data) {
        setTemplate(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading template:', error);
      // Si no existe, usar el default
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/tenant/email-templates', template);
      if (response.data.success) {
        toast.success('Template guardado correctamente');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.error?.message || 'Error al guardar template');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const email = prompt('Ingresa tu email para recibir un email de prueba:');
      if (!email) return;

      const response = await api.post('/tenant/email-templates/test', {
        template_type: activeTab,
        recipient_email: email,
      });

      if (response.data.success) {
        toast.success('Email de prueba enviado. Revisa tu bandeja de entrada.');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.response?.data?.error?.message || 'Error al enviar email de prueba');
    }
  };

  const getPreviewHTML = () => {
    let html = template.html_template;
    
    // Reemplazar variables con valores de ejemplo
    const mockData: Record<string, string> = {
      PARTICIPANT_NAME: 'Juan Pérez',
      PARTICIPANT_EMAIL: 'juan@example.com',
      EVENT_TITLE: 'Conferencia de Tecnología 2025',
      EVENT_DATE: '15 de Enero, 2025',
      EVENT_TIME: '10:00 AM - 6:00 PM',
      EVENT_LOCATION: 'Centro de Convenciones',
      EVENT_URL: window.location.origin + '/events/example',
      QR_CODE_URL: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=EXAMPLE',
      REGISTRATION_NUMBER: 'REG-12345',
      PRIMARY_COLOR: branding?.primary_color || '#9333ea',
      ACCENT_COLOR: branding?.accent_color || '#3b82f6',
      LOGO_URL: branding?.logo_url || '',
      TENANT_NAME: branding?.tenant_name || 'EventMaster',
      FOOTER_HTML: branding?.footer_html || '',
      CURRENT_YEAR: new Date().getFullYear().toString(),
    };

    Object.keys(mockData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, mockData[key]);
    });

    // Handle conditionals (simplified)
    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return mockData[varName] ? content : '';
    });

    return html;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <BrandedHeader showBackButton={true} backHref="/settings" title="Email Templates" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">Personaliza los emails que se envían automáticamente</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('registration_confirmation')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'registration_confirmation'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📧 Confirmación de Registro
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando template...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor</h3>
                
                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto del Email
                  </label>
                  <input
                    type="text"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
                    placeholder="Asunto del email"
                  />
                </div>

                {/* HTML Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template HTML
                  </label>
                  <textarea
                    value={template.html_template}
                    onChange={(e) => setTemplate({ ...template, html_template: e.target.value })}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder="HTML del email..."
                  />
                </div>

                {/* Variables */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Variables Disponibles</h4>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {template.variables.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${variable}}}`);
                            toast.success('Variable copiada');
                          }}
                          className="text-left px-2 py-1 bg-white rounded border border-gray-200 hover:border-primary hover:bg-primary hover:bg-opacity-10 transition"
                          title="Click para copiar"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Haz click en una variable para copiarla al portapapeles
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Vista Previa</h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    {showPreview ? 'Ocultar' : 'Mostrar'} Preview
                  </button>
                </div>

                {showPreview && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={getPreviewHTML()}
                      className="w-full h-[600px]"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}

                {!showPreview && (
                  <div className="text-center py-12 text-gray-500">
                    Haz click en "Mostrar Preview" para ver cómo se verá el email
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Usa <code className="bg-blue-100 px-1 rounded">{`{{VARIABLE}}`}</code> para insertar datos dinámicos</li>
                  <li>• Usa <code className="bg-blue-100 px-1 rounded">{`{{#if VAR}}...{{/if}}`}</code> para condicionales</li>
                  <li>• El QR code se genera automáticamente</li>
                  <li>• Los colores del tenant se aplican automáticamente</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={handleTestEmail}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            📨 Enviar Email de Prueba
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/settings')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-md text-white font-medium transition disabled:opacity-50"
              style={{ backgroundColor: branding?.primary_color || '#9333ea' }}
            >
              {saving ? 'Guardando...' : 'Guardar Template'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

