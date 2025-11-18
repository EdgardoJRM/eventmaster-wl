import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Decode JWT to get user info (in production, verify with backend)
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
        );
        
        setUser({
          user_id: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          role: payload['cognito:groups']?.[0] || 'staff',
          tenant_id: payload['custom:tenant_id'] || payload.tenant_id,
        });
      } catch (e) {
        // Invalid token
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  }, [router]);

  const isAuthenticated = !!user;
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin' || isOwner;
  const isStaff = user?.role === 'staff' || isAdmin;

  return {
    user,
    loading,
    isAuthenticated,
    isOwner,
    isAdmin,
    isStaff,
    login,
    logout,
    checkAuth,
  };
}

