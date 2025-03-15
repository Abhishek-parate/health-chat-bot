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
import { ConversationService, DoctorRequestService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';

export default function DoctorUserListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (user) {
      loadApprovedUsers();
    }
  }, [user]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(approvedUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = approvedUsers.filter(user => 
        user.profiles?.full_name?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, approvedUsers]);
  
  const loadApprovedUsers = async () => {
    setIsLoading(true);
    try {
      // Get all approved requests with user profiles
      const { data, error } = await supabase
        .from('doctor_requests')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          conversation:conversation_id (
            id,
            status
          )
        `)
        .eq('status', 'approved');
      
      if (error) {
        console.error('Error fetching approved requests:', error);
        return;
      }
      
      // Group by user_id to avoid duplicates
      const userMap = {};
      data.forEach(request => {
        if (!userMap[request.user_id] || 
            new Date(request.created_at) > new Date(userMap[request.user_id].created_at)) {
          userMap[request.user_id] = request;
        }
      });
      
      const approvedUsersList = Object.values(userMap);
      console.log(`Found ${approvedUsersList.length} approved users`);
      
      setApprovedUsers(approvedUsersList);
      setFilteredUsers(approvedUsersList);
    } catch (error) {
      console.error('Error loading approved users:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadApprovedUsers();
  };
  
  const startOrContinueConversation = async (item) => {
    try {
      setIsLoading(true);
      
      // Check if we already have an active conversation
      if (item.conversation?.id && item.conversation?.status === 'active') {
        // Navigate to existing conversation
        router.push({
          pathname: '/chat',
          params: { conversationId: item.conversation.id }
        });
        return;
      }
      
      // Create a new conversation if needed
      const conversation = await ConversationService.createConversation(
        item.user_id, 
        'Doctor Consultation'
      );
      
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
      console.error('Error with conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderUserItem = ({ item }) => {
    const profile = item.profiles || {};
    const hasActiveConversation = item.conversation?.status === 'active';
    
    return (
      <TouchableOpacity
        onPress={() => startOrContinueConversation(item)}
        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      >
        <View className="p-4">
          <View className="flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
              {profile.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  className="h-12 w-12 rounded-full" 
                />
              ) : (
                <Text className="text-indigo-600 font-rubik-bold">
                  {profile.full_name?.charAt(0) || 'P'}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-gray-800 font-rubik-bold">
                {profile.full_name || 'Patient'}
              </Text>
              
              <View className="flex-row items-center mt-1">
                <View className={`rounded-full px-2 py-0.5 ${
                  hasActiveConversation ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  <Text className={`text-xs font-rubik-medium ${
                    hasActiveConversation ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {hasActiveConversation 
                      ? 'Active conversation' 
                      : 'Approved - Start chat'}
                  </Text>
                </View>
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
          <Text className="text-2xl font-rubik-bold text-white">Approved Patients</Text>
        </View>
        
        {/* Search bar */}
        <View className="flex-row bg-white/20 rounded-full p-1 mb-2">
          <TextInput
            placeholder="Search approved patients..."
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
          <Text className="mt-4 text-gray-600 font-rubik">Loading approved patients...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="people" size={50} color="#9ca3af" />
          <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
            No approved patients found
          </Text>
          <Text className="text-gray-500 text-center font-rubik">
            {searchQuery.trim() !== '' 
              ? "No approved patients match your search criteria."
              : "You haven't approved any patient consultation requests yet."}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/requests')}
            className="mt-6 bg-emerald-100 rounded-xl px-5 py-3"
          >
            <Text className="text-emerald-800 font-rubik-medium">View Pending Requests</Text>
          </TouchableOpacity>
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