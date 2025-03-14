
// app/chat/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Header from '../../components/Header';
import ChatInterface from '../../components/ChatInterface';
import { getChatById, getChatMessages } from '../../lib/api';
import { Chat, Message } from '../../types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id && userId) {
      Promise.all([
        getChatById(id),
        getChatMessages(id)
      ]).then(([chatData, messagesData]) => {
        // Check if this chat belongs to the current user
        if (chatData && chatData.userId === userId) {
          setChat(chatData);
          setMessages(messagesData);
        } else {
          // Handle unauthorized access
          console.error('Unauthorized access to chat');
        }
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching chat data:', error);
        setLoading(false);
      });
    }
  }, [id, userId]);
  
  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header title="Loading..." showBackButton />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </View>
    );
  }
  
  if (!chat) {
    return (
      <View className="flex-1 bg-background">
        <Header title="Error" showBackButton />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-center text-gray-500">
            Chat not found or you don't have permission to view it.
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-background">
      <Header title={chat.title} showBackButton />
      <ChatInterface chatId={id} initialMessages={messages} />
    </View>
  );
}
