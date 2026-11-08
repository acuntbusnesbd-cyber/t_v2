import React, { useState, useEffect } from 'react';
import { X, Calendar, Flame, AlertCircle, Clock, Check } from 'lucide-react';
import { Task, Priority, TaskStatus } from '../types';
import { playChime } from '../utils/bengaliUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  onSave: (taskData: {
    title: string;
    description?: string;
    priority: Priority;
    status: TaskStatus;
    dueDate?: string;
    isCompleted?: boolean;
  }) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'medium');
      setStatus(taskToEdit.status || 'pending');
      setDueDate(taskToEdit.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setDueDate('');
    }
    setError(null);
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('অনুগ্রহ করে কাজের শিরোনাম লিখুন।');
      return;
    }
    if (title.trim().length > 200) {
      setError('শিরোনাম ২০০ অক্ষরের মধ্যে হতে হবে।');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
        isCompleted: status === 'completed',
      });
      playChime('pop');
      onClose();
    } catch (err: any) {
      console.error('Save task error:', err);
      setError('কাজটি সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper quick preset setter
  const setQuickDate = (offsetDays: number, hour: number = 18) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDueDate(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {taskToEdit ? 'কাজ সম্পাদনা করুন' : 'নতুন কাজ যোগ করুন'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            কাজের শিরোনাম, গুরুত্ব এবং শেষ সময় নির্ধারণ করে সংগঠিত থাকুন।
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              কাজের শিরোনাম (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ফায়ারবেস ইন্টিগ্রেশন সম্পন্ন করা"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              বিস্তারিত বিবরণ (Description)
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কাজের বিস্তারিত তথ্য বা করণীয় বিষয়..."
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              গুরুত্ব স্তর (Priority)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  priority === 'high'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>উচ্চ</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  priority === 'medium'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>মাঝারি</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  priority === 'low'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>কম</span>
              </button>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              কাজের বর্তমান অবস্থা (Status)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  status === 'pending'
                    ? 'border-slate-700 bg-slate-900 text-white dark:border-slate-400 dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                অসম্পূর্ণ
              </button>

              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  status === 'in_progress'
                    ? 'border-blue-500 bg-blue-600 text-white font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                চলমান
              </button>

              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  status === 'completed'
                    ? 'border-emerald-500 bg-emerald-600 text-white font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                সম্পন্ন
              </button>
            </div>
          </div>

          {/* Due Date & Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              শেষ সময় / ডেডলাইন (Due Date & Time)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">দ্রুত বাছুন:</span>
              <button
                type="button"
                onClick={() => setQuickDate(0, 18)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition"
              >
                আজ সন্ধ্যা
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1, 12)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition"
              >
                আগামীকাল
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(3, 18)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition"
              >
                ৩ দিন পর
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7, 18)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition"
              >
                ১ সপ্তাহ পর
              </button>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[11px] px-2 py-0.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  মুছে ফেলুন
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : taskToEdit ? 'হালনাগাদ করুন' : 'যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
