import React from 'react';
import { View, Text } from 'react-native';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function MessageBubble({ content, isUser, timestamp }: MessageBubbleProps) {
  // Format timestamp to show only time (HH:MM)
  const formattedTime = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View 
        className={`rounded-2xl p-3 ${
          isUser 
            ? 'bg-blue-500 rounded-tr-sm' 
            : 'bg-gray-200 rounded-tl-sm'
        }`}
      >
        <Text 
          className={`${isUser ? 'text-white' : 'text-gray-800'}`}
          selectable={true}
        >
          {content}
        </Text>
      </View>
      
      <Text 
        className={`text-xs text-gray-500 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}
      >
        {formattedTime}
      </Text>
    </View>
  );
}