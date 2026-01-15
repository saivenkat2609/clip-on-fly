/**
 * React hook for WebSocket connections
 *
 * Manages WebSocket lifecycle and provides status updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VideoStatusWebSocket, WebSocketMessage, createVideoWebSocket } from '../lib/websocket';
import { apiClient } from '../lib/apiClient';

export interface UseWebSocketOptions {
  sessionId: string;
  onMessage: (data: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export interface UseWebSocketReturn {
  connectionState: string;
  isConnected: boolean;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Hook for managing WebSocket connections to video processing service
 *
 * @param options - WebSocket configuration options
 * @returns WebSocket connection state and controls
 *
 * @example
 * ```tsx
 * const { connectionState, isConnected } = useWebSocket({
 *   sessionId,
 *   onMessage: (data) => {
 *     if (data.event === 'processing_complete') {
 *       // Refetch video data
 *       queryClient.invalidateQueries(['video', sessionId]);
 *       toast.success('Video processing complete!');
 *     }
 *   },
 *   enabled: !!sessionId
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { sessionId, onMessage, onError, enabled = true } = options;
  const wsRef = useRef<VideoStatusWebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [isConnected, setIsConnected] = useState(false);

  // Handle WebSocket messages
  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('[useWebSocket] Message received:', data);
    onMessage(data);
  }, [onMessage]);

  // Handle WebSocket errors
  const handleError = useCallback((error: Event) => {
    console.error('[useWebSocket] Error:', error);
    setConnectionState('ERROR');
    setIsConnected(false);

    if (onError) {
      onError(error);
    }
  }, [onError]);

  // Handle WebSocket open
  const handleOpen = useCallback(() => {
    console.log('[useWebSocket] Connection opened');
    setConnectionState('CONNECTED');
    setIsConnected(true);
  }, []);

  // Handle WebSocket close
  const handleClose = useCallback(() => {
    console.log('[useWebSocket] Connection closed');
    setConnectionState('DISCONNECTED');
    setIsConnected(false);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!sessionId || !enabled) {
      console.log('[useWebSocket] Connection disabled or no session ID');
      return;
    }

    // Create WebSocket client if it doesn't exist
    if (!wsRef.current) {
      console.log('[useWebSocket] Creating WebSocket client...');
      wsRef.current = createVideoWebSocket(handleMessage, handleError);
      wsRef.current['onOpen'] = handleOpen;
      wsRef.current['onClose'] = handleClose;
    }

    // Connect to session
    console.log(`[useWebSocket] Connecting to session: ${sessionId}`);
    setConnectionState('CONNECTING');
    wsRef.current.connect(sessionId);
  }, [sessionId, enabled, handleMessage, handleError, handleOpen, handleClose]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('[useWebSocket] Disconnecting...');
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setConnectionState('DISCONNECTED');
    setIsConnected(false);
  }, []);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    console.log('[useWebSocket] Reconnecting...');
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Connect on mount and when sessionId changes
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    }

    // Disconnect on unmount
    return () => {
      disconnect();
    };
  }, [sessionId, enabled]); // Note: connect and disconnect are stable due to useCallback

  // Update connection state periodically
  useEffect(() => {
    if (!wsRef.current || !enabled) return;

    const interval = setInterval(() => {
      const state = wsRef.current?.getState() || 'DISCONNECTED';
      setConnectionState(state);
      setIsConnected(state === 'CONNECTED');
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  return {
    connectionState,
    isConnected,
    disconnect,
    reconnect
  };
}

/**
 * Hook for subscribing to video processing status updates
 *
 * @example
 * ```tsx
 * const { status } = useVideoStatus({
 *   sessionId,
 *   onComplete: () => {
 *     toast.success('Processing complete!');
 *   }
 * });
 * ```
 */
export interface UseVideoStatusOptions {
  sessionId: string;
  onComplete?: (data: WebSocketMessage) => void;
  onProgress?: (data: WebSocketMessage) => void;
  onError?: (data: WebSocketMessage) => void;
  enabled?: boolean;
}

