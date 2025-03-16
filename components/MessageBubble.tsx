// components/chat/ui/MessageBubble.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
  attachment?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message = '',
  isUser = false,
  timestamp = new Date(),
  isError = false,
  attachment
}) => {
  // Format the timestamp for display
  const formattedTime = format(timestamp, 'h:mm a');
  
  // Determine bubble styles based on sender and error state
  const bubbleStyles = isUser
    ? isError
      ? 'bg-red-100 self-end rounded-xl rounded-tr-none'
      : 'bg-blue-500 self-end rounded-xl rounded-tr-none'
    : 'bg-gray-100 self-start rounded-xl rounded-tl-none';
  
  // Determine text styles based on sender and error state
  const textStyles = isUser
    ? isError
      ? 'text-red-600'
      : 'text-white'
    : 'text-gray-800';
  
  // Determine time text styles based on sender
  const timeStyles = isUser
    ? isError
      ? 'text-red-400 text-right'
      : 'text-blue-200 text-right'
    : 'text-gray-500';
  
  // Handle attachment display if present
  const renderAttachment = () => {
    if (!attachment) return null;
    
    if (attachment.endsWith('.jpg') || attachment.endsWith('.png') || attachment.endsWith('.jpeg')) {
      return (
        <View className="mb-2 rounded-lg overflow-hidden">
          <Image
            source={{ uri: attachment }}
            className="w-full h-40"
            resizeMode="cover"
          />
        </View>
      );
    }
    
    // For other attachment types, show a download button
    return (
      <TouchableOpacity className="flex-row items-center p-2 bg-gray-200 rounded-lg mb-2">
        <Ionicons name="document" size={20} color="#4b5563" />
        <Text className="ml-2 text-gray-700 font-rubik">Attachment</Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View className={`max-w-3/4 mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View className={`px-4 py-2 ${bubbleStyles}`}>
        {renderAttachment()}
        <Text className={`${textStyles} font-rubik`}>{message}</Text>
        <Text className={`${timeStyles} text-xs mt-1 font-rubik`}>{formattedTime}</Text>
      </View>
    </View>
  );
};

export default MessageBubble;