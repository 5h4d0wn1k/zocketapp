export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'Todo' | 'In Progress' | 'In Review' | 'Completed';
export type Category = 'Work' | 'Personal' | 'Shopping' | 'Health' | 'Education' | 'Other';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  dueDate?: string;
  aiSuggestion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}