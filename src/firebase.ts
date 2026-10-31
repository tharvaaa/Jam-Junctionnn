/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with firestoreDatabaseId as specified in Firebase guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Specification as required by Firebase skill
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
      return false;
    }
    // Normal non-offline error (e.g. document not found) still indicates server reachability
    return true;
  }
}

// Authentication Helpers
export const ADMIN_EMAIL = "narkhedeatharva2106@gmail.com";
export const ADMIN_REQUIRED_PASSWORD = "22031978";

export async function loginAdmin(email: string, password: string): Promise<User> {
  // 1. Validate Admin Master Security Password
  if (password !== ADMIN_REQUIRED_PASSWORD) {
    throw new Error("Access Denied: Invalid admin security key. Unauthorized credentials.");
  }

  // 2. Perform Firebase Authentication
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err: unknown) {
    const firebaseError = err as { code?: string; message?: string };
    // If account does not exist yet on this newly provisioned project, create it for the admin
    if (
      firebaseError.code === "auth/user-not-found" ||
      firebaseError.code === "auth/invalid-credential"
    ) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email, password);
        return newCred.user;
      } catch (createErr: unknown) {
        // If it was actually in use, retry sign-in
        const createFirebaseError = createErr as { code?: string; message?: string };
        if (createFirebaseError.code === "auth/email-already-in-use") {
          const retryCred = await signInWithEmailAndPassword(auth, email, password);
          return retryCred.user;
        }
        throw createErr;
      }
    }
    throw err;
  }
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export { 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
};
