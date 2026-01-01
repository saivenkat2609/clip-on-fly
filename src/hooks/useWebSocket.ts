/**
 * React hook for WebSocket connections
 *
 * Manages WebSocket lifecycle and provides status updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoStatusWebSocket, WebSocketMessage, createVideoWebSocket } from '../lib/websocket';

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

  console.log('[useVideoStatus] Initialized:', { sessionId, enabled });

  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('[useVideoStatus] 📥 Message received:', {
      event: data.event,
      status: data.status,
      progress: data.data?.progress,
      fullData: data
    });

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

  const ws = useWebSocket({
    sessionId,
    onMessage: handleMessage,
    enabled
  });

  console.log('[useVideoStatus] Current state:', { status, progress, error, isConnected: ws.isConnected });

  return {
    ...ws,
    status,
    progress,
    error
  };
}
