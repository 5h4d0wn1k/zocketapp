'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskContextType, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface WebSocketMessage {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED';
  task?: Task;
  taskId?: string;
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetchTasks();
    setupWebSocket();

    return () => {
      ws?.close();
    };
  }, [token]);

  const setupWebSocket = () => {
    const socket = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketMessage;
      handleWebSocketMessage(data);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };

    setWs(socket);
  };

  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'TASK_CREATED':
        if (data.task) {
          setTasks((prev: Task[]) => [...prev, data.task!]);
          toast.success('New task created');
        }
        break;
      case 'TASK_UPDATED':
        if (data.task) {
          setTasks((prev: Task[]) => prev.map((task: Task) => 
            task.id === data.task!.id ? data.task! : task
          ));
          toast.success('Task updated');
        }
        break;
      case 'TASK_DELETED':
        if (data.taskId) {
          setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== data.taskId));
          toast.success('Task deleted');
        }
        break;
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks');
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskInput: CreateTaskInput) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskInput),
      });

      if (!response.ok) throw new Error('Failed to create task');

      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      toast.success('Task created successfully');
    } catch (err) {
      toast.error('Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, taskInput: UpdateTaskInput) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskInput),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      toast.success('Task updated successfully');
    } catch (err) {
      toast.error('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error('Failed to delete task');
      throw err;
    }
  };

  const getAISuggestions = async (taskDescription: string) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: taskDescription }),
      });

      if (!response.ok) throw new Error('Failed to get AI suggestions');

      const { suggestions } = await response.json();
      return suggestions;
    } catch (err) {
      toast.error('Failed to get AI suggestions');
      throw err;
    }
  };

  return (
    <TaskContext.Provider 
      value={{ 
        tasks, 
        loading, 
        error, 
        createTask, 
        updateTask, 
        deleteTask,
        getAISuggestions
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
} 