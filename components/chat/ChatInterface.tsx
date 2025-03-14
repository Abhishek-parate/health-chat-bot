import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, Alert } from 'react-native';
import { ChatMessage } from '@/types';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { v4 as uuidv4 } from '../../lib/uuid-helper';

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
  const flatListRef = useRef<FlatList>(null);

  // For debugging
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Update messages when initialMessages changes
    setMessages(initialMessages || []);
    
    // Debug log
    console.log(`[ChatInterface] Received ${initialMessages?.length || 0} initial messages`);
    if (conversationId) {
      console.log(`[ChatInterface] For conversation: ${conversationId}`);
    }
  }, [initialMessages, conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    try {
      // Create a new user message for UI display
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content: message,
        role: 'user',
        createdAt: new Date(),
      };

      // Update UI immediately with user message
      setMessages((prev) => [...prev, userMessage]);
      
      // Debug
      console.log(`[ChatInterface] Sending message: "${message.substring(0, 20)}..."`);
      setDebugInfo(`Sending: "${message.substring(0, 20)}..."`);
      
      // Show loading state
      setIsLoading(true);

      // Get response from AI via parent component
      const aiResponse = await onSendMessage(message);
      
      // Debug
      console.log(`[ChatInterface] Received response: "${aiResponse.substring(0, 20)}..."`);
      setDebugInfo(`Received: "${aiResponse.substring(0, 20)}..."`);
      
      // Create an AI message for UI display
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date(),
      };

      // Update UI with AI response
      setMessages((prev) => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('[ChatInterface] Error in message flow:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Add error message to the chat
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: "Sorry, I couldn't process your request. Please try again.",
        role: 'assistant',
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      // Show a more detailed error alert for debugging
      Alert.alert(
        "Chat Error",
        `Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: "OK" }]
      );
      
    } finally {
      setIsLoading(false);
    }
  };

  // Render a single message
  const renderItem = ({ item }: { item: ChatMessage }) => {
    return (
      <MessageBubble
        content={item.content}
        isUser={item.role === 'user'}
        timestamp={new Date(item.createdAt)}
      />
    );
  };

  // Empty state for a new chat
  const renderEmptyChat = () => (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-gray-500 text-center mb-4">
        Ask any health-related question to get started!
      </Text>
      <Text className="text-gray-400 text-center">
        I'm your AI health assistant, here to provide general health information and guidance.
      </Text>
      {debugInfo ? (
        <Text className="text-xs text-red-500 mt-4">{debugInfo}</Text>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {messages.length === 0 ? (
        renderEmptyChat()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          onLayout={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListFooterComponent={
            debugInfo ? (
              <Text className="text-xs text-red-500 italic text-center mb-2">{debugInfo}</Text>
            ) : null
          }
        />
      )}
      
      {isLoading && (
        <View className="absolute bottom-16 left-0 right-0 items-center py-2">
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text className="text-xs text-gray-500 mt-1">AI is thinking...</Text>
        </View>
      )}
      
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Type your health question..."
      />
    </View>
  );
}