// components/NotificationHandlerWrapper.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useNotificationHandler } from '@/utils/notificationHandler';

interface NotificationHandlerWrapperProps {
  children: React.ReactNode;
}

const NotificationHandlerWrapper: React.FC<NotificationHandlerWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Use the notification handler hook to set up notification response handling
  useNotificationHandler(user?.id);
  
  // This is just a wrapper component, render the children
  return <>{children}</>;
};

export default NotificationHandlerWrapper;