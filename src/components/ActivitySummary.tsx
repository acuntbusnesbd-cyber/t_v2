import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { TaskStats } from '../types';
import { toBengaliNumber } from '../utils/bengaliUtils';

interface ActivitySummaryProps {
  stats: TaskStats;
  onFilterStatus?: (status: string) => void;
  onFilterPriority?: (priority: string) => void;
  onFilterOverdue?: () => void;
}

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  stats,
  onFilterStatus,
  onFilterPriority,
  onFilterOverdue,
}) => {
  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>সামগ্রিক কাজের অগ্রগতি</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-1">
              {toBengaliNumber(stats.completionRate)}% সম্পন্ন
            </div>
            <p className="text-xs text-emerald-100/90 mt-1">
              মোট {toBengaliNumber(stats.total)}টি কাজের মধ্যে {toBengaliNumber(stats.completed)}টি সফলভাবে সম্পন্ন হয়েছে
            </p>
          </div>

          <div className="w-full sm:w-64 bg-black/20 rounded-full h-3 p-0.5 backdrop-blur-xs">
            <div
              className="bg-white rounded-full h-2 transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, stats.completionRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <button
          onClick={() => onFilterStatus?.('all')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-left transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">মোট কাজ</span>
            <ListTodo className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {toBengaliNumber(stats.total)}
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => onFilterStatus?.('completed')}
          className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-medium">সম্পন্ন</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
            {toBengaliNumber(stats.completed)}
          </div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => onFilterStatus?.('in_progress')}
          className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/60 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800 text-left transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
            <span className="text-xs font-medium">চলমান</span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">
            {toBengaliNumber(stats.inProgress)}
          </div>
        </button>

        {/* Pending */}
        <button
          onClick={() => onFilterStatus?.('pending')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-left transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">অসম্পূর্ণ</span>
            <div className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {toBengaliNumber(stats.pending)}
          </div>
        </button>

        {/* High Priority */}
        <button
          onClick={() => onFilterPriority?.('high')}
          className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800 text-left transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-medium">উচ্চ গুরুত্ব</span>
            <Flame className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-rose-800 dark:text-rose-300 mt-1">
            {toBengaliNumber(stats.highPriority)}
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => onFilterOverdue?.()}
          className={`p-3.5 rounded-xl border text-left transition shadow-xs group ${
            stats.overdue > 0
              ? 'border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">সময় পার হয়েছে</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                stats.overdue > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              stats.overdue > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-800 dark:text-white'
            }`}
          >
            {toBengaliNumber(stats.overdue)}
          </div>
        </button>
      </div>
    </div>
  );
};
