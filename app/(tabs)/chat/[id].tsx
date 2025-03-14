import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/clerk';
import { getConversationDetails, sendMessage } from '../../../lib/api';
import { ChatInterface } from '../../../components/chat/ChatInterface';
import { ChatMessage } from '../../../types';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams();
  const { user, isSignedIn } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn && id) {
      fetchConversationMessages();
    }
  }, [isSignedIn, id]);

  const fetchConversationMessages = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await getConversationDetails(id as string);
      
      if (response.success && response.data && response.data.messages) {
        // Convert DB messages to ChatMessage format
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          createdAt: new Date(msg.createdAt)
        }));
        
        setMessages(formattedMessages);
      } else {
        setError(response.error || 'Failed to load conversation');
        console.error('Failed to fetch conversation details:', response.error);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string): Promise<string> => {
    if (!id) throw new Error('Conversation ID is missing');
    
    try {
      const response = await sendMessage(id as string, content);
      
      if (response.success && response.data) {
        return response.data.content;
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-center mb-4">
          Please sign in to view this conversation
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: (title as string) || 'Chat',
          headerShown: true,
          headerBackTitle: 'Conversations',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => fetchConversationMessages()}
              className="ml-2 p-2"
            >
              <Ionicons name="refresh" size={20} color="#4f46e5" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <View className="flex-1 bg-white">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="mt-2 text-gray-500">Loading conversation...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-4">
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-red-500 text-lg mt-4 text-center">{error}</Text>
            <TouchableOpacity 
              className="mt-6 bg-blue-500 px-4 py-2 rounded-full"
              onPress={() => fetchConversationMessages()}
            >
              <Text className="text-white">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ChatInterface
            conversationId={id as string}
            initialMessages={messages}
            onSendMessage={handleSendMessage}
          />
        )}
      </View>
    </>
  );
}