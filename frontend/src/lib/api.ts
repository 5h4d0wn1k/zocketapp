import { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { CreateTaskInput, Task, TaskComment, UpdateTaskInput } from '@/types/task';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_URL}${endpoint}`;
  console.log(`Making request to: ${url}`, {
    method: options.method || 'GET',
    headers,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(
        data?.error || `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API
export const auth = {
  register: (data: RegisterCredentials) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: async (data: LoginCredentials) => {
    console.log('Sending login request with:', { email: data.email });
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Tasks API
export const tasks = {
  list: () => request<Task[]>('/tasks'),

  create: (data: CreateTaskInput) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) => request<Task>(`/tasks/${id}`),

  update: (id: string, data: UpdateTaskInput) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  addComment: (taskId: string, content: string) =>
    request<TaskComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// AI API
export const ai = {
  analyze: (title: string, description: string) =>
    request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  getSuggestions: (description: string) =>
    request<string[]>('/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),
};