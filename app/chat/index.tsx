import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatInterface from '../../components/ChatInterface';
import { executeQuery } from '../../lib/db';
import Header from '../../components/Header';

type Conversation = {
  id: number;
  title: string;
  updatedAt: Date;
};

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  const loadConversations = async () => {
    try {
      const result = await executeQuery(
        `SELECT id, title, updated_at 
         FROM conversations 
         WHERE user_id = $1 
         ORDER BY updated_at DESC 
         LIMIT 20`,
        [userId]
      );

      const loadedConversations = result.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        updatedAt: new Date(conv.updated_at),
      }));

      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const startNewChat = () => {
    router.replace('/chat');
    setShowConversations(false);
  };

  const openConversation = (id: number) => {
    router.push(`/chat/${id}`);
    setShowConversations(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Health Chat"
        showMenu
        onMenuPress={() => setShowConversations(!showConversations)}
      />
      
      <View className="flex-1 flex-row">
        {/* Sidebar for conversations - shown conditionally */}
        {showConversations && (
          <View className="w-64 bg-white border-r border-gray-200">
            <View className="p-4 border-b border-gray-200">
              <TouchableOpacity
                onPress={startNewChat}
                className="flex-row items-center p-2 bg-primary rounded-lg"
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white ml-2">New Chat</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => openConversation(item.id)}
                  className="p-4 border-b border-gray-100"
                >
                  <Text className="font-medium" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {item.updatedAt.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-4 items-center">
                  <Text className="text-gray-500">No conversations yet</Text>
                </View>
              }
            />
          </View>
        )}
        
        {/* Main chat area */}
        <View className="flex-1">
          <ChatInterface />
        </View>
      </View>
    </SafeAreaView>
  );
}