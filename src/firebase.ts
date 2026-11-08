import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  User,
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
  getDoc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Task, UserProfile } from './types';

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 2. Error handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection on Boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or pending connection.');
    }
  }
}

// 4. Authentication API
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  // Initialize user profile in Firestore
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      userId: cred.user.uid,
      displayName: displayName || email.split('@')[0],
      email: cred.user.email || email,
      theme: 'light',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    // Non-fatal, profile can be created on first login
    console.warn('Initial profile doc creation skipped:', e);
  }
  return cred.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  if (cred.user) {
    // Upsert user profile
    try {
      const userRef = doc(db, 'users', cred.user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          userId: cred.user.uid,
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'ব্যবহারকারী',
          email: cred.user.email || '',
          theme: 'light',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Google sign-in user profile sync note:', e);
    }
  }
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// 5. Firestore Task CRUD Operations
export async function createTask(
  task: {
    title: string;
    description?: string;
    priority: Task['priority'];
    status: Task['status'];
    dueDate?: string;
    isCompleted?: boolean;
  }
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('অননুমোদিত অনুরোধ: অনুগ্রহ করে প্রথমে লগইন করুন।');
  }

  // Generate safe ID adhering to ^[a-zA-Z0-9_\-]+$
  const taskId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  const path = `tasks/${taskId}`;

  const payload: Record<string, any> = {
    title: task.title.trim(),
    priority: task.priority,
    status: task.status,
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isCompleted: task.isCompleted ?? (task.status === 'completed'),
  };

  if (task.description && task.description.trim()) {
    payload.description = task.description.trim().slice(0, 2000);
  }
  if (task.dueDate && task.dueDate.trim()) {
    payload.dueDate = task.dueDate.trim();
  }

  try {
    await setDoc(doc(db, 'tasks', taskId), payload);
    return taskId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: Task['priority'];
    status?: Task['status'];
    dueDate?: string;
    isCompleted?: boolean;
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('অননুমোদিত অনুরোধ: অনুগ্রহ করে প্রথমে লগইন করুন।');
  }

  const path = `tasks/${taskId}`;
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.title !== undefined) payload.title = updates.title.trim().slice(0, 200);
  if (updates.description !== undefined) payload.description = updates.description.trim().slice(0, 2000);
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.status !== undefined) {
    payload.status = updates.status;
    payload.isCompleted = updates.status === 'completed';
  }
  if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
  if (updates.isCompleted !== undefined) {
    payload.isCompleted = updates.isCompleted;
    if (updates.status === undefined) {
      payload.status = updates.isCompleted ? 'completed' : 'pending';
    }
  }

  try {
    await updateDoc(doc(db, 'tasks', taskId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('অননুমোদিত অনুরোধ: অনুগ্রহ করে প্রথমে লগইন করুন।');
  }

  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserTasks(
  userId: string,
  onTasksUpdate: (tasks: Task[]) => void,
  onError: (err: any) => void
): () => void {
  const path = 'tasks';
  // Query strictly filtered by current user's uid to satisfy security rules allow list
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tasks.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate,
          userId: data.userId,
          isCompleted: data.isCompleted,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      // Sort in client to prevent missing index requirements on compound queries
      tasks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      onTasksUpdate(tasks);
    },
    (error) => {
      // Critical: Always include error callback
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );

  return unsubscribe;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(
  userId: string,
  updates: { displayName?: string; theme?: 'light' | 'dark' }
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
