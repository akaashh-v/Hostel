import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RealtimeEvent } from '../types';
import { useToast } from './ToastContext';

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  subscribe: (handler: (event: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [handlers] = useState<Set<(event: RealtimeEvent) => void>>(new Set());
  const { info } = useToast();

  const subscribe = useCallback((handler: (event: RealtimeEvent) => void) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }, [handlers]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          setLastEvent(event);

          if (event.type === 'MENU_UPDATED') {
            info(`Menu Updated: ${event.data.name || 'Daily dishes refreshed'}`);
          } else if (event.type === 'COLLECTION_MARKED') {
            // Handled locally
          }

          handlers.forEach(fn => fn(event));
        } catch {
          // ignore keepalive comments
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [handlers, info]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
};
