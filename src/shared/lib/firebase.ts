import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

function readFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  };
}

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseGoogleProvider: GoogleAuthProvider | undefined;

function ensureFirebaseApp(): FirebaseApp {
  const config = readFirebaseConfig();
  if (!config.apiKey) {
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars on Vercel."
    );
  }
  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
  }
  return firebaseApp;
}

/** Lazily initialized — safe during static build when env vars are absent. */
export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(ensureFirebaseApp());
  }
  return firebaseAuth;
}

/** Lazily initialized — safe during static build when env vars are absent. */
export function getGoogleProvider(): GoogleAuthProvider {
  if (!firebaseGoogleProvider) {
    firebaseGoogleProvider = new GoogleAuthProvider();
    firebaseGoogleProvider.setCustomParameters({ prompt: "select_account" });
  }
  return firebaseGoogleProvider;
}
