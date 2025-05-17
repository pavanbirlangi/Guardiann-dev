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

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
  user: {
    email: string;
    role: string;
    name: string;
  };
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
      console.log('Executing pending navigation to:', authState.pendingNavigation);
      navigate(authState.pendingNavigation);
      // Clear the pending navigation
      setAuthState(prev => ({ ...prev, pendingNavigation: undefined }));
    }
  }, [authState.pendingNavigation, navigate]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      console.log('Initializing auth state...');
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      
      if (accessToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('Found existing auth data:', { user });
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
        console.log('No existing auth data found');
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
    console.error('Authentication Error:', error);
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  };

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      console.log('Attempting registration with:', { ...credentials, password: '[REDACTED]' });
      setLoading(true);
      const response = await axiosInstance.post<AuthResponse>('/auth/register', credentials);
      console.log('Registration response:', response.data);
      
      toast({
        title: 'Registration Successful',
        description: 'Please check your email for verification code.',
      });

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      console.log('Attempting email verification:', { email, code });
      setLoading(true);
      const response = await axiosInstance.post<AuthResponse>('/auth/verify-email', { email, code });
      console.log('Email verification response:', response.data);
      
      toast({
        title: 'Email Verified',
        description: 'Your email has been verified successfully.',
      });

      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('Attempting login with:', { ...credentials, password: '[REDACTED]' });
      setLoading(true);
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      const { tokens, user } = response.data;
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('Invalid authentication response: Missing tokens');
      }

      console.log('Storing tokens and user data...');
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('idToken', tokens.idToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Updating auth state...');
      // Update auth state and redirect based on role
      const targetRoute = user.role === 'ADMIN' ? '/admin/dashboard' : '/';
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
      console.error('Login error:', error);
      handleError(error);
      // Make sure to set loading to false on error
      setLoading(false);
      throw error;
    }
  }, [navigate, toast]);

  const logout = useCallback(async () => {
    try {
      console.log('Attempting logout');
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        await axiosInstance.post('/auth/logout', { accessToken });
      }

      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });

      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully.',
      });

      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  const handleGoogleAuth = useCallback(async () => {
    try {
      console.log('Initiating Google authentication');
      setLoading(true);
      
      // Get the current URL for the redirect
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    } catch (error) {
      console.error('Google auth error:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Google OAuth callback
  const handleGoogleCallback = useCallback(async (authData: any) => {
    try {
      console.log('Handling Google callback with auth data:', authData);
      setLoading(true);
      
      const { tokens, user } = authData;
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('Invalid authentication response: Missing tokens');
      }

      console.log('Storing tokens and user data...');
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('idToken', tokens.idToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Updating auth state...');
      // Update auth state and redirect based on role
      const targetRoute = user.role === 'ADMIN' ? '/admin/dashboard' : '/';
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
      console.error('Google callback error:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      console.log('Attempting forgot password for:', email);
      setLoading(true);
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your email for the verification code.',
      });

      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    try {
      console.log('Attempting password reset for:', email);
      setLoading(true);
      const response = await axiosInstance.post('/auth/confirm-forgot-password', {
        email,
        code,
        newPassword,
      });
      console.log('Password reset response:', response.data);
      
      toast({
        title: 'Password Reset Successful',
        description: 'You can now login with your new password.',
      });

      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
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