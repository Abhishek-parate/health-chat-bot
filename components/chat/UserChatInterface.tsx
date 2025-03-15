// components/chat/UserChatInterface.tsx
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

export function UserChatInterface({
  conversationId,
  initialMessages = [],
  onSendMessage,
  doctorInfo,
  isWithDoctor = false,
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
    
    const userMessage = message;
    setMessage('');
    setIsProcessing(true);

    try {
      // Send message via callback
      const response = await onSendMessage(userMessage);
      
      if (response !== undefined) {
        // If there was an error message, show it
        if (response) {
          // Show error in UI for user if with AI (not for doctor chats)
          if (!isWithDoctor) {
            const errorMessage = {
              id: Date.now().toString() + '-error',
              role: 'assistant',
              content: response,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
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
    const isAIMessage = item.role === 'assistant';
    
    // For styling purposes
    let bgColor, textColor, alignment, borderRadius;

    // Set styles based on message role
    if (isUserMessage) {
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
      alignment = 'self-end';
      borderRadius = 'rounded-2xl rounded-br-md';
    } else if (isDoctorMessage) {
      bgColor = 'bg-emerald-500';
      textColor = 'text-white';
      alignment = 'self-start';
      borderRadius = 'rounded-2xl rounded-bl-md';
    } else {
      // AI messages
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-800';
      alignment = 'self-start';
      borderRadius = 'rounded-2xl rounded-bl-md';
    }

    return (
      <View className={`mb-3 max-w-[85%] ${alignment}`}>
        {isDoctorMessage && doctorInfo && (
          <Text className="text-emerald-700 text-xs font-rubik-medium ml-2 mb-1">
            Dr. {doctorInfo.full_name?.split(' ')[0] || 'Doctor'}
          </Text>
        )}
        
        <View className={`${bgColor} ${borderRadius} px-4 py-3`}>
          {isAIMessage ? (
            <Markdown
              style={{
                body: { color: '#1F2937', fontFamily: 'Rubik-Regular' },
                paragraph: { marginVertical: 0 },
                link: { color: '#4F46E5', textDecorationLine: 'underline' },
                heading1: { fontFamily: 'Rubik-Bold', marginVertical: 4 },
                heading2: { fontFamily: 'Rubik-Bold', marginVertical: 4 },
                heading3: { fontFamily: 'Rubik-Medium', marginVertical: 4 },
                heading4: { fontFamily: 'Rubik-Medium', marginVertical: 4 },
                heading5: { fontFamily: 'Rubik-Medium', marginVertical: 4 },
                heading6: { fontFamily: 'Rubik-Medium', marginVertical: 4 },
                list_item: { marginVertical: 2, fontFamily: 'Rubik-Regular' },
                code_block: { fontFamily: 'monospace', backgroundColor: '#F3F4F6', padding: 8, borderRadius: 4 },
                code_inline: { fontFamily: 'monospace', backgroundColor: '#F3F4F6', paddingHorizontal: 4, borderRadius: 2 },
              }}
            >
              {item.content}
            </Markdown>
          ) : (
            <Text className={`${textColor} font-rubik`}>{item.content}</Text>
          )}
        </View>
        
        <Text className={`text-gray-500 text-xs font-rubik ${isUserMessage ? 'text-right mr-2' : 'ml-2'} mt-1`}>
          {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Chat input placeholder message based on context
  const getPlaceholderMessage = () => {
    if (isDisabled) {
      return isWithDoctor ? "Consultation is closed" : "Chat is closed";
    }
    
    return isWithDoctor 
      ? "Type your health concern..." 
      : "Ask your health question...";
  };

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
            placeholder={getPlaceholderMessage()}
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
                : isWithDoctor ? 'bg-emerald-500' : 'bg-blue-500'
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
        
        {/* Waiting for doctor indicator */}
        {isWithDoctor && !isDisabled && doctorInfo?.status !== 'online' && (
          <View className="bg-amber-50 rounded-lg px-3 py-2 mt-2">
            <Text className="text-amber-700 text-xs font-rubik text-center">
              Doctor is {doctorInfo?.status || 'offline'}. Responses may be delayed.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}