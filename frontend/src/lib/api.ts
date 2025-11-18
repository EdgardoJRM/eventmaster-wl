import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  async (config) => {
    // Obtener token de Cognito si está disponible
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      if (session.tokens?.idToken) {
        config.headers.Authorization = `Bearer ${session.tokens.idToken.toString()}`;
      }
    } catch (error) {
      // No hay sesión activa, continuar sin token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

