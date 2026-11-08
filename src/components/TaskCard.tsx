import React from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Task, TaskStatus } from '../types';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatBengaliDateTime,
  getTimeRemainingBengali,
  playChime,
} from '../utils/bengaliUtils';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const deadlineInfo = getTimeRemainingBengali(task.dueDate);
  const isCompleted = task.status === 'completed' || !!task.isCompleted;

  const handleCheckboxClick = () => {
    const nextCompleted = !isCompleted;
    if (nextCompleted) {
      playChime('success');
      // Fire subtle celebratory confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } else {
      playChime('pop');
    }
    onToggleComplete(task.id, nextCompleted);
  };

  const handleNextStatus = () => {
    playChime('pop');
    let nextStatus: TaskStatus = 'pending';
    if (task.status === 'pending') nextStatus = 'in_progress';
    else if (task.status === 'in_progress') {
      nextStatus = 'completed';
      playChime('success');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } else {
      nextStatus = 'pending';
    }
    onUpdateStatus(task.id, nextStatus);
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 ${
        isCompleted
          ? 'border-emerald-200/80 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10'
          : deadlineInfo.isOverdue
          ? 'border-rose-200 dark:border-rose-900/60 shadow-xs hover:border-rose-300'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Header: Checkbox, Title & Actions */}
        <div className="flex items-start gap-3">
          {/* Quick complete checkbox */}
          <button
            onClick={handleCheckboxClick}
            title={isCompleted ? 'অসম্পূর্ণ হিসেবে চিহ্নিত করুন' : 'সম্পন্ন করুন'}
            className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition shrink-0"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-emerald-500" />
            )}
          </button>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-base font-semibold leading-snug break-words transition ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`mt-1.5 text-xs sm:text-sm line-clamp-2 leading-relaxed break-words ${
                  isCompleted
                    ? 'text-slate-400 dark:text-slate-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* Edit / Delete action buttons */}
          <div className="flex items-center space-x-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              title="সম্পাদনা করুন"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              title="মুছে ফেলুন"
              className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer: Priority, Status & Deadline Badges */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
              {priorityInfo.label}
            </span>

            {/* Status Stepper Button */}
            <button
              onClick={handleNextStatus}
              title="পরবর্তী ধাপে নিন"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition hover:opacity-85 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
            >
              <span>{statusInfo.label}</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {/* Due date countdown badge */}
          {task.dueDate && (
            <div
              title={`শেষ সময়: ${formatBengaliDateTime(task.dueDate)}`}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${
                isCompleted
                  ? 'text-slate-400 bg-slate-100 dark:bg-slate-800/60'
                  : deadlineInfo.isOverdue
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-semibold animate-pulse'
                  : deadlineInfo.urgent
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {deadlineInfo.isOverdue && !isCompleted ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isCompleted ? 'সম্পন্ন হয়েছে' : deadlineInfo.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
