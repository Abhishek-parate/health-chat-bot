// components/common/UnreadBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';

/**
 * A reusable badge component for displaying unread message counts
 */
export function UnreadBadge({ count, size = 'medium', color = 'red' }) {
  if (!count || count <= 0) return null;
  
  // Define sizes
  const sizeClasses = {
    small: 'h-4 min-w-4 px-1',
    medium: 'h-5 min-w-5 px-1',
    large: 'h-6 min-w-6 px-1'
  };
  
  // Define text sizes
  const textSizes = {
    small: 'text-[10px]',
    medium: 'text-xs',
    large: 'text-sm'
  };
  
  // Define colors
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500'
  };
  
  return (
    <View className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full items-center justify-center`}>
      <Text className={`${textSizes[size]} text-white font-rubik-medium`}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}