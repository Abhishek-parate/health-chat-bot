
// components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, FlatList } from 'react-native';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: ChatMessage[];
  onSendMessage: (message: string) => Promise<string>;
}

export function ChatInterface({
  conversationId,
  initialMessages = [],
  onSendMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<FlatList>(null);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const handleSendMessage = async (message: string) => {
    // Create a new user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      role: 'user',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate a small delay for natural conversation flow
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get response from AI
      const aiResponse = await onSendMessage(message);
      
      // Create an AI message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: "Sorry, I couldn't process your request. Please try again.",
        role: 'assistant',
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <MessageBubble
      content={item.content}
      isUser={item.role === 'user'}
      timestamp={item.createdAt}
    />
  );

  return (
    <View className="flex-1 bg-gray-50">
      {messages.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-center mb-4">
            Ask any health-related question to get started!
          </Text>
          <Text className="text-gray-400 text-center">
            I'm your AI health assistant, here to provide general health information and guidance.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      
      {isLoading && (
        <View className="items-center py-2">
          <ActivityIndicator size="small" color="#0ea5e9" />
          <Text className="text-xs text-gray-500 mt-1">AI is typing...</Text>
        </View>
      )}
      
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </View>
  );
}