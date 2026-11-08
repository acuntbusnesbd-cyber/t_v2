import React, { useState } from 'react';
import {
  CheckSquare,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
} from '../firebase';
import { playChime } from '../utils/bengaliUtils';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError('অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'register') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
        playChime('success');
        setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম।');
      } else {
        await signInWithEmail(email.trim(), password);
        playChime('success');
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err.code || err.message;
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError('ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } else if (code.includes('email-already-in-use')) {
        setError('এই ইমেইলটি দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে। লগইন করুন।');
      } else if (code.includes('invalid-email')) {
        setError('সঠিক ইমেইল ঠিকানা প্রদান করুন।');
      } else if (code.includes('weak-password')) {
        setError('পাসওয়ার্ড খুবই দুর্বল। আরও শক্তিশালী পাসওয়ার্ড দিন।');
      } else {
        setError('অনুরোধ ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট ও তথ্য যাচাই করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      setLoading(true);
      await signInWithGoogle();
      playChime('success');
      onSuccess?.();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google সাইন-ইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('পাসওয়ার্ড রিসেটের জন্য আপনার নিবন্ধিত ইমেইল লিখুন।');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email.trim());
      setSuccessMsg('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
      setShowForgot(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে। ইমেইল যাচাই করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 shadow-xl shadow-emerald-500/20 text-white mb-3">
            <CheckSquare className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            কাজকর্মে স্বাগতম
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            আপনার দৈনন্দিন কাজগুলো সাজিয়ে রাখুন সহজে, নিরাপদে ও বাংলায়।
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              লগইন (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              নতুন অ্যাকাউন্ট (Register)
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 shadow-xs mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google দিয়ে এক-ক্লিকে সাইন ইন করুন</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                অথবা ইমেইল ব্যবহার করুন
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  আপনার নাম (পূর্ণ নাম)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="যেমন: অনিক মাহমুদ"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ইমেইল ঠিকানা (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  পাসওয়ার্ড (Password)
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬টি অক্ষর"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading
                ? 'অনুরোধ সম্পন্ন হচ্ছে...'
                : mode === 'register'
                ? 'অ্যাকাউন্ট তৈরি করুন'
                : 'লগইন করুন'}
            </button>
          </form>

          {/* Forgot Password Modal */}
          {showForgot && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 animate-in fade-in">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                পাসওয়ার্ড পুনরায় নির্ধারণ করুন
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                আপনার ইমেইল ঠিকানা দিলে একটি রিসেট লিংক পাঠানো হবে।
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition"
                >
                  রিসেট লিংক পাঠান
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>ফায়ারবেস এনক্রিপশন ও অথেনটিকেশন দ্বারা শতভাগ সুরক্ষিত</span>
        </div>
      </div>
    </div>
  );
};
