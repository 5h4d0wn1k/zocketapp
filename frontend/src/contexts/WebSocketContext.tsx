'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTask } from '../hooks/useTask';
import { Task } from '../types/task';

interface WebSocketContextType {
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const { fetchTasks } = useTask();
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = React.useState(false);

  useEffect(() => {
    if (!token) {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setConnected(false);
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/tasks?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnected(false);
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'TASK_CREATED':
        case 'TASK_UPDATED':
        case 'TASK_DELETED':
          // Refresh tasks list
          await fetchTasks();
          break;
        case 'TASK_COMMENT_ADDED':
          // If we're viewing the task that got a comment, refresh it
          await fetchTasks();
          break;
        default:
          console.log('Unknown message type:', data);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token, fetchTasks]);

  return (
    <WebSocketContext.Provider value={{ connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 