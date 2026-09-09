import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// These will be undefined until the user creates a .env.local file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase only if config is provided
let app, auth, db, rtdb;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Initialize Realtime Database for Multiplayer sync
    rtdb = getDatabase(app);
  } else {
    console.warn("Firebase config is missing. Authentication is currently running in MOCK mode.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

// Export a mock Auth service if Firebase isn't configured yet
export const mockAuthService = {
  login: async (email, _password) => {
    return new Promise((resolve) => setTimeout(() => resolve({ user: { email } }), 1000));
  },
  signup: async (email, _password) => {
    return new Promise((resolve) => setTimeout(() => resolve({ user: { email } }), 1000));
  }
};

export { auth, db, rtdb, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
