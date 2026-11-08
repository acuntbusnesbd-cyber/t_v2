import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  CheckSquare,
  Moon,
  Sun,
  Bell,
  BellOff,
  LogOut,
  HelpCircle,
  Wifi,
  WifiOff,
  User as UserIcon,
} from 'lucide-react';
import { logoutUser } from '../firebase';
import { requestNotificationPermission } from '../utils/bengaliUtils';

interface NavbarProps {
  user: User | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHelp: () => void;
  onOpenNewTask: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onOpenHelp,
  onOpenNewTask,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                কাজকর্ম
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                বাংলা
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              সুরক্ষিত ও স্মার্ট টাস্ক ম্যানেজার
            </p>
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Online / Offline status */}
          <div
            title={isOnline ? 'ইন্টারনেট সংযুক্ত রয়েছে' : 'অফলাইন মোড সক্রিয়'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">অনলাইন</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">অফলাইন</span>
              </>
            )}
          </div>

          {/* Notification Permission button */}
          {typeof Notification !== 'undefined' && notifPermission !== 'granted' && (
            <button
              onClick={handleRequestNotif}
              title="পুশ নোটিফিকেশন অন করুন"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              <span className="hidden sm:inline">নোটিফিকেশন চালু করুন</span>
            </button>
          )}

          {/* Help & Setup Guide */}
          <button
            onClick={onOpenHelp}
            title="সেটআপ ও সিস্টেম নির্দেশিকা"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'লাইট মোড করুন' : 'ডার্ক মোড করুন'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* User profile / Logout */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                    {user.displayName ? user.displayName.slice(0, 1).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {user.displayName || 'ব্যবহারকারী'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {user.email || user.phoneNumber || 'সক্রিয় অ্যাকাউন্ট'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="লগআউট"
                className="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
