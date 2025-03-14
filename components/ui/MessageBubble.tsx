
// components/ui/MessageBubble.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { formatRelativeTime } from '@/utils/dateFormat';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function MessageBubble({ content, isUser, timestamp }: MessageBubbleProps) {
  return (
    <View 
      className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
    >
      <View
        className={`rounded-2xl p-3 ${
          isUser ? 'bg-primary rounded-tr-sm' : 'bg-gray-200 rounded-tl-sm'
        }`}
      >
        <Text
          className={`${isUser ? 'text-white' : 'text-gray-800'}`}
        >
          {content}
        </Text>
      </View>
      
      <Text 
        className={`text-xs text-gray-500 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}
      >
        {formatRelativeTime(timestamp)}
      </Text>
    </View>
  );
}
