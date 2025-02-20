import { Task } from '@/types/task';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, Edit2, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const statusColors = {
  TODO: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{task.title}</h3>
          <div className="flex gap-2">
            <Badge variant="secondary" className={statusColors[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge variant="secondary" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{task.description}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          Assigned to: {task.assigned_to}
        </div>
        <div className="flex gap-2">
          {task.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(task.id, 'COMPLETED')}
            >
              Mark Complete
            </Button>
          )}
          {task.status === 'TODO' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
            >
              Start Progress
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 