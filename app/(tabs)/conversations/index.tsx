import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/clerk';
import { getUserConversations } from '../../../lib/api';
import { Conversation } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ConversationsScreen() {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      fetchConversations();
    }
  }, [isSignedIn, user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await getUserConversations(user.id);
      
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        console.error('Failed to fetch conversations:', response.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const navigateToChat = (conversationId: string, title: string) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: conversationId, title }
    });
  };

  const navigateToNewChat = () => {
    router.push('/chat');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      // Today - show time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (
      now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000
    ) {
      // Within the last week - show day name
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200"
      onPress={() => navigateToChat(item.id, item.title)}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1 mr-2">
          <Text className="font-bold text-lg mb-1" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-600" numberOfLines={2}>
            {item.preview || "Start a new conversation..."}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-500 mb-1">
            {formatDate(item.lastMessageDate)}
          </Text>
          {item.category && (
            <View className="bg-blue-100 rounded-full px-2 py-1">
              <Text className="text-xs text-blue-700">{item.category}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-center mb-4">
          Please sign in to see your chat history
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold">Conversations</Text>
          <TouchableOpacity
            onPress={navigateToNewChat}
            className="bg-blue-500 p-2 rounded-full"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-2 text-gray-500">Loading conversations...</Text>
        </View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#9ca3af" />
          <Text className="text-lg text-center text-gray-500 mt-4 mb-2">
            No conversations yet
          </Text>
          <Text className="text-center text-gray-400 mb-6">
            Start a new chat to get health information and guidance
          </Text>
          <TouchableOpacity
            onPress={navigateToNewChat}
            className="bg-blue-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-medium">Start New Chat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}