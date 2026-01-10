
import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Configuration from user request
const firebaseConfig = {
    apiKey: "AIzaSyChD7SyoC3ESkNfiPK3yXYOAekCVnZHkCs",
    authDomain: "kokomart-e1f08.firebaseapp.com",
    projectId: "kokomart-e1f08",
    storageBucket: "kokomart-e1f08.firebasestorage.app",
    messagingSenderId: "692286395880",
    appId: "1:692286395880:web:0e9d51c09b63ed2864005d",
    measurementId: "G-BDQMLF350X"
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
