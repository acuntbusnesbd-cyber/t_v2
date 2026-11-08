import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, Terminal, Database, KeyRound, Sparkles } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'rules' | 'config' | 'crud'>('steps');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const securityRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ডিফল্টভাবে সম্পূর্ণ ডেটাবেস সুরক্ষিত (Default Deny)
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    // টাস্ক ভ্যালিডেশন ব্লুপ্রিন্ট
    function isValidTask(data) {
      return data.keys().hasAll(['title', 'priority', 'status', 'userId', 'createdAt', 'updatedAt'])
        && data.keys().hasOnly(['title', 'description', 'priority', 'status', 'dueDate', 'userId', 'createdAt', 'updatedAt', 'isCompleted'])
        && data.userId is string && data.userId == request.auth.uid
        && data.title is string && data.title.size() > 0 && data.title.size() <= 200
        && data.priority in ['low', 'medium', 'high']
        && data.status in ['pending', 'in_progress', 'completed']
        && data.createdAt is timestamp
        && data.updatedAt is timestamp;
    }

    // প্রতি ব্যবহারকারীর টাস্কের সম্পূর্ণ আইসোলেশন
    match /tasks/{taskId} {
      // শুধু নিজের টাস্ক লিস্ট ও কুয়েরি করতে পারবেন
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow get: if isSignedIn() && isValidId(taskId) && resource.data.userId == request.auth.uid;
      
      // নতুন টাস্ক যোগ (userId স্বয়ংক্রিয়ভাবে যাচাইকৃত)
      allow create: if isSignedIn()
        && isValidId(taskId)
        && isValidTask(request.resource.data)
        && request.resource.data.createdAt == request.time
        && request.resource.data.updatedAt == request.time;

      // সম্পাদনা (অন্যের টাস্ক বা userId পরিবর্তন করা অসম্ভব)
      allow update: if isSignedIn()
        && isValidId(taskId)
        && isValidTask(request.resource.data)
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == resource.data.userId
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['title', 'description', 'priority', 'status', 'dueDate', 'isCompleted', 'updatedAt']);

      // ডিলিট
      allow delete: if isSignedIn() && isValidId(taskId) && resource.data.userId == request.auth.uid;
    }
  }
}`;

  const configSnippet = `// firebase-config.js (অথবা src/firebase.ts)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  firestoreDatabaseId: "(default)" // অথবা কাস্টম ডেটাবেস আইডি
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();`;

  const crudSnippet = `// Firestore CRUD Operations with User ID Isolation
import { collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

// ১. নতুন টাস্ক তৈরি (Create)
export async function createTask(task) {
  const user = auth.currentUser;
  if (!user) throw new Error("অনুগ্রহ করে লগইন করুন");
  const taskId = 'task_' + Date.now();
  await setDoc(doc(db, 'tasks', taskId), {
    title: task.title,
    description: task.description || '',
    priority: task.priority, // 'high' | 'medium' | 'low'
    status: task.status,     // 'pending' | 'in_progress' | 'completed'
    dueDate: task.dueDate || null,
    userId: user.uid,        // ইউজার আইডি ম্যাপিং
    isCompleted: task.status === 'completed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return taskId;
}

// ২. রিয়েল-টাইম টাস্ক লিসেনার (Real-time Read with onSnapshot)
export function subscribeToTasks(userId, callback) {
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
}

// ৩. টাস্ক আপডেট (Update)
export async function updateTask(taskId, updates) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

// ৪. টাস্ক ডিলিট (Delete)
export async function deleteTask(taskId) {
  await deleteDoc(doc(db, 'tasks', taskId));
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 sm:p-8 relative my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>প্রকল্প ও স্থাপত্য গাইড</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ফায়ারবেস সেটআপ ও নিরাপত্তা নির্দেশিকা
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            প্রজেক্টের সম্পূর্ণ স্থাপত্য, সিকিউরিটি রুলস ও ব্যবহারের নিয়মাবলী।
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'steps'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ১. রান ও সেটআপ নির্দেশিকা
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ২. Firestore Security Rules
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ৩. Firebase Config
          </button>
          <button
            onClick={() => setActiveTab('crud')}
            className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'crud'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ৪. CRUD & Isolation কোড
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 text-sm space-y-4">
          {activeTab === 'steps' && (
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  সিস্টেম স্ট্যাটাস: ফায়ারবেস স্বয়ংক্রিয়ভাবে প্রোভিশন ও সংযুক্ত
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-400">
                  এই অ্যাপ্লিকেশনে ফায়ারবেস অথেনটিকেশন, ক্লাউড ফায়ারস্টোর ডেটাবেস এবং সিকিউরিটি রুলস ইতিমধ্যেই সরাসরি সক্রিয় করা হয়েছে।
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  ধাপ অনুযায়ী ব্যবহার নির্দেশিকা:
                </h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong className="text-slate-900 dark:text-white">অ্যাকাউন্ট তৈরি বা লগইন:</strong> ইমেইল/পাসওয়ার্ড বা Google সাইন-ইন দিয়ে সরাসরি লগইন করুন। অননুমোদিত কেউ ড্যাশবোর্ড বা ডেটা দেখতে পারবে না।
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">নতুন কাজ যোগ (Add Task):</strong> "নতুন কাজ যোগ করুন" বাটনে ক্লিক করে কাজের শিরোনাম, বিস্তারিত বিবরণ, গুরুত্বের স্তর (উচ্চ/মাঝারি/কম) এবং ডেডলাইন নির্ধারণ করুন।
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">স্ট্যাটাস রূপান্তর (Status Progression):</strong> এক ক্লিকেই কাজের অবস্থা পরিবর্তন করতে পারবেন: <em>অসম্পূর্ণ ➔ চলমান ➔ সম্পন্ন</em>। সম্পন্ন করলে মিষ্টি অডিও চাইম ও কনফেটি অ্যানিমেশন প্রদর্শিত হয়।
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">রিয়েল-টাইম সিঙ্ক (Real-time Sync):</strong> ফায়ারস্টোরের <code>onSnapshot</code> লিসেনারের মাধ্যমে যে কোনো ডিভাইস থেকে মুহূর্তের মধ্যে লাইভ সিঙ্ক হয়।
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">নোটিফিকেশন ও ডেডলাইন রিমাইন্ডার:</strong> হেডারের "নোটিফিকেশন চালু করুন" বাটনে ক্লিক করে ব্রাউজার পুশ নোটিফিকেশন অনুমোদন দিন। ডেডলাইন পার হলে বা ঘনিয়ে আসলে ভিজ্যুয়াল এলার্ট ও রিমাইন্ডার পাবেন।
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">অফলাইন সাপোর্ট (Offline Persistence):</strong> সংযোগ বিচ্ছিন্ন হলেও অ্যাপটিতে কাজ করা যায় এবং ইন্টারনেট ফিরলেই ক্লাউডে সিঙ্ক হয়ে যায়।
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  নিচের রুলস ফাইলটি <code>firestore.rules</code> এ স্বয়ংক্রিয়ভাবে ডিপ্লয় করা হয়েছে:
                </p>
                <button
                  onClick={() => handleCopy(securityRulesSnippet, 'rules')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  {copiedKey === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'rules' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                <code>{securityRulesSnippet}</code>
              </pre>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ফায়ারবেস ইনিশিয়ালাইজেশন স্ক্রিপ্ট (firebase-config.js):
                </p>
                <button
                  onClick={() => handleCopy(configSnippet, 'config')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  {copiedKey === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'config' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                <code>{configSnippet}</code>
              </pre>
            </div>
          )}

          {activeTab === 'crud' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ইউজার আইডি ম্যাপিং সহ CRUD অপারেশনের স্ক্রিপ্ট:
                </p>
                <button
                  onClick={() => handleCopy(crudSnippet, 'crud')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  {copiedKey === 'crud' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'crud' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                <code>{crudSnippet}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
