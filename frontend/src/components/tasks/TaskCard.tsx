'use client';

import { TaskWithDetails } from '../../types';
import { useState } from 'react';
import { supabase } from '../../hooks/lib/supabase/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';

interface TaskCardProps {
  task: TaskWithDetails;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (newStatus: TaskWithDetails['status']) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('Task status updated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Link 
          href={`/tasks/${task.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
        >
          {task.title}
        </Link>
        <span className={`px-2 py-1 rounded-full text-sm ${
          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>

      <p className="text-gray-600">{task.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Due: {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
        </div>
        <select
          value={task.status}
          onChange={(e) => updateStatus(e.target.value as TaskWithDetails['status'])}
          disabled={isLoading}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {task.ai_suggestions && (
        <div className="mt-4 bg-indigo-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-indigo-800 mb-2">AI Suggestions</h4>
          <p className="text-sm text-indigo-600">
            {JSON.stringify(task.ai_suggestions)}
          </p>
        </div>
      )}
    </div>
  );
} 