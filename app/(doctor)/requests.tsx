// app/(doctor)/requests.tsx
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
import { DoctorRequestService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function DoctorRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'all'
  
  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);
  
  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await DoctorRequestService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleAcceptRequest = async (requestId) => {
    try {
      setIsLoading(true);
      const success = await DoctorRequestService.updateRequestStatus(
        requestId,
        'approved',
        user.id
      );
      
      if (success) {
        Alert.alert('Success', 'Request approved successfully');
        loadRequests();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };
  
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });
  
  const renderRequest = ({ item }) => (
    <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="h-12 w-12 rounded-full bg-amber-100 items-center justify-center mr-3">
            {item.profiles?.avatar_url ? (
              <Image 
                source={{ uri: item.profiles.avatar_url }} 
                className="h-12 w-12 rounded-full" 
              />
            ) : (
              <Text className="text-amber-600 font-rubik-bold">
                {item.profiles?.full_name?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-gray-800 font-rubik-bold">
              {item.profiles?.full_name || 'Patient'}
            </Text>
            <Text className="text-gray-500 text-xs font-rubik">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          
          <View className={`rounded-full px-2 py-0.5 ${
            item.status === 'pending' ? 'bg-amber-100' : 
            item.status === 'approved' ? 'bg-emerald-100' : 
            'bg-red-100'
          }`}>
            <Text className={`text-xs font-rubik-medium ${
              item.status === 'pending' ? 'text-amber-800' : 
              item.status === 'approved' ? 'text-emerald-800' : 
              'text-red-800'
            }`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text className="text-gray-800 font-rubik-medium mb-1">Consultation Reason:</Text>
        <Text className="text-gray-600 font-rubik mb-3">
          {item.reason || 'No reason provided'}
        </Text>
        
        {item.status === 'pending' && (
          <View className="flex-row justify-end mt-2">
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/(doctor)/request-details',
                params: { id: item.id }
              })}
              className="bg-gray-100 px-4 py-2 rounded-xl mr-2"
            >
              <Text className="text-gray-600 font-rubik-medium">View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleAcceptRequest(item.id)}
              className="bg-emerald-100 px-4 py-2 rounded-xl"
            >
              <Text className="text-emerald-700 font-rubik-medium">Accept</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {item.status === 'approved' && (
          <TouchableOpacity 
            onPress={() => {
              if (item.conversation_id) {
                router.push({
                  pathname: '/(tabs)/chat',
                  params: { conversationId: item.conversation_id }
                });
              }
            }}
            className="bg-indigo-100 px-4 py-2 rounded-xl self-end"
          >
            <Text className="text-indigo-700 font-rubik-medium">View Conversation</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
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
          <Text className="text-2xl font-rubik-bold text-white">Consultation Requests</Text>
        </View>
        
        {/* Filter tabs */}
        <View className="flex-row bg-white/20 rounded-full p-1">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
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
          <Text className="mt-4 text-gray-600 font-rubik">Loading requests...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="clipboard" size={50} color="#9ca3af" />
          <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
            No {filter === 'all' ? '' : filter} requests found
          </Text>
          <Text className="text-gray-500 text-center font-rubik">
            {filter === 'pending' 
              ? "You don't have any pending consultation requests at the moment."
              : filter === 'approved'
                ? "You haven't approved any consultation requests yet."
                : "There are no consultation requests to display."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequest}
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