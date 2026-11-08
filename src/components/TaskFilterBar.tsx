import React from 'react';
import { Search, Plus, Filter, ArrowUpDown, X } from 'lucide-react';
import { Priority, TaskStatus } from '../types';

export type SortOption = 'newest' | 'oldest' | 'dueDate' | 'priority';

interface TaskFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TaskStatus | 'all';
  onStatusFilterChange: (status: TaskStatus | 'all') => void;
  priorityFilter: Priority | 'all';
  onPriorityFilterChange: (priority: Priority | 'all') => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  onOpenNewTask: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortByChange,
  onOpenNewTask,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
      {/* Top row: Search and New Task button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="কাজের শিরোনাম বা বিবরণ খুঁজুন..."
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Task Action */}
        <button
          onClick={onOpenNewTask}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md shadow-emerald-600/25 transition active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>নতুন কাজ যোগ করুন</span>
        </button>
      </div>

      {/* Bottom row: Filters and Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            সব কাজ
          </button>
          <button
            onClick={() => onStatusFilterChange('pending')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            অসম্পূর্ণ
          </button>
          <button
            onClick={() => onStatusFilterChange('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            চলমান
          </button>
          <button
            onClick={() => onStatusFilterChange('completed')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            সম্পন্ন
          </button>
        </div>

        {/* Priority & Sorting Selectors */}
        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as Priority | 'all')}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">সকল গুরুত্ব</option>
              <option value="high">উচ্চ গুরুত্ব</option>
              <option value="medium">মাঝারি গুরুত্ব</option>
              <option value="low">কম গুরুত্ব</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="newest">সর্বশেষ তৈরি</option>
              <option value="oldest">প্রথমে তৈরি</option>
              <option value="dueDate">শেষ সময় অনুযায়ী</option>
              <option value="priority">গুরুত্ব অনুযায়ী</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
