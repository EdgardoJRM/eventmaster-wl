import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.eventmasterwl.com/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Tenant APIs
  async getTenant(tenantId?: string) {
    const url = tenantId ? `/tenant/${tenantId}` : '/tenant';
    return this.client.get(url);
  }

  async updateTenantBranding(tenantId: string, branding: any) {
    return this.client.put(`/tenant/${tenantId}/branding`, { branding });
  }

  // Event APIs
  async createEvent(data: any) {
    return this.client.post('/events', data);
  }

  async getEvents(params?: { status?: string; limit?: number; next_token?: string }) {
    return this.client.get('/events', { params });
  }

  async getEvent(eventId: string) {
    return this.client.get(`/events/${eventId}`);
  }

  async updateEvent(eventId: string, data: any) {
    return this.client.put(`/events/${eventId}`, data);
  }

  async publishEvent(eventId: string) {
    return this.client.post(`/events/${eventId}/publish`);
  }

  async deleteEvent(eventId: string) {
    return this.client.delete(`/events/${eventId}`);
  }

  // Participant APIs
  async registerParticipant(data: any) {
    return this.client.post('/participants/register', data);
  }

  async getParticipants(params?: {
    event_id?: string;
    status?: string;
    search?: string;
    limit?: number;
    next_token?: string;
  }) {
    return this.client.get('/participants', { params });
  }

  async getParticipant(participantId: string) {
    return this.client.get(`/participants/${participantId}`);
  }

  async sendQR(participantId: string) {
    return this.client.post(`/participants/${participantId}/send-qr`);
  }

  async checkIn(data: { qr_code: string; event_id?: string; location?: any }) {
    return this.client.post('/participants/checkin', data);
  }

  // Dashboard APIs
  async getDashboardStats() {
    return this.client.get('/dashboard/stats');
  }

  // Public APIs
  async getPublicEvent(tenantSlug: string, eventSlug: string) {
    return this.client.get(`/public/events/${tenantSlug}/${eventSlug}`);
  }
}

export const apiService = new ApiService();

