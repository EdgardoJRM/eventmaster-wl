import axios from 'axios';
import { config } from '../config';
import { signIn, confirmSignIn } from 'aws-amplify/auth';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Use idToken for Cognito authorization
  const token = localStorage.getItem('idToken');
  if (token && typeof token === 'string' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth tokens
      localStorage.removeItem('idToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API - uses Cognito directly, not REST endpoints
export const authApi = {
  requestMagicLink: async (email: string) => {
    try {
      // Primero intentamos signIn
      const signInOutput = await signIn({
        username: email,
        options: {
          authFlowType: 'CUSTOM_WITHOUT_SRP',
        },
      });
      
      return {
        success: true,
        message: 'Magic link sent to your email',
        nextStep: signInOutput.nextStep,
      };
    } catch (error: any) {
      console.error('Error requesting magic link:', error);
      
      // Si el usuario no existe, lo creamos primero con signUp
      if (error.name === 'UserNotFoundException') {
        try {
          const { signUp } = await import('aws-amplify/auth');
          
          // SignUp sin password (custom auth)
          const name = email.split('@')[0]; // Usar parte antes del @ como name
          await signUp({
            username: email,
            password: Math.random().toString(36).slice(-16) + 'Aa1!', // Password temporal (no se usa)
            options: {
              userAttributes: {
                email: email,
                name: name, // Atributo requerido por User Pool
              },
              autoSignIn: false, // Deshabilitado para evitar múltiples emails
            },
          });
          
          // Pequeño delay para que se complete el signUp
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Reintentamos signIn después de crear el usuario
          const signInOutput = await signIn({
            username: email,
            options: {
              authFlowType: 'CUSTOM_WITHOUT_SRP',
            },
          });
          
          return {
            success: true,
            message: 'Magic link sent to your email',
            nextStep: signInOutput.nextStep,
          };
        } catch (signUpError: any) {
          console.error('Error creating user:', signUpError);
          throw signUpError;
        }
      }
      
      throw error;
    }
  },
  
  verifyMagicLink: async (email: string, code: string) => {
    try {
      // Usar endpoint REST en lugar de Cognito directamente
      const response = await api.post('/auth/magic-link/verify', { email, code });
      return response.data;
    } catch (error: any) {
      console.error('Error verifying magic link:', error);
      throw error;
    }
  },
};

// Events API
export const eventsApi = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/events', data);
    return response.data;
  },
  
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

// Participants API
export const participantsApi = {
  getByEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/participants`);
    return response.data;
  },
  
  getById: async (eventId: string, participantId: string) => {
    const response = await api.get(`/events/${eventId}/participants/${participantId}`);
    return response.data;
  },
  
  register: async (eventId: string, data: Record<string, unknown>) => {
    const response = await api.post(`/events/${eventId}/participants`, data);
    return response.data;
  },
  
  checkIn: async (eventId: string, participantId: string) => {
    const response = await api.post(`/events/${eventId}/participants/${participantId}/checkin`);
    return response.data;
  },
};

// Upload API
export const uploadApi = {
  getPresignedUrl: async (type: 'image', fileName: string, fileType: string, fileSize: number, eventId?: string) => {
    const response = await api.post('/upload', { 
      uploadType: type,
      fileName, 
      fileType,
      fileSize,
      eventId,
    });
    return response.data;
  },
  
  uploadFile: async (presignedUrl: string, file: File, contentType: string, onProgress?: (progress: number) => void) => {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': contentType || file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
};

export default api;


