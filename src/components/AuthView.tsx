import React, { useState, useEffect } from 'react';
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
  Phone,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { ConfirmationResult } from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
  setupRecaptcha,
  sendOtpToPhone,
  verifyOtpCode,
} from '../firebase';
import { playChime, toBengaliNumber } from '../utils/bengaliUtils';

interface AuthViewProps {
  onSuccess?: () => void;
}

type AuthMethod = 'phone' | 'email';

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [method, setMethod] = useState<AuthMethod>('phone');
  
  // Email mode: login or register
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailDisplayName, setEmailDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Phone auth states
  const [countryCode, setCountryCode] = useState('+880');
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [phoneDisplayName, setPhoneDisplayName] = useState('');
  const [phoneStep, setPhoneStep] = useState<'enter_phone' | 'enter_otp'>('enter_phone');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPhoneHelp, setShowPhoneHelp] = useState(false);

  // Clean recaptcha when unmounting or switching steps
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {
          // ignore
        }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  // Format phone number to international E.164
  const formatPhoneNumber = (code: string, raw: string): string => {
    let clean = raw.replace(/[^0-9+]/g, '');
    if (clean.startsWith('+')) {
      return clean;
    }
    // If entered Bangladeshi number like 017... with +880
    if (code === '+880' && clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    return `${code}${clean}`;
  };

  // 1. Phone Auth - Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullPhone = formatPhoneNumber(countryCode, rawPhoneNumber.trim());
    if (fullPhone.length < 9) {
      setError('অনুগ্রহ করে সঠিক মোবাইল নম্বর লিখুন।');
      return;
    }

    try {
      setLoading(true);
      const verifier = setupRecaptcha('recaptcha-container');
      const confirmation = await sendOtpToPhone(fullPhone, verifier);
      setConfirmationResult(confirmation);
      setPhoneStep('enter_otp');
      playChime('pop');
      setSuccessMsg(`${fullPhone} নম্বরে ৬ সংখ্যার ওটিপি (OTP) পাঠানো হয়েছে।`);
    } catch (err: any) {
      console.error('Phone OTP send error:', err);
      const msg = err.message || '';
      if (msg.includes('billing-not-enabled')) {
        setError('ফায়ারবেসে এসএমএস কোটা বা বিলিং সক্রিয় নয়। অনুগ্রহ করে ফায়ারবেস কনসোলে টেস্ট নম্বর ব্যবহার করুন।');
      } else if (msg.includes('invalid-phone-number')) {
        setError('মোবাইল নম্বরটি সঠিক ফরম্যাটে নেই। কান্ট্রি কোড সহ যাচাই করুন।');
      } else if (msg.includes('captcha-check-failed') || msg.includes('reCAPTCHA')) {
        setError('reCAPTCHA যাচাইকরণ সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } else if (msg.includes('operation-not-allowed') || msg.includes('admin-restricted-operation')) {
        setError('ফায়ারবেস কনসোলে "Phone" সাইন-ইন প্রোভাইডার এখনও সক্রিয় করা হয়নি। বিস্তারিত নির্দেশিকা দেখতে নিচের তথ্য বাটনে ক্লিক করুন।');
        setShowPhoneHelp(true);
      } else {
        setError('ওটিপি পাঠাতে সমস্যা হয়েছে। নম্বর সঠিক কিনা যাচাই করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone Auth - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setError('ওটিপি সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় ওটিপি পাঠান।');
      return;
    }
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('অনুগ্রহ করে ৬ সংখ্যার ওটিপি কোডটি লিখুন।');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await verifyOtpCode(confirmationResult, otpCode.trim(), phoneDisplayName.trim() || undefined);
      playChime('success');
      onSuccess?.();
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const msg = err.message || '';
      if (msg.includes('invalid-verification-code')) {
        setError('ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোডটি লিখুন।');
      } else if (msg.includes('code-expired')) {
        setError('ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। পুনরায় কোড পাঠান।');
      } else {
        setError('ওটিপি যাচাই করা যায়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Email/Password Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
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
      if (emailMode === 'register') {
        await signUpWithEmail(email.trim(), password, emailDisplayName.trim());
        playChime('success');
        setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম।');
      } else {
        await signInWithEmail(email.trim(), password);
        playChime('success');
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Email Auth error:', err);
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

  // 4. Google Sign-In
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

  // 5. Password Reset
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
      {/* Invisible reCAPTCHA container required for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 shadow-xl shadow-emerald-500/20 text-white mb-3">
            <CheckSquare className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            কাজকর্মে স্বাগতম
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            মোবাইল নম্বর, ইমেইল বা গুগল দিয়ে এক নিমিষেই প্রবেশ করুন।
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          {/* Method Selector Tabs: Phone vs Email */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-5">
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition ${
                method === 'phone'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>মোবাইল নম্বর (Phone)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition ${
                method === 'email'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>ইমেইল ও পাসওয়ার্ড</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: PHONE NUMBER AUTHENTICATION */}
          {method === 'phone' && (
            <div>
              {phoneStep === 'enter_phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      আপনার নাম (ঐচ্ছিক)
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={phoneDisplayName}
                        onChange={(e) => setPhoneDisplayName(e.target.value)}
                        placeholder="যেমন: অনিক মাহমুদ"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition overflow-hidden">
                      {/* Country Code Select */}
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2.5 py-2.5 text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="+880">🇧🇩 +880 (বাংলাদেশ)</option>
                        <option value="+91">🇮🇳 +91 (ভারত)</option>
                        <option value="+1">🇺🇸 +1 (USA)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+971">🇦🇪 +971 (UAE)</option>
                        <option value="+966">🇸🇦 +966 (KSA)</option>
                      </select>

                      {/* Number Input */}
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          required
                          value={rawPhoneNumber}
                          onChange={(e) => setRawPhoneNumber(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full px-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      নম্বরটি দিলে একটি ৬ সংখ্যার ওটিপি (OTP) পাঠানো হবে।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>{loading ? 'ওটিপি পাঠানো হচ্ছে...' : 'ওটিপি (OTP) পাঠান'}</span>
                  </button>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPhoneHelp(!showPhoneHelp)}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-1 mx-auto"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>মোবাইল অথেনটিকেশন ও টেস্ট নম্বর তথ্য</span>
                    </button>
                    {showPhoneHelp && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          ফায়ারবেস মোবাইল লগইন সক্রিয়করণ:
                        </p>
                        <p>
                          ১. ফায়ারবেস কনসোলে <strong>Authentication &gt; Sign-in method</strong> থেকে <strong>Phone</strong> সক্রিয় করুন।
                        </p>
                        <p>
                          ২. ফ্রি টেস্টিংয়ের জন্য <strong>Phone numbers for testing</strong> সেকশনে টেস্ট নম্বর (যেমন <code>+8801700000000</code>) ও ওটিপি (যেমন <code>123456</code>) যোগ করে কোনো এসএমএস চার্জ ছাড়াই তাৎক্ষণিক পরীক্ষা করতে পারেন।
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                /* Step 2: Enter OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      প্রেরিত নম্বর:
                    </p>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 font-mono tracking-wider mt-0.5">
                      {formatPhoneNumber(countryCode, rawPhoneNumber)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">
                      ৬ সংখ্যার ওটিপি কোড লিখুন
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] text-lg font-bold py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? 'যাচাই করা হচ্ছে...' : 'যাচাই করুন ও প্রবেশ করুন'}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('enter_phone');
                        setOtpCode('');
                        setError(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                    >
                      নম্বর পরিবর্তন করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      পুনরায় ওটিপি পাঠান
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL / PASSWORD AUTHENTICATION */}
          {method === 'email' && (
            <div>
              {/* Sub-tabs: Login vs Register */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    emailMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  লগইন (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    emailMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  নতুন অ্যাকাউন্ট (Register)
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {emailMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      আপনার নাম
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={emailDisplayName}
                        onChange={(e) => setEmailDisplayName(e.target.value)}
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
                    {emailMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        পাসওয়ার্ড মনে নেই?
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
                    : emailMode === 'register'
                    ? 'অ্যাকাউন্ট তৈরি করুন'
                    : 'লগইন করুন'}
                </button>
              </form>

              {/* Forgot Password Flow */}
              {showForgot && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    পাসওয়ার্ড রিসেট লিংক পাঠান
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                    আপনার নিবন্ধিত ইমেইল ঠিকানায় রিসেট লিংক পাঠিয়ে দেওয়া হবে।
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
          )}

          {/* Social Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                অথবা সামাজিক মাধ্যমে প্রবেশ করুন
              </span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
