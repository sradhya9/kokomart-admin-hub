
import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Configuration from user request
const firebaseConfig = {
    apiKey: "AIzaSyCtqSTywhBqxfYQx7MmqMlGiSv-On3MGBk",
    authDomain: "meatup-f8c49.firebaseapp.com",
    projectId: "meatup-f8c49",
    storageBucket: "meatup-f8c49.firebasestorage.app",
    messagingSenderId: "270170795022",
    appId: "1:270170795022:web:09f1eb597a81c69f22205f"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize Auth
// Note: The user provided snippet had React Native persistence. 
// Since this is a web admin dashboard (Vite/React), we typically use browser session/local persistence which is default for getAuth().
// I will just use getAuth(app) for now as standard web usage. 
// If specific persistence is needed later, we can add it.
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);
