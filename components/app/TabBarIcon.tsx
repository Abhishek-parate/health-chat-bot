// components/app/TabBarIcon.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnreadBadge } from '@/components/common/UnreadBadge';
import { getTotalUnreadMessageCount } from '@/utils/notificationService';

export function TabBarIcon({ 
  name, 
  color, 
  size = 24,
  showUnreadBadge = false
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Check for total unread messages
  useEffect(() => {
    if (!showUnreadBadge) return;
    
    const checkUnreadMessages = async () => {
      const count = await getTotalUnreadMessageCount();
      setUnreadCount(count);
    };
    
    // Initial check
    checkUnreadMessages();
    
    // Set up interval to check regularly
    const interval = setInterval(checkUnreadMessages, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [showUnreadBadge]);
  
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {showUnreadBadge && unreadCount > 0 && (
        <View className="absolute -top-1 -right-1">
          <UnreadBadge count={unreadCount} size="small" />
        </View>
      )}
    </View>
  );
}