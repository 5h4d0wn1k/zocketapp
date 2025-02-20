import { Database } from './supabase';

export type DbTask = Database['public']['Tables']['tasks']['Row'];
export type DbTaskComment = Database['public']['Tables']['task_comments']['Row'];

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface TaskWithDetails extends DbTask {
  assignee?: User;
  creator?: User;
  comments?: DbTaskComment[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  ai_suggestions?: any;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
} 