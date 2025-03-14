// components/chat/MessageInput.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type your health question...',
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View className="flex-row items-center border-t border-gray-200 bg-white px-4 py-2">
      <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-2">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          className="flex-1 text-gray-800"
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isLoading}
        />
        {message.length > 0 && (
          <TouchableOpacity onPress={() => setMessage('')} className="ml-2">
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        onPress={handleSend}
        disabled={isLoading || !message.trim()}
        className={`rounded-full p-2 ${
          message.trim() ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="send" size={20} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}