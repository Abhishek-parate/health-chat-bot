// app/(doctor)/conversations.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ConversationService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function DoctorConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active', 'closed', 'all'
  
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);
  
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await ConversationService.getDoctorConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };
  
  const handleCloseConversation = async (conversationId) => {
    try {
      await ConversationService.updateConversation(conversationId, { 
        status: 'closed' 
      });
      
      // Update local state
      setConversations(prevConversations =>
        prevConversations.map(convo =>
          convo.id === conversationId
            ? { ...convo, status: 'closed' }
            : convo
        )
      );
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };
  
  const filteredConversations = conversations.filter(convo => {
    if (filter === 'all') return true;
    return convo.status === filter;
  });
  
  const renderConversationItem = ({ item }) => {
    // Calculate time since last update
    const lastUpdate = new Date(item.updated_at || item.created_at);
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let timeLabel = '';
    if (diffDays > 0) {
      timeLabel = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      timeLabel = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMins > 0) {
      timeLabel = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else {
      timeLabel = 'Just now';
    }
    
    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/(tabs)/chat',
          params: { conversationId: item.id }
        })}
        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      >
        <View className="p-4">
          <View className="flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
              {item.profiles?.avatar_url ? (
                <Image 
                  source={{ uri: item.profiles.avatar_url }} 
                  className="h-12 w-12 rounded-full" 
                />
              ) : (
                <Text className="text-indigo-600 font-rubik-bold">
                  {item.profiles?.full_name?.charAt(0) || 'P'}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-800 font-rubik-bold">
                  {item.profiles?.full_name || 'Patient'}
                </Text>
                <Text className="text-gray-500 text-xs font-rubik">{timeLabel}</Text>
              </View>
              
              <View className="flex-row items-center justify-between mt-1">
                <View className="flex-row items-center">
                  {item.unreadCount > 0 && (
                    <View className="flex-row items-center mr-2">
                      <View className="h-2 w-2 bg-emerald-500 rounded-full mr-1" />
                      <Text className="text-emerald-600 text-xs font-rubik">
                        {item.unreadCount} new
                      </Text>
                    </View>
                  )}
                  
                  <View className={`rounded-full px-2 py-0.5 ${
                    item.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-rubik-medium ${
                      item.status === 'active' ? 'text-emerald-800' : 'text-gray-800'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </View>
            </View>
          </View>
          
          {item.lastMessage && (
            <View className="mt-2 pl-15">
              <Text className="text-gray-600 font-rubik" numberOfLines={1}>
                {item.lastMessage.content}
              </Text>
            </View>
          )}
          
          {item.status === 'active' && (
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => handleCloseConversation(item.id)}
                className="bg-gray-100 px-3 py-1 rounded-full"
              >
                <Text className="text-gray-600 text-xs font-rubik-medium">Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5"
      >

<View className="flex-row justify-end px-5 py-2">
  <TouchableOpacity
    onPress={() => router.push('/users')}
    className="bg-emerald-100 rounded-full px-4 py-2 flex-row items-center"
  >
    <Ionicons name="add-circle-outline" size={20} color="#059669" />
    <Text className="text-emerald-700 font-rubik-medium ml-1">New Chat</Text>
  </TouchableOpacity>
</View>

        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-rubik-bold text-white">Consultations</Text>
        </View>
        
        {/* Filter tabs */}
        <View className="flex-row bg-white/20 rounded-full p-1">
          {[
            { id: 'active', label: 'Active' },
            { id: 'closed', label: 'Closed' },
            { id: 'all', label: 'All' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setFilter(tab.id)}
              className={`flex-1 py-2 rounded-full ${
                filter === tab.id ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-rubik-medium ${
                filter === tab.id ? 'text-emerald-600' : 'text-white'
              }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
      
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-4 text-gray-600 font-rubik">Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="chatbubbles" size={50} color="#9ca3af" />
          <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
            No {filter === 'all' ? '' : filter} consultations found
          </Text>
          <Text className="text-gray-500 text-center font-rubik">
            {filter === 'active' 
              ? "You don't have any active consultations at the moment."
              : filter === 'closed'
                ? "You don't have any closed consultations."
                : "There are no consultations to display."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10b981']}
            />
          }
        />
      )}
    </View>
  );
}