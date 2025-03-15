// app/(tabs)/chat/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../lib/clerk';
import { FontAwesome } from '@expo/vector-icons';
import { ChatInterface } from '../../../components/chat/ChatInterface';
import { 
  createConversation, 
  getConversationMessages, 
  sendMessageAndGetResponse,
  ChatMessage
} from '../../../lib/chatService';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isSignedIn } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Initialize conversation on load
  useEffect(() => {
    if (!isSignedIn || !user) return;
    
    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if conversationId was passed as a parameter
        if (params.conversationId) {
          const convoId = params.conversationId as string;
          setConversationId(convoId);
          
          // Load messages for this conversation
          const existingMessages = await getConversationMessages(convoId);
          setMessages(existingMessages);
        } else {
          // Create a new conversation
          const conversation = await createConversation(user.id);
          
          if (!conversation) {
            throw new Error('Failed to create conversation');
          }
          
          setConversationId(conversation.id);
          
          // If topic was provided, send an initial message
          if (params.topic) {
            const topic = params.topic as string;
            await handleSendMessage(`Tell me about ${topic}`);
          }
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [isSignedIn, user, params.conversationId, params.topic]);
  
  // Handle sending a message
  const handleSendMessage = async (message: string): Promise<string> => {
    if (!conversationId || !message.trim()) {
      return "Could not process your message. Please try again.";
    }
    
    try {
      const { userMessage, aiMessage } = await sendMessageAndGetResponse(
        conversationId,
        message
      );
      
      // If we got a valid AI message, return its content
      if (aiMessage) {
        // Update the local messages state (optional, since the ChatInterface component 
        // already handles displaying messages)
        setMessages(prev => [
          ...prev,
          userMessage!,
          aiMessage
        ]);
        
        return aiMessage.content;
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      return "Sorry, I couldn't process your request. Please try again.";
    }
  };
  
  // If not signed in, redirect to sign in page
  useEffect(() => {
    if (!isSignedIn && !isLoading) {
      router.replace('/sign-in');
    }
  }, [isSignedIn, isLoading]);
  
  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-4 text-gray-600">Checking authentication...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-4 text-gray-600">Loading your chat...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.replace('/chat')}
        >
          <Text className="text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push('/conversations')}
            className="mr-3"
          >
            <FontAwesome name="list" size={20} color="#4b5563" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold flex-1">Health Chat</Text>
          
          <TouchableOpacity 
            className="p-2"
            onPress={() => router.replace('/chat')}
          >
            <FontAwesome name="plus" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Chat Interface */}
      <ChatInterface
        conversationId={conversationId || undefined}
        initialMessages={messages}
        onSendMessage={handleSendMessage}
      />
    </View>
  );
}