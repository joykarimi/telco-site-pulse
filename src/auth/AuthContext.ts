
import { createContext } from 'react';
import { User, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { UserRole } from '../lib/roles';

export interface AuthContextType {
    user: User | null;
    role: UserRole | undefined;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
    signUp: (email: string, pass: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
