import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, YOUTUBE_OAUTH_CALLBACK_URL } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Youtube, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface YouTubeConnection {
  id: string;
  platformUsername: string;
  platformThumbnail: string | null;
  connectedAt: number;
  isActive: boolean;
}

export function YouTubeConnection() {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<YouTubeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Listen to real-time updates for YouTube connections
    const q = query(
      collection(db, 'user_social_connections'),
      where('userId', '==', currentUser.uid),
      where('platform', '==', 'youtube'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as YouTubeConnection));
        setConnections(conns);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching YouTube connections:', error);
        toast.error('Failed to load YouTube connections');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Get auth URL from Cloud Function
      // Important: redirectUri must point to the Cloud Function, not the frontend
      const getAuthUrl = httpsCallable(functions, 'getYouTubeAuthUrl');
      const result = await getAuthUrl({
        redirectUri: YOUTUBE_OAUTH_CALLBACK_URL,
        frontendUrl: window.location.origin // Pass the actual frontend URL
      });

      const { authUrl } = result.data as { authUrl: string };

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Error connecting YouTube:', error);
      toast.error(error.message || 'Failed to connect YouTube. Please try again.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnecting(true);
    try {
      const disconnectYouTube = httpsCallable(functions, 'disconnectYouTube');
      await disconnectYouTube();
      toast.success('YouTube account disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting YouTube:', error);
      toast.error(error.message || 'Failed to disconnect YouTube. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-medium">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          YouTube Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.length === 0 ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your YouTube account to automatically post your video clips directly to your channel.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Youtube className="h-4 w-4 mr-2" />
                  Connect YouTube Account
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Post clips directly to your YouTube channel</p>
              <p>• Your videos remain on your channel, not ours</p>
              <p>• You can disconnect anytime</p>
            </div>
          </>
        ) : (
          <>
            {connections.map(conn => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {conn.platformThumbnail ? (
                    <img
                      src={conn.platformThumbnail}
                      alt={conn.platformUsername}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                      <Youtube className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      {conn.platformUsername}
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(conn.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDisconnect(conn.id)}
                  disabled={disconnecting}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  {disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </div>
            ))}

            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Videos will be posted to your YouTube channel.
                You can manage them anytime from YouTube Studio.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
