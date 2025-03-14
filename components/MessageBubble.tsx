
// components/ui/MessageBubble.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function MessageBubble({ content, isUser, timestamp }: MessageBubbleProps) {
  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View 
        className={`rounded-2xl p-3 ${
          isUser 
            ? 'bg-indigo-600 rounded-tr-sm' 
            : 'bg-gray-200 rounded-tl-sm'
        }`}
      >
        <Text 
          className={`${
            isUser ? 'text-white' : 'text-gray-800'
          }`}
        >
          {content}
        </Text>
      </View>
      
      <Text 
        className={`text-xs text-gray-500 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}
      >
        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}