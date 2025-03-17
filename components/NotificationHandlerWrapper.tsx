// components/NotificationHandlerWrapper.tsx
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useNotificationHandler, setupNotificationHandler } from '@/utils/notificationHandler';

interface NotificationHandlerWrapperProps {
  children: React.ReactNode;
}

export default function NotificationHandlerWrapper({ children }: NotificationHandlerWrapperProps) {
  const { user, userRole } = useAuth();
  
  // Set up notification handler
  useNotificationHandler(user?.id);
  
  // Initialize notification system
  useEffect(() => {
    setupNotificationHandler().then(granted => {
      if (granted) {
        console.log('Notification permissions granted');
      } else {
        console.warn('Notification permissions denied');
      }
    });
  }, []);
  
  return <>{children}</>;
}