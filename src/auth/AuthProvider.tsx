import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, User, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';

type Role = 'admin' | 'operations_manager' | 'maintenance_manager' | 'viewer' | undefined;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [role, setRole] = useState<Role>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const idTokenResult = await getIdTokenResult(currentUser, true); // Force refresh of the token
          const userRole = idTokenResult.claims.role as Role;
          setUser(currentUser);
          setRole(userRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          // If we can't get the role, treat the user as unauthenticated
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
    // onAuthStateChanged will handle the rest
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = { user, role, loading, login, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
