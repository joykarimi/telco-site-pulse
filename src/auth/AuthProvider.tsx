
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
import { UserRole, hasPermission as checkPermission } from '../lib/roles';

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
                    setLoading(false); // Set loading to false on success
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUser(null);
                    setRole(undefined);
                    await firebaseSignOut(auth);
                    setLoading(false); // Set loading to false on error
                }
            } else {
                setUser(null);
                setRole(undefined);
                setLoading(false); // Set loading to false when no user
            }
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    }, []);

    const signUp = useCallback(async (email: string, pass: string, fullName: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: fullName });
    }, []);

    const signOut = useCallback(async () => {
        await firebaseSignOut(auth);
    }, []);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!role) {
            return false;
        }
        return checkPermission(role, permission);
    }, [role]);

    const value = useMemo(() => ({
        user,
        role,
        loading,
        login,
        signUp,
        signOut,
        hasPermission
    }), [user, role, loading, login, signUp, signOut, hasPermission]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
