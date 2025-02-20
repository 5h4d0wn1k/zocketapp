'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../hooks/lib/supabase/client';
import { TaskWithDetails, DbTaskComment } from '../../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';

export default function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [comments, setComments] = useState<DbTaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            assignee:assigned_to(id, email, full_name, avatar_url),
            creator:created_by(id, email, full_name, avatar_url),
            comments(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setTask(data);
        setComments(data.comments || []);
      } catch (error) {
        console.error('Error fetching task:', error);
        toast.error('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();

    // Set up real-time subscription for comments
    const subscription = supabase
      .channel(`task_${id}_comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments((prev) => [...prev, payload.new as DbTaskComment]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: id,
          user_id: user!.id,
          content: newComment.trim(),
        });

      if (error) throw error;
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Task not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <p className="mt-2 text-gray-600">{task.description}</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{task.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <p className="font-medium">{task.priority}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created by</p>
              <p className="font-medium">{task.creator?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assigned to</p>
              <p className="font-medium">{task.assignee?.email || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
          
          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-900">{comment.content}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Comment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 