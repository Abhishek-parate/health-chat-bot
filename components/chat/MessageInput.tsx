import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void> | void;
  isLoading?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  isLoading = false,
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    const currentMessage = message;
    setMessage('');
    
    try {
      await onSendMessage(currentMessage);
    } catch (error) {
      console.error('Error in MessageInput:', error);
      // Optionally restore the message if sending fails
      setMessage(currentMessage);
    } finally {
      // Focus back on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="border-t border-gray-200 bg-white px-4 py-2">
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-2">
            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              className="flex-1 text-gray-800 min-h-10"
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={isLoading || !message.trim()}
            className={`rounded-full p-3 ${
              message.trim() && !isLoading ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}