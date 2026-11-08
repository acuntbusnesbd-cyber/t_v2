import { Priority, TaskStatus } from '../types';

const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w] || w);
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  high: {
    label: 'উচ্চ গুরুত্ব',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
    dot: 'bg-rose-500',
  },
  medium: {
    label: 'মাঝারি গুরুত্ব',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'কম গুরুত্ব',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  pending: {
    label: 'অসম্পূর্ণ',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    step: 1,
  },
  in_progress: {
    label: 'চলমান',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/60',
    step: 2,
  },
  completed: {
    label: 'সম্পন্ন',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    step: 3,
  },
};

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function formatBengaliDateTime(isoString?: string): string {
  if (!isoString) return 'নির্ধারিত নেই';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'অকার্যকর তারিখ';

  const day = toBengaliNumber(date.getDate());
  const month = BENGALI_MONTHS[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'বিকাল/রাত' : 'সকাল/দুপুর';
  const hours12 = hours % 12 || 12;
  const timeFormatted = `${toBengaliNumber(hours12)}:${minutes < 10 ? '০' : ''}${toBengaliNumber(minutes)}`;

  return `${day} ${month} ${year}, ${ampm} ${timeFormatted}`;
}

export function getTimeRemainingBengali(isoString?: string): {
  isOverdue: boolean;
  isDueToday: boolean;
  urgent: boolean;
  text: string;
} {
  if (!isoString) {
    return { isOverdue: false, isDueToday: false, urgent: false, text: 'নির্দিষ্ট সময় নেই' };
  }

  const target = new Date(isoString).getTime();
  if (isNaN(target)) {
    return { isOverdue: false, isDueToday: false, urgent: false, text: 'তারিখ সঠিক নয়' };
  }

  const now = Date.now();
  const diffMs = target - now;
  const isOverdue = diffMs < 0;

  const targetDate = new Date(isoString);
  const nowDate = new Date();
  const isDueToday =
    targetDate.getFullYear() === nowDate.getFullYear() &&
    targetDate.getMonth() === nowDate.getMonth() &&
    targetDate.getDate() === nowDate.getDate();

  const absDiff = Math.abs(diffMs);
  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (isOverdue) {
    if (days > 0) {
      return {
        isOverdue: true,
        isDueToday,
        urgent: true,
        text: `${toBengaliNumber(days)} দিন সময় পার হয়েছে`,
      };
    }
    if (hours > 0) {
      return {
        isOverdue: true,
        isDueToday,
        urgent: true,
        text: `${toBengaliNumber(hours)} ঘণ্টা সময় পার হয়েছে`,
      };
    }
    return {
      isOverdue: true,
      isDueToday,
      urgent: true,
      text: `${toBengaliNumber(Math.max(1, minutes))} মিনিট সময় পার হয়েছে`,
    };
  }

  // Pending
  if (days > 0) {
    return {
      isOverdue: false,
      isDueToday,
      urgent: days <= 1,
      text: `${toBengaliNumber(days)} দিন বাকি`,
    };
  }
  if (hours > 0) {
    return {
      isOverdue: false,
      isDueToday,
      urgent: true,
      text: `${toBengaliNumber(hours)} ঘণ্টা বাকি`,
    };
  }
  return {
    isOverdue: false,
    isDueToday,
    urgent: true,
    text: `${toBengaliNumber(Math.max(1, minutes))} মিনিট বাকি`,
  };
}

// Audio Synthesizer using Web Audio API
export function playChime(type: 'success' | 'alert' | 'pop' = 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Pleasant two-tone completion chime
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(392.0, now + 0.2); // G4

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else if (type === 'alert') {
      // Attention alert
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      osc.frequency.setValueAtTime(440, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Soft click/pop
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Ignore audio permission or context restrictions
  }
}

// Browser notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, {
      icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
      ...options,
    });
  } catch {
    // fallback gracefully
  }
}
