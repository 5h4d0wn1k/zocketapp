import { useEffect } from 'react';
import { useTask } from '@/hooks/useTask';
import { Task, TaskStatus } from '@/types/task';

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
};

export function TaskList() {
  const { tasks, isLoading, fetchTasks } = useTask();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const { setCurrentTask } = useTask();

  return (
    <li
      className="block hover:bg-gray-50 cursor-pointer"
      onClick={() => setCurrentTask(task)}
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <div className="flex text-sm">
              <p className="font-medium text-indigo-600 truncate">{task.title}</p>
              <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                in {task.status}
              </p>
            </div>
            <div className="mt-2 flex">
              <div className="flex items-center text-sm text-gray-500">
                <p>{task.description}</p>
              </div>
            </div>
          </div>
          <div className="ml-2 flex flex-shrink-0">
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                statusColors[task.status]
              }`}
            >
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
} 