// app/(tabs)/conversations.tsx
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
import { getUserConversations } from '@/lib/chatService';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'ai', 'doctor'
  
  // Load conversations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [user])
  );
  
  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await getUserConversations(user.id);
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
  
  const handleNewChat = () => {
    router.push('/chat');
  };
  
  const handleRequestDoctor = () => {
    router.push('/request-doctor');
  };
  
  const filteredConversations = conversations.filter(convo => {
    if (filter === 'all') return true;
    if (filter === 'ai') return !convo.is_doctor_chat;
    if (filter === 'doctor') return convo.is_doctor_chat;
    return true;
  });
  
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-6">
      <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="chatbubbles" size={30} color="#4f46e5" />
      </View>
      <Text className="text-xl text-gray-800 font-rubik-bold text-center mb-2">
        No Conversations Yet
      </Text>
      <Text className="text-gray-500 text-center mb-6 font-rubik">
        Start a new chat with our AI health assistant or request a consultation with a doctor.
      </Text>
      <View className="flex-row space-x-4">
        <TouchableOpacity
          onPress={handleNewChat}
          className="bg-indigo-600 px-4 py-3 rounded-xl"
        >
          <Text className="text-white font-rubik-medium">New Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRequestDoctor}
          className="bg-white border border-indigo-600 px-4 py-3 rounded-xl"
        >
          <Text className="text-indigo-600 font-rubik-medium">Request Doctor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderConversationItem = ({ item }) => {
    const isDoctor = item.is_doctor_chat;
    const lastMessage = item.lastMessage;
    
    let subtitle = 'No messages yet';
    if (lastMessage) {
      subtitle = lastMessage.content.length > 40
        ? lastMessage.content.substring(0, 40) + '...'
        : lastMessage.content;
    }
    
    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/chat',
          params: { conversationId: item.id }
        })}
        className="bg-white p-4 rounded-xl shadow-sm mb-3"
      >
        <View className="flex-row items-center">
          <View className={`h-12 w-12 rounded-full items-center justify-center mr-3 ${
            isDoctor ? 'bg-emerald-100' : 'bg-indigo-100'
          }`}>
            {isDoctor && item.doctorInfo?.avatar ? (
              <Image 
                source={{ uri: item.doctorInfo.avatar }} 
                className="h-12 w-12 rounded-full" 
              />
            ) : isDoctor ? (
              <Text className="text-emerald-600 text-xl font-rubik-bold">👨‍⚕️</Text>
            ) : (
              <Text className="text-indigo-600 text-xl font-rubik-bold">🩺</Text>
            )}
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-800 font-rubik-bold">
                {isDoctor 
                  ? `Dr. ${item.doctorInfo?.name || 'Doctor'}` 
                  : item.title || 'AI Health Assistant'}
              </Text>
              <Text className="text-gray-500 text-xs font-rubik">
                {lastMessage 
                  ? new Date(lastMessage.timestamp).toLocaleDateString() 
                  : new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-gray-600 font-rubik" numberOfLines={1}>
                {subtitle}
              </Text>
              
              {item.unreadCount > 0 && (
                <View className="bg-indigo-600 h-5 min-w-5 rounded-full items-center justify-center px-1">
                  <Text className="text-white text-xs font-rubik-bold">
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
            
            {isDoctor && (
              <View className="flex-row items-center mt-1">
                <View className={`h-2 w-2 rounded-full mr-1 ${
                  item.doctorInfo?.status === 'online' 
                    ? 'bg-emerald-500' 
                    : item.doctorInfo?.status === 'busy'
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                }`} />
                <Text className="text-gray-500 text-xs font-rubik capitalize">
                  {item.doctorInfo?.status || 'offline'}
                </Text>
                
                {item.doctorInfo?.specialty && (
                  <Text className="text-gray-500 text-xs font-rubik ml-2">
                    • {item.doctorInfo.specialty}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5"
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-rubik-bold text-white">Conversations</Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleRequestDoctor}
              className="bg-white/20 p-2 rounded-full mr-2"
            >
              <Ionicons name="medkit" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNewChat}
              className="bg-white/20 p-2 rounded-full"
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filter tabs */}
        <View className="flex-row bg-white/20 rounded-full p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'ai', label: 'AI Assistant' },
            { id: 'doctor', label: 'Doctors' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setFilter(tab.id)}
              className={`flex-1 py-2 rounded-full ${
                filter === tab.id ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-rubik-medium ${
                filter === tab.id ? 'text-indigo-600' : 'text-white'
              }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
      
      {/* Conversation list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-4 text-gray-600 font-rubik">Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        renderEmptyState()
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
              colors={['#4f46e5']}
            />
          }
        />
      )}
    </View>
  );
}