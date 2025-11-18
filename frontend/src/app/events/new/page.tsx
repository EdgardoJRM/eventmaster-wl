'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { StyledButton } from '@/components/StyledButton';
import toast, { Toaster } from 'react-hot-toast';
import { BrandedHeader } from '@/components/BrandedHeader';
import { useTheme } from '@/contexts/ThemeContext';

export default function NewEventPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Información básica
    title: '',
    short_description: '',
    description: '',
    banner_image_url: '',
    featured_image_url: '',
    
    // Ubicación
    is_virtual: false,
    location_name: '',
    location_address: '',
    location_city: '',
    location_state: '',
    location_country: 'México',
    location_zip: '',
    virtual_meeting_url: '',
    
    // Fecha y capacidad
    start_date: '',
    end_date: '',
    timezone: 'America/Mexico_City',
    capacity: '',
    waitlist_enabled: false,
    
    // Registro
    registration_enabled: true,
    max_per_person: '1',
    require_phone: false,
    custom_fields: '[]',
    
    // Publicación
    status: 'draft',
    visibility: 'public',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
      router.push('/');
    }
  }, [router]);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : 0,
        max_per_person: parseInt(formData.max_per_person) || 1,
      };

      const response = await eventsApi.create(payload);

      if (response.success) {
        toast.success('Evento creado correctamente');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.error?.message || 'Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  const { branding } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      <BrandedHeader showBackButton={true} backHref="/dashboard" title="Crear Nuevo Evento" />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Crear Nuevo Evento</h2>
            <p className="text-gray-600 mt-2">Complete toda la información de su evento</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    s === step ? 'bg-purple-600 text-white' : 
                    s < step ? 'bg-green-600 text-white' : 
                    'bg-gray-200 text-gray-600'
                  } font-bold`}>
                    {s < step ? '✓' : s}
                  </div>
                  {s < 5 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={step === 1 ? 'text-purple-600 font-medium' : 'text-gray-500'}>Básico</span>
              <span className={step === 2 ? 'text-purple-600 font-medium' : 'text-gray-500'}>Ubicación</span>
              <span className={step === 3 ? 'text-purple-600 font-medium' : 'text-gray-500'}>Fecha</span>
              <span className={step === 4 ? 'text-purple-600 font-medium' : 'text-gray-500'}>Registro</span>
              <span className={step === 5 ? 'text-purple-600 font-medium' : 'text-gray-500'}>Publicar</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
            {/* Step 1: Información Básica */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Título del Evento *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Conferencia de Tecnología 2025"
                  />
                </div>

                <div>
                  <label htmlFor="short_description" className="block text-sm font-medium text-gray-700">
                    Descripción Corta
                  </label>
                  <input
                    type="text"
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Una línea de descripción"
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo 150 caracteres</p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción Completa *
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe tu evento en detalle..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="banner_image_url" className="block text-sm font-medium text-gray-700">
                      URL Banner (1200x400)
                    </label>
                    <input
                      type="url"
                      id="banner_image_url"
                      value={formData.banner_image_url}
                      onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label htmlFor="featured_image_url" className="block text-sm font-medium text-gray-700">
                      URL Imagen Destacada (800x600)
                    </label>
                    <input
                      type="url"
                      id="featured_image_url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Ubicación */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Ubicación del Evento</h3>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_virtual}
                      onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Este es un evento virtual/online
                    </span>
                  </label>
                </div>

                {formData.is_virtual ? (
                  <div>
                    <label htmlFor="virtual_meeting_url" className="block text-sm font-medium text-gray-700">
                      URL de la Reunión Virtual *
                    </label>
                    <input
                      type="url"
                      id="virtual_meeting_url"
                      required
                      value={formData.virtual_meeting_url}
                      onChange={(e) => setFormData({ ...formData, virtual_meeting_url: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="location_name" className="block text-sm font-medium text-gray-700">
                        Nombre del Lugar *
                      </label>
                      <input
                        type="text"
                        id="location_name"
                        required
                        value={formData.location_name}
                        onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ej: Centro de Convenciones"
                      />
                    </div>

                    <div>
                      <label htmlFor="location_address" className="block text-sm font-medium text-gray-700">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        id="location_address"
                        required
                        value={formData.location_address}
                        onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Calle y número"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="location_city" className="block text-sm font-medium text-gray-700">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          id="location_city"
                          required
                          value={formData.location_city}
                          onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="location_state" className="block text-sm font-medium text-gray-700">
                          Estado *
                        </label>
                        <input
                          type="text"
                          id="location_state"
                          required
                          value={formData.location_state}
                          onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="location_zip" className="block text-sm font-medium text-gray-700">
                          Código Postal
                        </label>
                        <input
                          type="text"
                          id="location_zip"
                          value={formData.location_zip}
                          onChange={(e) => setFormData({ ...formData, location_zip: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location_country" className="block text-sm font-medium text-gray-700">
                        País *
                      </label>
                      <input
                        type="text"
                        id="location_country"
                        required
                        value={formData.location_country}
                        onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Fecha y Capacidad */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Fecha y Capacidad</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Fecha y Hora de Inicio *
                    </label>
                    <input
                      type="datetime-local"
                      id="start_date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      Fecha y Hora de Fin *
                    </label>
                    <input
                      type="datetime-local"
                      id="end_date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Zona Horaria *
                  </label>
                  <select
                    id="timezone"
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                    <option value="America/New_York">Nueva York (GMT-5)</option>
                    <option value="America/Chicago">Chicago (GMT-6)</option>
                    <option value="America/Denver">Denver (GMT-7)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Capacidad Máxima
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Dejar en 0 para ilimitado"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = capacidad ilimitada</p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.waitlist_enabled}
                      onChange={(e) => setFormData({ ...formData, waitlist_enabled: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Habilitar lista de espera cuando se llene
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Registro */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Configuración de Registro</h3>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.registration_enabled}
                      onChange={(e) => setFormData({ ...formData, registration_enabled: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Permitir registros para este evento
                    </span>
                  </label>
                </div>

                {formData.registration_enabled && (
                  <>
                    <div>
                      <label htmlFor="max_per_person" className="block text-sm font-medium text-gray-700">
                        Máximo de Registros por Persona
                      </label>
                      <input
                        type="number"
                        id="max_per_person"
                        min="1"
                        max="10"
                        value={formData.max_per_person}
                        onChange={(e) => setFormData({ ...formData, max_per_person: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cuántas personas puede registrar un usuario</p>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.require_phone}
                          onChange={(e) => setFormData({ ...formData, require_phone: e.target.checked })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Requerir número de teléfono
                        </span>
                      </label>
                    </div>

                    <div>
                      <label htmlFor="custom_fields" className="block text-sm font-medium text-gray-700">
                        Campos Personalizados (JSON)
                      </label>
                      <textarea
                        id="custom_fields"
                        rows={4}
                        value={formData.custom_fields}
                        onChange={(e) => setFormData({ ...formData, custom_fields: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                        placeholder='[{"name": "company", "label": "Empresa", "type": "text", "required": false}]'
                      />
                      <p className="text-xs text-gray-500 mt-1">Formato JSON para campos adicionales en el formulario</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Publicación */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Publicar Evento</h3>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Estado del Evento *
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="draft">Borrador (no visible)</option>
                    <option value="published">Publicado (visible)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.status === 'draft' ? 
                      '⚠️ El evento está en borrador y no será visible públicamente' : 
                      '✅ El evento será visible públicamente'
                    }
                  </p>
                </div>

                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                    Visibilidad *
                  </label>
                  <select
                    id="visibility"
                    required
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="public">Público (aparece en búsquedas)</option>
                    <option value="unlisted">No listado (solo con link directo)</option>
                    <option value="private">Privado (requiere invitación)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.visibility === 'public' && '🌍 Cualquiera puede ver y registrarse'}
                    {formData.visibility === 'unlisted' && '🔗 Solo quienes tengan el link pueden verlo'}
                    {formData.visibility === 'private' && '🔒 Solo invitados pueden ver y registrarse'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Resumen del Evento</h4>
                  <dl className="text-sm space-y-1">
                    <div className="flex"><dt className="font-medium w-32">Título:</dt><dd className="text-gray-700">{formData.title || '(sin título)'}</dd></div>
                    <div className="flex"><dt className="font-medium w-32">Ubicación:</dt><dd className="text-gray-700">{formData.is_virtual ? '🌐 Virtual' : `📍 ${formData.location_name || '(sin ubicación)'}`}</dd></div>
                    <div className="flex"><dt className="font-medium w-32">Capacidad:</dt><dd className="text-gray-700">{formData.capacity || '∞ Ilimitada'}</dd></div>
                    <div className="flex"><dt className="font-medium w-32">Registro:</dt><dd className="text-gray-700">{formData.registration_enabled ? '✅ Habilitado' : '❌ Deshabilitado'}</dd></div>
                    <div className="flex"><dt className="font-medium w-32">Estado:</dt><dd className="text-gray-700">{formData.status === 'draft' ? '📝 Borrador' : '✅ Publicado'}</dd></div>
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={step === 1 ? () => router.push('/dashboard') : handlePrev}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                {step === 1 ? 'Cancelar' : '← Anterior'}
              </button>
              
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Creando Evento...' : '✅ Crear Evento'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


