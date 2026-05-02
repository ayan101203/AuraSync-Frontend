import { useEffect, useRef, useCallback } from "react";

const WS_BASE = import.meta.env.VITE_WS_URL ?? "ws://localhost:3000";

export function useSessionWebSocket({
  token,
  sessionId,
  onMessage,
  onConnected,
  onDisconnected,
}) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // 1. Function Ref to break the circular dependency
  const connectFnRef = useRef(null);

  // 2. Callback Ref for latest handlers
  const callbacks = useRef({ onMessage, onConnected, onDisconnected });
  useEffect(() => {
    callbacks.current = { onMessage, onConnected, onDisconnected };
  }, [onMessage, onConnected, onDisconnected]);

  // 3. The actual connection logic
  const connect = useCallback(() => {
    if (!token || !sessionId) return;

    // Clear any existing timer so we don't double-connect
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    let isIntentionalClose = false;

    ws.onopen = () => {
      console.log("[WS] Connected");
      callbacks.current.onConnected?.();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        callbacks.current.onMessage?.(msg);
      } catch {
        /* ignore */
      }
    };

    ws.onclose = (evt) => {
      console.log("[WS] Disconnected", evt.code);
      callbacks.current.onDisconnected?.();

      if (!isIntentionalClose) {
        // Use the Ref to call the function to avoid the circular dependency error
        reconnectTimer.current = setTimeout(() => {
          connectFnRef.current?.();
        }, 3000);
      }
    };

    ws.onerror = (err) => console.error("[WS] Error", err);

    ws.customCleanup = () => {
      isIntentionalClose = true;
      ws.close();
    };
  }, [token, sessionId]); // 'connect' is NOT here anymore

  // 4. Update the function ref whenever 'connect' is redefined
  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  // 5. Lifecycle Management
  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.customCleanup();
    };
  }, [connect]);

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  return { send };
}
