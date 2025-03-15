// components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

export function ChatInterface({
  conversationId,
  initialMessages = [],
  onSendMessage,
  isDoctor = false,
  isDisabled = false,
  userId // Add userId prop to track current user
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef(null);

  // Update messages when initialMessages changes
  useEffect(() => {
    if (initialMessages?.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Set up realtime subscription to messages
  useEffect(() => {
    if (!conversationId) return;

    // Create a channel for this specific conversation's messages
    const messageChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        payload => {
          console.log('Received new message:', payload);
          // Only add messages that aren't from the current user (to avoid duplicates)
          // or messages that don't already exist in our local state
          const newMessage = payload.new;
          
          if (newMessage.sender_id !== userId) {
            // Check if this message already exists in our local state
            const messageExists = messages.some(m => m.id === newMessage.id);
            
            if (!messageExists) {
              setMessages(prevMessages => [...prevMessages, newMessage]);
            }
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [conversationId, messages, userId]);

  const handleSend = async () => {
    if (!message.trim() || isProcessing || isDisabled) return;
    
    const userMessage = message;
    setMessage('');
    setIsProcessing(true);

    try {
      // Add user's message to the list immediately (optimistic UI)
      const newUserMessage = {
        id: Date.now().toString(), // Temporary ID
        role: isDoctor ? 'doctor' : 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        sender_id: userId,
        conversation_id: conversationId,
        is_read: false
      };
      
      // We don't need to update local state here since the message will come back from the subscription
      // But sometimes for smoother UX we can show it immediately, then let the subscription update it
      // with the real database ID once it's inserted
      
      // Wait for response from onSendMessage callback
      await onSendMessage(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      // If there's an error, we might want to show a retry button or similar UI
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUserMessage = item.role === 'user';
    const isDoctorMessage = item.role === 'doctor';
    const isAssistantMessage = item.role === 'assistant';
    
    // Is this message from the current user?
    const isFromCurrentUser = item.sender_id === userId;
    
    // For styling purposes
    let bgColor, textColor, alignment, borderRadius;

    // Set styles based on message role and current user role
    if ((isDoctor && isDoctorMessage) || (!isDoctor && isUserMessage)) {
      // Messages sent by the current user (doctor sends doctor messages, user sends user messages)
      bgColor = isDoctor ? 'bg-emerald-500' : 'bg-blue-500';
      textColor = 'text-white';
      alignment = 'self-end';
      borderRadius = 'rounded-2xl rounded-br-md';
    } else if ((isDoctor && isUserMessage) || (!isDoctor && isDoctorMessage)) {
      // Messages received by the current user (doctor receives user messages, user receives doctor messages)
      bgColor = isDoctor ? 'bg-blue-100' : 'bg-emerald-500';
      textColor = isDoctor ? 'text-gray-800' : 'text-white';
      alignment = 'self-start';
      borderRadius = 'rounded-2xl rounded-bl-md';
    } else {
      // Assistant messages
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-800';
      alignment = 'self-start';
      borderRadius = 'rounded-2xl rounded-bl-md';
    }

    return (
      <View className={`mb-3 max-w-[85%] ${alignment}`}>
        {isDoctorMessage && !isDoctor && (
          <Text className="text-emerald-700 text-xs font-rubik-medium ml-2 mb-1">
            Doctor
          </Text>
        )}
        
        {isUserMessage && isDoctor && (
          <Text className="text-blue-700 text-xs font-rubik-medium ml-2 mb-1">
            Patient
          </Text>
        )}
        
        <View className={`${bgColor} ${borderRadius} px-4 py-3`}>
          <Text className={`${textColor} font-rubik`}>{item.content}</Text>
        </View>
        
        <Text className={`text-gray-500 text-xs font-rubik ${isFromCurrentUser ? 'text-right mr-2' : 'ml-2'} mt-1`}>
          {new Date(item.timestamp || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  return (
    <View className="flex-1">
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id || `${item.role}-${item.created_at || Date.now()}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 80 }}
        inverted={false}
        ref={scrollRef}
        onContentSizeChange={() => {
          if (scrollRef.current && messages.length > 0) {
            scrollRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
      
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-2">
        <View className="flex-row items-center">
          <TextInput
            placeholder={isDisabled ? "Chat is closed" : 
              isDoctor ? "Type your medical advice..." : "Type your health concern..."}
            value={message}
            onChangeText={setMessage}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 font-rubik"
            multiline
            editable={!isDisabled}
          />
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || isProcessing || isDisabled}
            className={`rounded-full p-2 ${
              !message.trim() || isProcessing || isDisabled
                ? 'bg-gray-300'
                : isDoctor ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons 
                name="send" 
                size={18} 
                color="white" 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}