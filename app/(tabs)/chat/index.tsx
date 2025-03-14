import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/clerk';
import { createNewConversation, sendMessage } from '../../../lib/api';
import { ChatInterface } from '../../../components/chat/ChatInterface';
import { ChatMessage } from '../../../types';
import { v4 as uuidv4 } from '../../../lib/uuid-helper';

export default function ChatScreen() {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Create a new conversation when needed
  const createConversation = async (initialMessage: string): Promise<string> => {
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to start a conversation");
      throw new Error("User not authenticated");
    }

    try {
      // Default title is the first few words of the first message
      const title = initialMessage.substring(0, 30) + (initialMessage.length > 30 ? '...' : '');
      
      const response = await createNewConversation(user.id, title);
      
      if (response.success && response.data) {
        console.log('Created new conversation:', response.data.id);
        setConversationId(response.data.id);
        return response.data.id;
      } else {
        throw new Error(response.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert("Error", "Failed to create a new conversation. Please try again.");
      throw error;
    }
  };

  // Handle sending a message and getting AI response
  const handleSendMessage = async (content: string): Promise<string> => {
    try {
      // Create a temporary user message for immediate UI display
      const tempUserMessage: ChatMessage = {
        id: uuidv4(),
        content,
        role: 'user',
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Create conversation if needed
      const currentConversationId = conversationId || await createConversation(content);
      
      // Send message to API
      const response = await sendMessage(currentConversationId, content);
      
      if (response.success && response.data) {
        // Add AI message to local state
        setMessages(prev => [...prev, {
          id: response.data.id,
          content: response.data.content,
          role: response.data.role,
          createdAt: new Date(response.data.createdAt)
        }]);
        
        return response.data.content;
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error in message flow:', error);
      throw error;
    }
  };

  // If user navigates to a new chat while in an existing conversation,
  // redirect to that conversation's specific route
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // Get the title from the first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
        : 'New Chat';
        
      router.replace({
        pathname: `/chat/${conversationId}`,
        params: { title }
      });
    }
  }, [conversationId, messages]);

  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-center mb-4">
          Please sign in to start a conversation
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold">Health Chat</Text>
          <TouchableOpacity 
            onPress={() => router.push('/conversations')}
            className="p-2"
          >
            <Ionicons name="list" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Chat Interface */}
      <ChatInterface
        initialMessages={messages}
        onSendMessage={handleSendMessage}
      />
    </View>
  );
}