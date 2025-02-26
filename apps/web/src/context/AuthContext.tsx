"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSignIn, useSignUp, useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Define the AuthContext type
interface AuthContextType {
  user: any;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the AuthContext with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// Hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap the app with
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, user } = useUser();
  const isLoading = !isLoaded;
  const { signOut: clerkSignOut } = useClerk();
  const { signIn: clerkSignIn } = useSignIn();
  const { signUp: clerkSignUp } = useSignUp();
  const router = useRouter();

  // Function to sign in with Clerk
  async function handleSignIn(email: string, password: string) {
    try {
      if (!clerkSignIn) return;
      await clerkSignIn.create({
        identifier: email,
        password,
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Function to sign up with Clerk
  async function handleSignUp(email: string, password: string) {
    try {
      if (!clerkSignUp) return;
      await clerkSignUp.create({
        emailAddress: email,
        password,
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  // Function to sign out with Clerk
  async function handleSignOut() {
    try {
      await clerkSignOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // The value provided to the context
  const value = {
    user,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 