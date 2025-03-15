// app/(doctor)/users.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ConversationService, ProfileService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function DoctorUserListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.full_name?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);
  
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Get all profiles with role 'user'
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      // Check if each user has had a conversation with the doctor
      const usersWithConversationStatus = await Promise.all(
        data.map(async (userData) => {
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id, status')
            .eq('user_id', userData.id)
            .eq('doctor_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          return {
            ...userData,
            hasConversation: conversations && conversations.length > 0,
            conversationId: conversations?.[0]?.id,
            conversationStatus: conversations?.[0]?.status
          };
        })
      );
      
      setUsers(usersWithConversationStatus);
      setFilteredUsers(usersWithConversationStatus);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };
  
  const startNewConversation = async (userId) => {
    try {
      setIsLoading(true);
      
      // Create a new conversation
      const conversation = await ConversationService.createConversation(userId, 'Doctor Consultation');
      
      if (conversation) {
        // Assign the doctor to this conversation
        await ConversationService.assignDoctorToConversation(conversation.id, user.id);
        
        // Navigate to chat
        router.push({
          pathname: '/chat',
          params: { conversationId: conversation.id }
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderUserItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          if (item.hasConversation && item.conversationStatus === 'active') {
            // If existing active conversation exists, navigate to it
            router.push({
              pathname: '/chat',
              params: { conversationId: item.conversationId }
            });
          } else {
            // Start a new conversation
            startNewConversation(item.id);
          }
        }}
        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      >
        <View className="p-4">
          <View className="flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
              {item.avatar_url ? (
                <Image 
                  source={{ uri: item.avatar_url }} 
                  className="h-12 w-12 rounded-full" 
                />
              ) : (
                <Text className="text-indigo-600 font-rubik-bold">
                  {item.full_name?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-gray-800 font-rubik-bold">
                {item.full_name || 'User'}
              </Text>
              
              <View className="flex-row items-center mt-1">
                {item.hasConversation ? (
                  <View className={`rounded-full px-2 py-0.5 ${
                    item.conversationStatus === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-rubik-medium ${
                      item.conversationStatus === 'active' ? 'text-emerald-800' : 'text-gray-800'
                    }`}>
                      {item.conversationStatus === 'active' ? 'Active conversation' : 'Previous consultation'}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-500 text-xs font-rubik">
                    No previous consultations
                  </Text>
                )}
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
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
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-rubik-bold text-white">All Patients</Text>
        </View>
        
        {/* Search bar */}
        <View className="flex-row bg-white/20 rounded-full p-1 mb-2">
          <TextInput
            placeholder="Search patients..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 px-4 py-2 text-white font-rubik"
          />
          <TouchableOpacity className="p-2">
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-4 text-gray-600 font-rubik">Loading patients...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="people" size={50} color="#9ca3af" />
          <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
            No patients found
          </Text>
          <Text className="text-gray-500 text-center font-rubik">
            {searchQuery.trim() !== '' 
              ? "No patients match your search criteria."
              : "There are no patients available to chat with."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
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