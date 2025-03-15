// components/chat/DoctorChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

export function DoctorChatInterface({
  conversationId,
  initialMessages = [],
  onSendMessage,
  patient,
  isDisabled = false
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

  const handleSend = async () => {
    if (!message.trim() || isProcessing || isDisabled) return;
    
    const doctorMessage = message;
    setMessage('');
    setIsProcessing(true);

    try {
      // Send message via callback
      const response = await onSendMessage(doctorMessage);
      
      if (response !== undefined) {
        // If there was an error message, show it
        if (response) {
          // Show error message to doctor only (not sent to user)
          console.log("Error sending message:", response);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUserMessage = item.role === 'user';
    const isDoctorMessage = item.role === 'doctor';
    const isSystemMessage = item.role === 'assistant';
    
    // For styling purposes
    let bgColor, textColor, alignment, borderRadius;

    // Set styles based on message role
    if (isDoctorMessage) {
      bgColor = 'bg-emerald-500';
      textColor = 'text-white';
      alignment = 'self-end';
      borderRadius = 'rounded-2xl rounded-br-md';
    } else if (isUserMessage) {
      bgColor = 'bg-blue-100';
      textColor = 'text-gray-800';
      alignment = 'self-start';
      borderRadius = 'rounded-2xl rounded-bl-md';
    } else {
      // System messages
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-600';
      alignment = 'self-center';
      borderRadius = 'rounded-xl';
    }

    return (
      <View className={`mb-3 max-w-[85%] ${alignment}`}>
        {isUserMessage && patient && (
          <Text className="text-blue-700 text-xs font-rubik-medium ml-2 mb-1">
            {patient.full_name || 'Patient'}
          </Text>
        )}
        
        <View className={`${bgColor} ${borderRadius} px-4 py-3`}>
          {isSystemMessage ? (
            <Text className="text-gray-600 italic font-rubik-medium text-center">
              {item.content}
            </Text>
          ) : (
            <Text className={`${textColor} font-rubik`}>{item.content}</Text>
          )}
        </View>
        
        <Text className={`text-gray-500 text-xs font-rubik ${isDoctorMessage ? 'text-right mr-2' : 'ml-2'} mt-1`}>
          {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1">
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
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
            placeholder={isDisabled ? "Consultation is closed" : "Type your medical advice..."}
            value={message}
            onChangeText={setMessage}
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2 font-rubik"
            multiline
            editable={!isDisabled}
            numberOfLines={1}
          />
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || isProcessing || isDisabled}
            className={`rounded-full p-3 ${
              !message.trim() || isProcessing || isDisabled
                ? 'bg-gray-300'
                : 'bg-emerald-500'
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