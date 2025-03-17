// components/RouteProtector.tsx

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { router, useSegments, useRootNavigation } from 'expo-router';

interface RouteProtectorProps {
  children: React.ReactNode;
}

/**
 * Determines if a path/segment string is related to the doctor interface
 */
const isDoctorPath = (segments: string[]): boolean => {
  const path = segments.join('/');
  return path.includes('(doctor)');
};

export default function RouteProtector({ children }: RouteProtectorProps) {
  const { userRole, isAuthenticated } = useAuth();
  const segments = useSegments();
  const navigation = useRootNavigation();
  const initialCheckDone = useRef(false);
  
  // Only check after the root navigation is ready
  useEffect(() => {
    if (!isAuthenticated || !segments || segments.length === 0) return;
    if (!navigation?.isReady()) return;
    
    // Prevent multiple redirects
    if (initialCheckDone.current) return;
    
    const timer = setTimeout(() => {
      // Only check when root navigation is ready
      if (!navigation?.isReady()) return;
      
      // Mark that we've done the check
      initialCheckDone.current = true;
      
      // Doctor in user interface
      if (userRole === 'doctor' && !isDoctorPath(segments)) {
        console.log('Route protection: Redirecting doctor to doctor interface');
        router.replace('/(doctor)/dashboard');
      } 
      // User in doctor interface
      else if (userRole === 'user' && isDoctorPath(segments)) {
        console.log('Route protection: Redirecting user to user interface');
        router.replace('/(tabs)');
      }
    }, 1000); // Long delay to ensure navigation system is fully ready
    
    return () => clearTimeout(timer);
  }, [navigation?.isReady(), segments, userRole, isAuthenticated]);
  
  return <>{children}</>;
}