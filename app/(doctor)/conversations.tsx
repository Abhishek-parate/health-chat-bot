// app/(doctor)/conversations.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ConversationService, DoctorRequestService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';

export default function DoctorConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active', 'closed', 'all'
  
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, filter]); 
  
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Get conversations, approved requests, and pending requests
      const [conversationsData, approvedRequestsData, pendingRequestsData] = await Promise.all([
        loadConversations(),
        loadApprovedRequests(),
        loadPendingRequests()
      ]);
      
      // Combine approved requests with existing conversations
      const mergedData = mergeConversationsAndRequests(conversationsData, approvedRequestsData);
      setConversations(mergedData);
      
      // Set pending requests separately
      setPendingRequests(pendingRequestsData);
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadConversations = async () => {
    try {
      console.log("Loading doctor conversations");
      const data = await ConversationService.getDoctorConversations(user.id);
      console.log(`Retrieved ${data?.length || 0} doctor conversations`);
      return data || [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  };
  
  const loadApprovedRequests = async () => {
    try {
      console.log("Loading approved doctor requests");
      // Get all approved requests, with or without a conversation_id
      const { data, error } = await supabase
        .from('doctor_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          ),
          conversation:conversation_id (
            id,
            title,
            created_at,
            updated_at,
            status
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching approved doctor requests:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} approved requests`);
      
      // Transform the request data to match conversation format
      // Include ALL approved requests, even if they don't have a conversation yet
      const transformedData = data.map(request => {
        const now = new Date().toISOString();
        
        // Check if there's a conversation already
        if (request.conversation && request.conversation.id) {
          console.log(`Request ${request.id} has existing conversation: ${request.conversation.id}`);
          return {
            id: request.conversation.id,
            created_at: request.conversation.created_at,
            updated_at: request.conversation.updated_at,
            status: request.conversation.status || 'active',
            title: request.conversation.title,
            profiles: request.profiles,
            requestId: request.id,
            requestReason: request.reason,
            lastMessage: null,
            hasConversation: true
          };
        } else {
          console.log(`Request ${request.id} has NO conversation yet`);
          // Create a temporary conversation object for requests without conversations
          return {
            id: `req_${request.id}`, // Temporary ID for pending conversations
            created_at: request.created_at,
            updated_at: request.created_at,
            status: 'pending_start', // Special status for conversations not yet started
            title: `Consultation with ${request.profiles?.full_name || 'Patient'}`,
            profiles: request.profiles,
            requestId: request.id,
            patientId: request.user_id, // Store the patient ID for later use
            requestReason: request.reason,
            lastMessage: null,
            hasConversation: false
          };
        }
      });
        
      console.log(`Transformed ${transformedData.length} approved requests into conversations`);
      return transformedData;
    } catch (error) {
      console.error('Error loading approved requests:', error);
      return [];
    }
  };
  
  const loadPendingRequests = async () => {
    try {
      console.log("Loading pending doctor requests");
      const { data, error } = await supabase
        .from('doctor_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching pending doctor requests:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} pending requests`);
      return data || [];
    } catch (error) {
      console.error('Error loading pending requests:', error);
      return [];
    }
  };
  
  // Merge conversations and requests, avoiding duplicates
  const mergeConversationsAndRequests = (conversations, requests) => {
    // Create a map of existing conversation IDs
    const conversationMap = new Map();
    
    // Add all conversations to the map
    conversations.forEach(convo => {
      conversationMap.set(convo.id, convo);
    });
    
    // Add or update with request data
    requests.forEach(request => {
      if (!conversationMap.has(request.id)) {
        // Add new conversation from request
        conversationMap.set(request.id, request);
      } else if (request.hasConversation) {
        // Update existing conversation with additional request data if needed
        const existing = conversationMap.get(request.id);
        conversationMap.set(request.id, {
          ...existing,
          requestId: request.requestId,
          requestReason: request.requestReason
        });
      }
    });
    
    // Convert map back to array
    return Array.from(conversationMap.values());
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
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
  
// Alternative implementation using the PostgreSQL function
const startConversation = async (item) => {
    if (!item.patientId || !item.requestId) {
      console.error("Missing patient or request ID, cannot start conversation");
      Alert.alert("Error", "Cannot start conversation due to missing data");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log(`Starting new conversation with patient ${item.patientId} for request ${item.requestId}`);
      
      // Create a new conversation using the PostgreSQL function
      const conversationTitle = item.title || `Consultation with ${item.profiles?.full_name || 'Patient'}`;
      
      // Use RPC to call our database function (after creating it in SQL Editor)
      const { data: newConversation, error } = await supabase
        .rpc('create_doctor_conversation', {
          patient_id: item.patientId,
          doctor_id: user.id,
          conversation_title: conversationTitle
        });
      
      if (error) {
        console.error("Error creating conversation via RPC:", error);
        throw new Error("Failed to create conversation");
      }
      
      if (!newConversation) {
        throw new Error("Failed to create conversation - no data returned");
      }
      
      console.log(`Created new conversation with ID: ${newConversation.id}`);
      
      // Update the doctor request with the new conversation ID
      const requestUpdated = await updateRequestWithConversation(item.requestId, newConversation.id);
      
      if (!requestUpdated) {
        throw new Error("Failed to update request with conversation ID");
      }
      
      console.log("Updated doctor request with new conversation ID");
      
      // Navigate to the chat screen with the correct path
      router.push({
        pathname: '/(doctor)/chat',
        params: { conversationId: newConversation.id }
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to update the doctor request with the conversation ID
  const updateRequestWithConversation = async (requestId, conversationId) => {
    try {
      // Since there is no updateRequestConversation method in DoctorRequestService
      // We need to use the Supabase client directly to update the conversation_id
      const { error } = await supabase
        .from('doctor_requests')
        .update({ 
          conversation_id: conversationId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);
        
      if (error) {
        console.error('Error updating request with conversation ID:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception in updateRequestWithConversation:', error);
      return false;
    }
  };
  
  const filteredConversations = conversations.filter(convo => {
    if (filter === 'all') return true;
    if (filter === 'active' && convo.status === 'pending_start') return true; // Include pending_start in active filter
    return convo.status === filter;
  });
  
  // Fix for renderConversationItem function
  const renderConversationItem = ({ item }) => {
    // Debug the item structure to identify any issues
    console.log(`Rendering item with ID: ${item?.id || 'unknown'}, status: ${item?.status}`);
    
    if (!item) {
      console.error("Received undefined item in renderConversationItem");
      return null;
    }
    
    // Calculate time since last update (with fallbacks)
    const lastUpdate = new Date(item.updated_at || item.created_at || new Date());
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
    
    // Check if there's a request reason to display
    const hasRequestInfo = item.requestReason && item.requestId;
    
    // Check if this is a request without a conversation yet
    const isPendingStart = item.status === 'pending_start';
    
    // Handle the item press directly here without a separate function
    const onItemPress = () => {
      if (isPendingStart) {
        // For approved requests without conversations, start a new conversation
        startConversation(item);
      } else {
        // For existing conversations, navigate to the chat
        console.log(`Navigating to conversation: ${item.id}`);
        router.push({
          pathname: '/(doctor)/chat',
          params: { conversationId: item.id }
        });
      }
    };
    
    return (
      <TouchableOpacity
        onPress={onItemPress}
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
                  {item.unreadCount > 0 && !isPendingStart && (
                    <View className="flex-row items-center mr-2">
                      <View className="h-2 w-2 bg-emerald-500 rounded-full mr-1" />
                      <Text className="text-emerald-600 text-xs font-rubik">
                        {item.unreadCount} new
                      </Text>
                    </View>
                  )}
                  
                  <View className={`rounded-full px-2 py-0.5 ${
                    isPendingStart ? 'bg-amber-100' :
                    item.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-rubik-medium ${
                      isPendingStart ? 'text-amber-800' :
                      item.status === 'active' ? 'text-emerald-800' : 'text-gray-800'
                    }`}>
                      {isPendingStart ? 'Start Conversation' : 
                       item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </View>
            </View>
          </View>
          
          {/* Show last message or request reason if available */}
          <View className="mt-2 pl-15">
            {item.lastMessage ? (
              <Text className="text-gray-600 font-rubik" numberOfLines={1}>
                {item.lastMessage.content}
              </Text>
            ) : hasRequestInfo ? (
              <Text className="text-gray-600 font-rubik" numberOfLines={1}>
                Reason: {item.requestReason}
              </Text>
            ) : (
              <Text className="text-gray-600 font-rubik italic" numberOfLines={1}>
                No messages yet
              </Text>
            )}
          </View>
          
          {/* Show action buttons based on status */}
          <View className="flex-row justify-end mt-2">
            {isPendingStart && (
              <TouchableOpacity
                onPress={() => startConversation(item)}
                className="bg-emerald-100 px-3 py-1 rounded-full"
              >
                <Text className="text-emerald-700 text-xs font-rubik-medium">Start Conversation</Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'active' && !isPendingStart && (
              <TouchableOpacity
                onPress={() => handleCloseConversation(item.id)}
                className="bg-gray-100 px-3 py-1 rounded-full"
              >
                <Text className="text-gray-600 text-xs font-rubik-medium">Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Add this return statement
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
          <Text className="mt-4 text-gray-600 font-rubik">Loading consultations...</Text>
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