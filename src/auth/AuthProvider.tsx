
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    getIdTokenResult,
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserRole, hasPermission as checkPermission } from '../lib/roles'; // Renamed for clarity

interface AuthContextType {
    user: User | null;
    role: UserRole | undefined;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Custom hook for checking permissions
export const usePermissions = () => {
    const { hasPermission, role, loading } = useAuth();
    return { hasPermission, role, loading };
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                try {
                    const idTokenResult = await getIdTokenResult(currentUser, true);
                    const userRole = idTokenResult.claims.role as UserRole;
                    setUser(currentUser);
                    setRole(userRole);
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUser(null);
                    setRole(undefined);
                    await firebaseSignOut(auth);
                }
            } else {
                setUser(null);
                setRole(undefined);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string, fullName: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: fullName });
        // After sign-up, you might want to trigger a function to set custom claims (e.g., role)
        // This is usually done from a backend/serverless function for security.
        // For now, onAuthStateChanged will pick up the new user.
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const hasPermission = (permission: string): boolean => {
        if (!role) {
            return false;
        }
        return checkPermission(role, permission);
    };

    const value = { user, role, loading, login, signUp, signOut, hasPermission };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
