export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // ISO string YYYY-MM-DDTHH:mm
  userId: string;
  isCompleted?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  email: string;
  theme?: 'light' | 'dark';
  createdAt: any;
  updatedAt: any;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  highPriority: number;
  overdue: number;
  completionRate: number;
}
