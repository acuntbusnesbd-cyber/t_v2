import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  testConnection,
  subscribeToUserTasks,
  createTask,
  updateTask,
  deleteTask,
} from './firebase';
import { Task, TaskStats, Priority, TaskStatus } from './types';
import { Navbar } from './components/Navbar';
import { ActivitySummary } from './components/ActivitySummary';
import { TaskFilterBar, SortOption } from './components/TaskFilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { AuthView } from './components/AuthView';
import { SetupGuideModal } from './components/SetupGuideModal';
import {
  toBengaliNumber,
  sendBrowserNotification,
  playChime,
} from './utils/bengaliUtils';
import {
  Plus,
  Inbox,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('kajkormo_theme') === 'dark' ||
      (!localStorage.getItem('kajkormo_theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Modals & UI States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  // Notification tracking to avoid duplicate alerts in a single session
  const notifiedTaskIds = useRef<Set<string>>(new Set());

  // Dark mode class sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kajkormo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kajkormo_theme', 'light');
    }
  }, [darkMode]);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Task subscription
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    const unsubscribe = subscribeToUserTasks(
      currentUser.uid,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setTasksLoading(false);

        // Check for urgent upcoming deadlines
        const now = Date.now();
        fetchedTasks.forEach((t) => {
          if (t.dueDate && t.status !== 'completed' && !notifiedTaskIds.current.has(t.id)) {
            const dueTime = new Date(t.dueDate).getTime();
            const diffMin = (dueTime - now) / (1000 * 60);

            // Notify if due in less than 60 minutes or newly overdue
            if (diffMin <= 60 && diffMin >= -10) {
              notifiedTaskIds.current.add(t.id);
              sendBrowserNotification(`⏰ কাজের শেষ সময় ঘনিয়ে এসেছে!`, {
                body: `"${t.title}" কাজটির সময় শেষ হওয়ার পথে।`,
              });
            }
          }
        });
      },
      (error) => {
        console.error('Subscription error:', error);
        setTasksLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Periodic deadline reminder check (every 2 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!tasks.length) return;
      const now = Date.now();
      tasks.forEach((t) => {
        if (t.dueDate && t.status !== 'completed' && !notifiedTaskIds.current.has(t.id)) {
          const dueTime = new Date(t.dueDate).getTime();
          const diffMin = (dueTime - now) / (1000 * 60);
          if (diffMin <= 30 && diffMin >= 0) {
            notifiedTaskIds.current.add(t.id);
            sendBrowserNotification(`🔔 জরুরি নোটিফিকেশন: ডেডলাইন রিমাইন্ডার`, {
              body: `"${t.title}" কাজটির শেষ সময় আর ৩০ মিনিটের মধ্যে!`,
            });
            playChime('alert');
          }
        }
      });
    }, 120000);

    return () => clearInterval(timer);
  }, [tasks]);

  // Statistics Calculation
  const stats: TaskStats = useMemo(() => {
    const now = Date.now();
    let total = tasks.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let highPriority = 0;
    let overdue = 0;

    tasks.forEach((t) => {
      const isComp = t.status === 'completed' || t.isCompleted;
      if (isComp) {
        completed++;
      } else {
        if (t.status === 'in_progress') inProgress++;
        else pending++;

        if (t.priority === 'high') highPriority++;

        if (t.dueDate) {
          const dueMs = new Date(t.dueDate).getTime();
          if (dueMs < now) overdue++;
        }
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      highPriority,
      overdue,
      completionRate,
    };
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter((t) => {
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title?.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        // Status Filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'completed') {
            if (t.status !== 'completed' && !t.isCompleted) return false;
          } else {
            if (t.status !== statusFilter) return false;
          }
        }

        // Priority Filter
        if (priorityFilter !== 'all') {
          if (t.priority !== priorityFilter) return false;
        }

        // Only Overdue filter
        if (onlyOverdue) {
          if (t.status === 'completed' || t.isCompleted) return false;
          if (!t.dueDate) return false;
          if (new Date(t.dueDate).getTime() >= now) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        }
        if (sortBy === 'oldest') {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeA - timeB;
        }
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'priority') {
          const weight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy, onlyOverdue]);

  // CRUD Handlers
  const handleSaveTask = async (data: {
    title: string;
    description?: string;
    priority: Priority;
    status: TaskStatus;
    dueDate?: string;
    isCompleted?: boolean;
  }) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, data);
    } else {
      await createTask(data);
    }
    setTaskToEdit(null);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, {
      status: newStatus,
      isCompleted: newStatus === 'completed',
    });
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    await updateTask(taskId, {
      isCompleted,
      status: isCompleted ? 'completed' : 'pending',
    });
  };

  const handleDeleteConfirmed = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
      playChime('pop');
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setTaskToDelete(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium">কাজকর্ম লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {!currentUser ? (
          <AuthView />
        ) : (
          <>
            {/* Top Stats Overview */}
            <ActivitySummary
              stats={stats}
              onFilterStatus={(st) => {
                setOnlyOverdue(false);
                setStatusFilter(st as any);
              }}
              onFilterPriority={(pr) => {
                setOnlyOverdue(false);
                setPriorityFilter(pr as any);
              }}
              onFilterOverdue={() => {
                setOnlyOverdue(!onlyOverdue);
                setStatusFilter('all');
              }}
            />

            {/* Overdue Alert Banner if active */}
            {onlyOverdue && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>বর্তমানে শুধুমাত্র নির্ধারিত সময় অতিক্রান্ত কাজগুলো প্রদর্শিত হচ্ছে</span>
                </div>
                <button
                  onClick={() => setOnlyOverdue(false)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-medium hover:bg-rose-300 transition"
                >
                  সব কাজ দেখুন
                </button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <TaskFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={(st) => {
                setOnlyOverdue(false);
                setStatusFilter(st);
              }}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={(pr) => {
                setOnlyOverdue(false);
                setPriorityFilter(pr);
              }}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onOpenNewTask={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
            />

            {/* Tasks Grid or Empty State */}
            {tasksLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                <p className="text-xs text-slate-500">আপনার টাস্ক লোড হচ্ছে...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {tasks.length === 0
                    ? 'কোনো কাজ পাওয়া যায়নি'
                    : 'ফিল্টারের সাথে মেলে এমন কোনো কাজ নেই'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {tasks.length === 0
                    ? 'আপনার প্রথম কাজ যোগ করে আজই পরিকল্পনা সাজান এবং ট্র্যাক করুন।'
                    : 'ফিল্টার রিসেট করে বা অন্য কীওয়ার্ড দিয়ে সন্ধান করে দেখুন।'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  {tasks.length > 0 ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setOnlyOverdue(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      সকল ফিল্টার মুছুন
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setTaskToEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন কাজ যোগ করুন</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>
                    মোট {toBengaliNumber(filteredTasks.length)}টি কাজ প্রদর্শিত হচ্ছে
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleComplete={handleToggleComplete}
                      onEdit={(t) => {
                        setTaskToEdit(t);
                        setIsTaskModalOpen(true);
                      }}
                      onDelete={(id) => setTaskToDelete(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>কাজকর্ম — বাংলা টাস্ক ম্যানেজমেন্ট প্ল্যাটফর্ম • ফায়ারবেস ব্যাকেন্ড দ্বারা চালিত</p>
      </footer>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSave={handleSaveTask}
      />

      <SetupGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              কাজটি মুছে ফেলতে চান?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              একবার মুছে ফেললে এই কাজটি আর পুনরুদ্ধার করা সম্ভব হবে না।
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
