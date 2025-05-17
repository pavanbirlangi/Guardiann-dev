import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const data = searchParams.get('data');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!data) {
          throw new Error('No authentication data received');
        }

        const authData = JSON.parse(decodeURIComponent(data));
        await handleGoogleCallback(authData);
      } catch (error) {
        console.error('Error handling Google callback:', error);
        toast({
          title: 'Authentication Failed',
          description: error instanceof Error ? error.message : 'There was an error during Google authentication. Please try again.',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    };

    handleCallback();
  }, [searchParams, handleGoogleCallback, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Completing Authentication</h2>
        <p className="text-gray-600">Please wait while we complete your Google sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback; 