import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string) => Promise<void>;
    logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const adminDocRef = doc(db, "admins", currentUser.uid);
                    const adminDoc = await getDoc(adminDocRef);
                    if (adminDoc.exists()) {
                        setIsAdmin(true);
                    } else {
                        console.warn("User is not an admin, signing out.");
                        setIsAdmin(false);
                        await firebaseSignOut(auth);
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    setIsAdmin(false);
                    await firebaseSignOut(auth);
                    setUser(null);
                }
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, pass: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const adminDocRef = doc(db, "admins", userCredential.user.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists()) {
            await firebaseSignOut(auth);
            throw new Error("Unauthorized: Account is not an admin.");
        }
    };

    const signUp = async (email: string, pass: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const uid = userCredential.user.uid;
        await setDoc(doc(db, "admins", uid), {
            email,
            role: "admin",
            createdAt: serverTimestamp()
        });
    };

    const logOut = () => {
        return firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, logOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