export function useVideoStatus(options: UseVideoStatusOptions) {
  const { sessionId, onComplete, onProgress, onError: onErrorCallback, enabled = true } = options;
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [wsFailureCount, setWsFailureCount] = useState(0);

  console.log('[useVideoStatus] Initialized:', { sessionId, enabled, usePolling });

  // WebSocket error handler with fallback logic
  const handleWebSocketError = useCallback((error: Event) => {
    console.error('[useVideoStatus] WebSocket error:', error);
    setWsFailureCount((prev) => {
      const newCount = prev + 1;
      // Fall back to polling after 3 consecutive failures
      if (newCount >= 3) {
        console.warn('[useVideoStatus] WebSocket failed 3 times, falling back to polling');
        setUsePolling(true);
      }
      return newCount;
    });
  }, []);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('[useVideoStatus] 📥 Message received:', {
      event: data.event,
      status: data.status,
      progress: data.data?.progress,
      fullData: data
    });

    // Reset failure count on successful message
    setWsFailureCount(0);

    // Update status (keep as-is, can be number or string)
    if (data.status !== undefined) {
      console.log('[useVideoStatus] ✏️ Updating status:', data.status);
      setStatus(data.status);
    }

    // Update progress (handle both number and string types)
    if (data.data?.progress !== undefined) {
      const progressValue = data.data.progress;
      console.log('[useVideoStatus] ✏️ Updating progress:', progressValue);

      // If progress is a number, use it directly
      // If it's a string, try to parse it or use as message
      if (typeof progressValue === 'number') {
        setProgress(progressValue);
      } else if (typeof progressValue === 'string') {
        // Try to extract a number from the string, otherwise keep as 0
        const numMatch = progressValue.match(/\d+/);
        const numValue = numMatch ? parseInt(numMatch[0], 10) : 0;
        setProgress(numValue);
      }
    }

    // Handle events
    switch (data.event) {
      case 'processing_complete':
        console.log('[useVideoStatus] 🎉 Processing complete!');
        setStatus('completed');
        setProgress(100);
        if (onComplete) {
          onComplete(data);
        }
        break;

      case 'processing_progress':
        console.log('[useVideoStatus] 📊 Processing progress event');
        if (onProgress) {
          onProgress(data);
        }
        break;

      case 'processing_error':
        console.error('[useVideoStatus] ❌ Processing error:', data.data?.error);
        setStatus('failed');
        setError(data.data?.error || 'Processing failed');
        if (onErrorCallback) {
          onErrorCallback(data);
        }
        break;

      default:
        console.log('[useVideoStatus] ⚠️ Unknown event:', data.event);
    }
  }, [onComplete, onProgress, onErrorCallback]);

  // WebSocket connection (only if not using polling)
  const ws = useWebSocket({
    sessionId,
    onMessage: handleMessage,
    onError: handleWebSocketError,
    enabled: enabled && !usePolling
  });

  // Polling fallback using React Query
  const { data: pollingData, error: pollingError } = useQuery({
    queryKey: ['video-status-polling', sessionId],
    queryFn: async () => {
      console.log('[useVideoStatus] 🔄 Polling status for session:', sessionId);
      try {
        const response = await apiClient.get(`/status/${sessionId}`);
        console.log('[useVideoStatus] 📊 Polling response:', response);
        return response;
      } catch (err) {
        console.error('[useVideoStatus] ❌ Polling error:', err);
        throw err;
      }
    },
    enabled: enabled && usePolling && !!sessionId,
    refetchInterval: (data) => {
      // Stop polling when video is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Update status from polling data
  useEffect(() => {
    if (!usePolling || !pollingData) return;

    console.log('[useVideoStatus] 📊 Updating from polling data:', pollingData);

    if (pollingData.status) {
      setStatus(pollingData.status);
    }

    if (pollingData.progress !== undefined) {
      setProgress(pollingData.progress);
    }

    if (pollingData.error) {
      setError(pollingData.error);
    }

    // Trigger callbacks based on status
    if (pollingData.status === 'completed' && onComplete) {
      onComplete({ event: 'processing_complete', status: 'completed', data: pollingData } as WebSocketMessage);
    }

    if (pollingData.status === 'failed' && onErrorCallback) {
      onErrorCallback({ event: 'processing_error', status: 'failed', data: { error: pollingData.error } } as WebSocketMessage);
    }

    if (pollingData.status === 'processing' && onProgress) {
      onProgress({ event: 'processing_progress', status: 'processing', data: { progress: pollingData.progress } } as WebSocketMessage);
    }
  }, [pollingData, usePolling, onComplete, onProgress, onErrorCallback]);

  // Handle polling errors
  useEffect(() => {
    if (pollingError) {
      console.error('[useVideoStatus] ❌ Polling error:', pollingError);
      setError('Failed to fetch video status');
    }
  }, [pollingError]);

  console.log('[useVideoStatus] Current state:', {
    status,
    progress,
    error,
    isConnected: ws.isConnected,
    connectionType: usePolling ? 'polling' : 'websocket'
  });

  return {
    ...ws,
    status,
    progress,
    error,
    connectionType: usePolling ? 'polling' : 'websocket' // Expose connection type for debugging
  };
}
