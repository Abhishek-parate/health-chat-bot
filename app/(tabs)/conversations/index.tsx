// app/(tabs)/conversations/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/clerk';
import { FontAwesome } from '@expo/vector-icons';
import { 
  getUserConversations, 
  deleteConversation, 
  updateConversationTitle,
  Conversation
} from '../../../lib/chatService';

export default function ConversationsScreen() {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setError(null);
      const userConversations = await getUserConversations(user.id);
      setConversations(userConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (isSignedIn && user) {
      loadConversations();
    } else if (!isSignedIn && !isLoading) {
      router.replace('/sign-in');
    }
  }, [isSignedIn, user]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };
  
  const handleDelete = (conversation: Conversation) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteConversation(conversation.id);
              if (success) {
                // Remove from local state
                setConversations(prev => 
                  prev.filter(c => c.id !== conversation.id)
                );
              } else {
                Alert.alert(
                  "Error",
                  "Failed to delete conversation. Please try again."
                );
              }
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert(
                "Error",
                "An unexpected error occurred. Please try again."
              );
            }
          }
        }
      ]
    );
  };
  
  const handleRename = (conversation: Conversation) => {
    Alert.prompt(
      "Rename Conversation",
      "Enter a new name for this conversation:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rename",
          onPress: async (newTitle) => {
            if (!newTitle || newTitle.trim() === "") return;
            
            try {
              const success = await updateConversationTitle(
                conversation.id,
                newTitle.trim()
              );
              
              if (success) {
                // Update local state
                setConversations(prev => 
                  prev.map(c => 
                    c.id === conversation.id 
                      ? { ...c, title: newTitle.trim() } 
                      : c
                  )
                );
              } else {
                Alert.alert(
                  "Error",
                  "Failed to rename conversation. Please try again."
                );
              }
            } catch (error) {
              console.error('Error renaming conversation:', error);
              Alert.alert(
                "Error",
                "An unexpected error occurred. Please try again."
              );
            }
          }
        }
      ],
      "plain-text",
      conversation.title
    );
  };
  
  const renderItem = ({ item }: { item: Conversation }) => {
    const date = new Date(item.updatedAt);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-gray-200"
        onPress={() => router.push(`/chat?conversationId=${item.id}`)}
      >
        <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mr-3">
          <FontAwesome name="comments" size={18} color="#3b82f6" />
        </View>
        
        <View className="flex-1">
          <Text className="text-gray-800 font-medium" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-sm">
            {formattedDate}
          </Text>
        </View>
        
        <View className="flex-row">
          <TouchableOpacity
            className="p-2"
            onPress={() => handleRename(item)}
          >
            <FontAwesome name="pencil" size={16} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDelete(item)}
          >
            <FontAwesome name="trash" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
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
        <Text className="mt-4 text-gray-600">Loading conversations...</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold flex-1">Conversations</Text>
          
          <TouchableOpacity 
            className="p-2"
            onPress={() => router.push('/chat')}
          >
            <FontAwesome name="plus" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Conversations List */}
      {error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={handleRefresh}
          >
            <Text className="text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <FontAwesome name="comments-o" size={48} color="#d1d5db" />
          <Text className="text-gray-500 mt-4 mb-6 text-center">
            You don't have any conversations yet.
          </Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.push('/chat')}
          >
            <Text className="text-white">Start a New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </View>
  );
}