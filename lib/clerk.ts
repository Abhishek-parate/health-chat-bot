// lib/clerk.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authExports from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Constants from 'expo-constants';

// Extract the needed exports from @clerk/clerk-expo
const { 
  ClerkProvider, 
  useAuth: useClerkAuth, 
  useUser, 
  useSignIn, 
  useSignUp,
  useClerk
} = authExports;

// Get the publishable key from environment variables
const publishableKey = Constants?.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY ||  "pk_test_YmVjb21pbmctY2FpbWFuLTE0LmNsZXJrLmFjY291bnRzLmRldiQ";

// Token cache implementation for Clerk
const tokenCache = {
  async getToken(key) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Types for our auth context
type User = {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  imageUrl?: string;
};

type AuthContextType = {
  isSignedIn: boolean;
  isLoading: boolean;
  user: User | null;
  signIn: (params: { emailAddress: string; password: string }) => Promise<boolean>;
  signUp: (params: { emailAddress: string; password: string; username?: string }) => Promise<any>;
  signOut: () => Promise<void>;
};

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider implementation that uses Clerk hooks
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  
  const { signIn: clerkSignInHelper } = useSignIn();
  const { signUp: clerkSignUpHelper } = useSignUp();
  const clerk = useClerk();
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  // Format user data to match our app's needs
  const formatUser = (user: any): User | null => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      imageUrl: user.imageUrl || '',
    };
  };

  // Sign in with email and password
  const signIn = async ({ emailAddress, password }: { emailAddress: string; password: string }): Promise<boolean> => {
    try {
      // Validate we have the necessary Clerk objects
      if (!clerkSignInHelper) {
        console.error('Clerk sign in helper is not available');
        return false;
      }
      
      // First check if already signed in
      if (isSignedIn) {
        console.log('User is already signed in. Signing out first...');
        await clerkSignOut().catch(err => console.error('Error signing out before sign in:', err));
      }
      
      console.log('Attempting to sign in with:', emailAddress);
      
      // First attempt to create the sign-in
      const signInAttempt = await clerkSignInHelper.create({
        identifier: emailAddress,
        password,
      });

      console.log('Sign in result status:', signInAttempt.status);
      
      if (signInAttempt.status === 'complete') {
        // Check if we have a createdSessionId
        if (signInAttempt.createdSessionId) {
          // Use the clerk object to set active session
          await clerk.setActive({ session: signInAttempt.createdSessionId });
          console.log('Sign in completed successfully');
          return true;
        } else {
          console.error('Sign in completed but no session ID was created');
          return false;
        }
      } else {
        console.log('Sign in process not complete, status:', signInAttempt.status);
        return false;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  };

  // Sign up with email and password
  const signUp = async ({ 
    emailAddress, 
    password,
    username
  }: { 
    emailAddress: string; 
    password: string;
    username?: string;
  }): Promise<any> => {
    try {
      // Validate we have the necessary Clerk objects
      if (!clerkSignUpHelper) {
        console.error('Clerk sign up helper is not available');
        return false;
      }
      
      // Check if already signed in and sign out first
      if (isSignedIn) {
        console.log('User is already signed in. Signing out first...');
        await clerkSignOut().catch(err => console.error('Error signing out before sign up:', err));
      }
      
      console.log('Attempting to sign up with:', { emailAddress, username });
      
      // Create the signup attempt
      let result;
      if (username) {
        result = await clerkSignUpHelper.create({
          emailAddress,
          password,
          username
        });
      } else {
        result = await clerkSignUpHelper.create({
          emailAddress,
          password
        });
      }

      console.log('Sign up result status:', result.status);
      
      // Complete case - user is fully signed up
      if (result.status === 'complete') {
        if (result.createdSessionId) {
          // Use clerk instance to set active session
          await clerk.setActive({ session: result.createdSessionId });
          console.log('Sign up completed successfully');
          return true;
        } else {
          console.error('Sign up completed but no session ID was created');
          return false;
        }
      } 
      
      // Handle verification or missing requirements
      if (result.status === 'missing_requirements') {
        console.log('Missing requirements:', JSON.stringify(result.missingFields, null, 2));
        
        // Check for unverified fields
        if (result.unverifiedFields && result.unverifiedFields.includes('email_address')) {
          console.log('Email verification required');
          
          // Try to prepare verification if available
          try {
            if (clerkSignUpHelper.prepareEmailAddressVerification) {
              const emailAddressId = result.verifications?.emailAddress?.id;
              if (emailAddressId) {
                // Attempt to prepare email verification
                await clerkSignUpHelper.prepareEmailAddressVerification({ 
                  strategy: 'email_code',
                  emailAddressId 
                });
                console.log('Verification email sent');
              }
            } else {
              console.log('prepareEmailAddressVerification method not available');
            }
          } catch (verifyError) {
            console.error('Error preparing verification:', verifyError);
          }
          
          // Return the result for more info
          return result;
        }
      }
      
      // Any other status - not complete
      console.log('Sign up process not complete, status:', result.status);
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Fixed signOut method that doesn't rely on getAllKeys
  const handleSignOut = async (): Promise<void> => {
    try {
      // Define known Clerk token keys that need to be cleared
      const knownClerkKeys = [
        'clerk-js-session',
        'clerk-frontend-api',
        'clerk-session-id',
        '__clerk_client_jwt',
        'clerk_session_token'
      ];
      
      // Delete all known Clerk-related tokens
      for (const key of knownClerkKeys) {
        await SecureStore.deleteItemAsync(key).catch(err => 
          console.log(`Failed to delete key ${key}: ${err}`)
        );
      }
      
      // Then, call Clerk's signOut to handle session cleanup on the server side
      await clerkSignOut();
      
      console.log('Successfully signed out and cleared token cache');
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Even if there's an error with Clerk's signOut, still try to clear known token keys
      try {
        const knownClerkKeys = [
          'clerk-js-session',
          'clerk-frontend-api',
          'clerk-session-id',
          '__clerk_client_jwt',
          'clerk_session_token'
        ];
        
        for (const key of knownClerkKeys) {
          await SecureStore.deleteItemAsync(key).catch(err => 
            console.log(`Failed to delete key ${key}: ${err}`)
          );
        }
      } catch (e) {
        console.error('Error clearing token cache:', e);
      }
      
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    isSignedIn: !!isSignedIn,
    isLoading,
    user: formatUser(clerkUser),
    signIn,
    signUp,
    signOut: handleSignOut,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

// Clerk provider component
export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(
    ClerkProvider,
    { publishableKey, tokenCache },
    React.createElement(AuthProvider, null, children)
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a ClerkAuthProvider');
  }
  return context;
}

// Export the isAuthenticated function for backward compatibility
export function useIsAuthenticated() {
  const { isSignedIn, isLoading } = useAuth();
  return { isAuthenticated: isSignedIn, isLoading };
}