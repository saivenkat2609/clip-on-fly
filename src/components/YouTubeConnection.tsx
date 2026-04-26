import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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

// Cloudflare Worker handles the YouTube OAuth callback
const YOUTUBE_OAUTH_CALLBACK_URL = `${import.meta.env.VITE_WORKERS_API_URL}/youtube/callback`;

const API_BASE = import.meta.env.VITE_WORKERS_API_URL;

// Helper: call Cloudflare Worker with Supabase auth token
async function callFunction(path: string, body: object = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchConnections(userId: string): Promise<YouTubeConnection[]> {
  const { data: rows } = await supabase
    .from('user_social_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'youtube')
    .eq('is_active', true);

  return (rows ?? []).map(row => ({
    id: row.id,
    platformUsername: row.channel_name,
    platformThumbnail: null,
    connectedAt: new Date(row.connected_at).getTime(),
    isActive: true,
  }));
}

export function YouTubeConnection() {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<YouTubeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    const userId = currentUser.uid;

    // Initial fetch
    fetchConnections(userId).then(conns => {
      setConnections(conns);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load YouTube connections');
      setLoading(false);
    });

    // Real-time: re-fetch whenever this user's connections change
    // Replaces: onSnapshot(query(ref, where(...), where(...), where(...)))
    const channel = supabase
      .channel(`youtube_connections_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_social_connections',
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchConnections(userId).then(setConnections);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Replaces: httpsCallable(functions, 'getYouTubeAuthUrl')
      const { authUrl } = await callFunction('/youtube/auth-url', {
        redirectUri: YOUTUBE_OAUTH_CALLBACK_URL,
        frontendUrl: window.location.origin,
      });
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect YouTube. Please try again.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnecting(true);
    try {
      // Replaces: httpsCallable(functions, 'disconnectYouTube')
      await callFunction('/youtube/disconnect', { connectionId });
      toast.success('YouTube account disconnected successfully');
    } catch (error: any) {
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
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
              ) : (
                <><Youtube className="h-4 w-4 mr-2" />Connect YouTube Account</>
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
              <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  {conn.platformThumbnail ? (
                    <img src={conn.platformThumbnail} alt={conn.platformUsername} className="w-10 h-10 rounded-full" />
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
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
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
