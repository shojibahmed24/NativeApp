import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAaB0O1Dw3TNfgVx2DtJ0HZxypHM2SIXO4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "unicom-d325b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "unicom-d325b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "unicom-d325b.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "872547522493",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:872547522493:web:861a0a0ab282e359f1a4d4",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-W36GZTL4B2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
