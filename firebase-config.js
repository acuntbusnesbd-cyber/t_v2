/**
 * firebase-config.js
 * সম্পূর্ণ ফায়ারবেস ইনিশিয়ালাইজেশন এবং কনফিগারেশন স্ক্রিপ্ট
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ১. ফায়ারবেস কনফিগারেশন অবজেক্ট
export const firebaseConfig = {
  projectId: "gen-lang-client-0819250130",
  appId: "1:988877340093:web:93be87e01679b94f43a6d4",
  apiKey: "AIzaSyCasSqzjb1e3iGbygLzzu3VR-SEGTnPUOs",
  authDomain: "gen-lang-client-0819250130.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-c668a918-8a34-4755-aecd-36a84bbf3fe6",
  storageBucket: "gen-lang-client-0819250130.firebasestorage.app",
  messagingSenderId: "988877340093",
};

// ২. সার্ভিসেস ইনিশিয়ালাইজেশন
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// ৩. প্রমাণীকরণ হ্যান্ডলারসমূহ (Authentication Handlers)
export async function signUpUser(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function logout() {
  return await signOut(auth);
}

export async function resetUserPassword(email) {
  return await sendPasswordResetEmail(auth, email);
}

// ৪. ফায়ারস্টোর CRUD অপারেশনস (User ID Mapping সহ)
export async function createNewTask({ title, description, priority, status, dueDate }) {
  const user = auth.currentUser;
  if (!user) throw new Error("অননুমোদিত: প্রথমে লগইন করুন।");

  const taskId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  await setDoc(doc(db, 'tasks', taskId), {
    title,
    description: description || '',
    priority: priority || 'medium', // 'high' | 'medium' | 'low'
    status: status || 'pending',     // 'pending' | 'in_progress' | 'completed'
    dueDate: dueDate || null,
    userId: user.uid,
    isCompleted: status === 'completed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return taskId;
}

export function subscribeTasks(userId, onUpdate, onError) {
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(tasks);
    },
    onError
  );
}

export async function updateExistingTask(taskId, updates) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function removeTask(taskId) {
  await deleteDoc(doc(db, 'tasks', taskId));
}
