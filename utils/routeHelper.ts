// utils/routeHelper.ts

/**
 * Utility functions for route management that works in both web and React Native
 */

/**
 * Determines if a path/segment string is related to the doctor interface
 * @param path Path or segment string to check
 * @returns boolean True if the path represents a doctor route
 */
export const isDoctorPath = (path: string): boolean => {
    return path.includes('(doctor)') || path.startsWith('/(doctor)');
  };
  
  /**
   * Helper function to determine user role from current path
   * For use when the explicit role information isn't available yet
   */
  export const getRoleFromPath = (path: string): 'user' | 'doctor' => {
    return isDoctorPath(path) ? 'doctor' : 'user';
  };
  
  /**
   * Safe way to check if we need to redirect based on path segments and role
   */
  export const shouldRedirect = (
    segments: string[] | null, 
    userRole: 'user' | 'doctor' | string
  ): { shouldRedirect: boolean; target: string } => {
    // If no segments, we can't determine
    if (!segments || segments.length === 0) {
      return { shouldRedirect: false, target: '' };
    }
  
    const currentPath = segments.join('/');
    
    // User in doctor interface needs to be redirected to user interface
    if (userRole === 'user' && isDoctorPath(currentPath)) {
      return { shouldRedirect: true, target: '/(tabs)' };
    }
    
    // Doctor in user interface needs to be redirected to doctor interface
    if (userRole === 'doctor' && !isDoctorPath(currentPath)) {
      return { shouldRedirect: true, target: '/(doctor)/dashboard' };
    }
    
    // No redirection needed
    return { shouldRedirect: false, target: '' };
  };