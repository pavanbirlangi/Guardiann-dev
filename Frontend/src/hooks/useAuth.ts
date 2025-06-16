import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  pendingNavigation?: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
  user?: any;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle navigation after auth state changes
  useEffect(() => {
    if (authState.pendingNavigation) {
      navigate(authState.pendingNavigation);
      setAuthState(prev => ({ ...prev, pendingNavigation: undefined }));
    }
  }, [authState.pendingNavigation, navigate]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      
      if (accessToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('idToken');
          localStorage.removeItem('user');
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const setLoading = (loading: boolean) => {
    setAuthState(prev => ({ ...prev, loading }));
  };

  const handleError = (error: any) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  };

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post<AuthResponse>('/auth/register', credentials);
      
      toast({
        title: 'Registration Successful',
        description: 'Please check your email for verification code.',
      });

      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post<AuthResponse>('/auth/verify-email', { email, code });
      
      toast({
        title: 'Email Verified',
        description: 'Your email has been verified successfully.',
      });

      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      
      const { tokens, user } = response.data;
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('Invalid authentication response: Missing tokens');
      }

      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('idToken', tokens.idToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Check for redirect URL
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      const targetRoute = redirectUrl || (user.role === 'ADMIN' ? '/admin/dashboard' : '/');
      
      // Clear the redirect URL
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
      }

      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        pendingNavigation: targetRoute
      });

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      return response.data;
    } catch (error) {
      handleError(error);
      setLoading(false);
      throw error;
    }
  }, [navigate, toast]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      // Clear all auth data first
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      
      // Update auth state immediately
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });

      // Then try to logout from server
      if (accessToken) {
        try {
          await axiosInstance.post('/auth/logout', { accessToken });
        } catch (error) {
          console.error('Server logout error:', error);
          // Continue with local logout even if server logout fails
        }
      }

      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully.',
      });

      // Navigate after state is cleared
      navigate('/', { replace: true });
    } catch (error) {
      handleError(error);
      // Even if everything fails, try to clear storage and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  const handleGoogleAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get the current URL for the redirect
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGoogleCallback = useCallback(async (authData: any) => {
    try {
      setLoading(true);
      
      const { tokens, user } = authData;
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('Invalid authentication response: Missing tokens');
      }

      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('idToken', tokens.idToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Check for redirect URL
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      const targetRoute = redirectUrl || (user.role === 'ADMIN' ? '/admin/dashboard' : '/');
      
      // Clear the redirect URL
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
      }

      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        pendingNavigation: targetRoute
      });

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      return authData;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your email for the verification code.',
      });

      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/confirm-forgot-password', {
        email,
        code,
        newPassword,
      });
      
      toast({
        title: 'Password Reset Successful',
        description: 'You can now login with your new password.',
      });

      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    ...authState,
    register,
    verifyEmail,
    login,
    logout,
    handleGoogleAuth,
    handleGoogleCallback,
    forgotPassword,
    resetPassword,
  };
}; 