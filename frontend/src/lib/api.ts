import axios from 'axios';
import { config } from '../config';

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

// Auth API - MODELO PODCAST PLATFORM (REST puro, sin Cognito Custom Auth)
export const authApi = {
  requestMagicLink: async (email: string) => {
    const response = await api.post('/auth/magic-link/request', { email });
    return response.data;
  },
  
  verifyMagicLink: async (token: string) => {
    const response = await api.post('/auth/magic-link/verify', { token });
    return response.data;
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
  
  resendEmail: async (eventId: string, participantId: string) => {
    const response = await api.post(`/events/${eventId}/participants/${participantId}/resend-email`);
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


