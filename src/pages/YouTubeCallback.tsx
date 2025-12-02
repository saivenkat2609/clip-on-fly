import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting YouTube...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      setStatus('error');
      setMessage('Authorization cancelled or failed');
      setTimeout(() => navigate('/settings?tab=social&youtube=error'), 2000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Invalid authorization response');
      setTimeout(() => navigate('/settings?tab=social&youtube=error'), 2000);
      return;
    }

    // The Cloud Function handles the token exchange automatically
    // When user is redirected here, the function has already processed the callback
    setStatus('success');
    setMessage('YouTube connected successfully!');
    setTimeout(() => navigate('/settings?tab=social&youtube=connected'), 1500);

  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">{message}</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">{message}</h2>
            <p className="text-muted-foreground">Redirecting to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h2 className="text-2xl font-bold text-red-600">{message}</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
