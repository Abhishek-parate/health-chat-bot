// src/contexts/AuthProvider.tsx

import { supabase } from "@/utils/supabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { ActivityIndicator, View, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

// Define user role type
type UserRole = 'user' | 'doctor' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  logout: () => Promise<void>;
};

// Key for storing user role in SecureStore
const USER_ROLE_KEY = 'user_role';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const initialNavDone = useRef(false);

  // Function to get user profile and determine role
  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return 'user'; // Default to user role on error
      }

      // Save role to SecureStore for persistence
      if (data?.role) {
        await SecureStore.setItemAsync(USER_ROLE_KEY, data.role);
        return data.role as UserRole;
      }
      
      return 'user';
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return 'user';
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
        }
        
        setSession(session);
        
        if (session?.user) {
          // First try to get role from SecureStore (fast)
          let role: UserRole = 'user';
          try {
            const storedRole = await SecureStore.getItemAsync(USER_ROLE_KEY);
            if (storedRole && ['user', 'doctor', 'admin'].includes(storedRole)) {
              role = storedRole as UserRole;
              console.log('Retrieved role from storage:', role);
            } else {
              // If no role in storage, fetch from database
              role = await getUserRole(session.user.id);
              console.log('Retrieved role from database:', role);
            }
            
            setUserRole(role);
          } catch (roleError) {
            console.error('Error getting user role:', roleError);
          }
        }
      } catch (e) {
        console.error('Error in session retrieval:', e);
      } finally {
        setIsReady(true);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const role = await getUserRole(session.user.id);
        setUserRole(role);
        
        // Explicit sign-in should navigate
        if (role === 'doctor') {
          // Delay navigation to ensure components are mounted
          setTimeout(() => {
            router.replace('/(doctor)/dashboard');
          }, 800);
        } else {
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 800);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserRole('user');
        SecureStore.deleteItemAsync(USER_ROLE_KEY).catch(console.error);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Logout Failed", error.message);
      } else {
        // Clear role on logout
        setUserRole('user');
        await SecureStore.deleteItemAsync(USER_ROLE_KEY);
      }
    } catch (e) {
      console.error('Error during logout:', e);
    }
  };

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0061FF" />
      </View>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user: session?.user ?? null, 
        isAuthenticated: !!session?.user, 
        userRole,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};