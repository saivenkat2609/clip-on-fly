/**
 * WebSocket client for real-time video processing updates
 *
 * Replaces polling with WebSocket connections for instant status updates.
 * Includes automatic reconnection and heartbeat monitoring.
 *
 * HIGH PRIORITY FIX #21: Removed excessive logging in production
 * - Logs now only appear in development mode (import.meta.env.DEV)
 * - Reduces exposure of WebSocket URLs, session IDs, and system internals
 * - Error logs (console.error/warn) remain for debugging issues
 */

// HIGH PRIORITY FIX #21: Only log in development mode
const DEBUG = import.meta.env.DEV;

export interface WebSocketMessage {
  event: string;
  session_id: string;
  status: string;
  data?: any;
}

export interface WebSocketOptions {
  url: string;
  onMessage: (data: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export class VideoStatusWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private url: string;
  private onMessage: (data: WebSocketMessage) => void;
  private onError?: (error: Event) => void;
  private onOpen?: () => void;
  private onClose?: () => void;
  private sessionId: string | null = null;
  private isIntentionallyClosed = false;

  constructor(options: WebSocketOptions) {
    this.url = options.url;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.maxReconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30 seconds
  }

  /**
   * Connect to WebSocket and subscribe to session updates
   */
  connect(sessionId: string): void {
    this.sessionId = sessionId;
    this.isIntentionallyClosed = false;

    try {
      if (DEBUG) console.log(`[WebSocket] Connecting to ${this.url}...`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (DEBUG) console.log('[WebSocket] ✅ Connected successfully!');
        if (DEBUG) console.log('[WebSocket] Session ID:', this.sessionId);
        this.reconnectAttempts = 0;

        // Subscribe to session updates
        if (this.sessionId) {
          if (DEBUG) console.log('[WebSocket] 📤 Sending subscribe message for session:', this.sessionId);
          this.send({
            action: 'subscribe',
            session_id: this.sessionId,
            user_id: 'web-user'  // Add user_id for backend compatibility
          });
        } else {
          console.warn('[WebSocket] ⚠️ No session ID to subscribe to!');
        }

        // Start heartbeat
        this.startHeartbeat();

        // Call custom onOpen handler
        if (this.onOpen) {
          this.onOpen();
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        if (DEBUG) console.log('[WebSocket] 📥 Raw message received:', event.data);

        try {
          const data = JSON.parse(event.data);
          if (DEBUG) console.log('[WebSocket] 📦 Parsed message:', {
            event: data.event,
            session_id: data.session_id,
            status: data.status,
            data: data.data,
            timestamp: new Date().toISOString()
          });
          this.onMessage(data);
        } catch (error) {
          console.error('[WebSocket] ❌ Error parsing message:', error);
          console.error('[WebSocket] Raw data was:', event.data);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('[WebSocket] Error:', error);

        if (this.onError) {
          this.onError(error);
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        if (DEBUG) console.log(`[WebSocket] Closed (code: ${event.code}, reason: ${event.reason})`);

        // Stop heartbeat
        this.stopHeartbeat();

        // Call custom onClose handler
        if (this.onClose) {
          this.onClose();
        }

        // Attempt reconnection if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Send message to WebSocket server
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      if (DEBUG) console.log('[WebSocket] Message sent:', data);
    } else {
      console.warn('[WebSocket] Cannot send message, connection not open');
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ action: 'ping' });
      }
    }, this.heartbeatInterval);

    if (DEBUG) console.log(`[WebSocket] Heartbeat started (${this.heartbeatInterval}ms)`);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      if (DEBUG) console.log('[WebSocket] Heartbeat stopped');
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WebSocket] Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    if (DEBUG) console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.sessionId && !this.isIntentionallyClosed) {
        this.connect(this.sessionId);
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (DEBUG) console.log('[WebSocket] Disconnecting...');
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.sessionId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Get connection state
   */
  getState(): string {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Create WebSocket client with default configuration
 */
export function createVideoWebSocket(
  onMessage: (data: WebSocketMessage) => void,
  onError?: (error: Event) => void
): VideoStatusWebSocket {
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'wss://your-websocket-id.execute-api.us-east-1.amazonaws.com/prod';

  if (DEBUG) console.log('[createVideoWebSocket] Initializing WebSocket:', {
    url: wsUrl,
    isDefault: !import.meta.env.VITE_WEBSOCKET_URL,
    envVarSet: !!import.meta.env.VITE_WEBSOCKET_URL
  });

  if (!import.meta.env.VITE_WEBSOCKET_URL) {
    console.warn('[createVideoWebSocket] ⚠️ VITE_WEBSOCKET_URL not set! Using default URL. WebSocket may not work!');
  }

  return new VideoStatusWebSocket({
    url: wsUrl,
    onMessage,
    onError,
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000
  });
}
