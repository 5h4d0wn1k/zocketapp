import { create } from 'zustand';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from '@/types/task';
import { tasks } from '@/lib/api';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  currentTask: Task | null;
  filters: TaskFilters;
  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  setFilters: (filters: TaskFilters) => void;
}

export const useTask = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  currentTask: null,
  filters: {},

  setCurrentTask: (task) => set({ currentTask: task }),
  setFilters: (filters) => set({ filters }),

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const fetchedTasks = await tasks.list();
      set({ tasks: fetchedTasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTask: async (input: CreateTaskInput) => {
    try {
      const task = await tasks.create(input);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (id: string, input: UpdateTaskInput) => {
    try {
      const updatedTask = await tasks.update(id, input);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
      }));
      return updatedTask;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      await tasks.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },
})); 