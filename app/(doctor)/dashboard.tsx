// app/(doctor)/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Image,
  RefreshControl,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  ProfileService, 
  ConversationService, 
  DoctorRequestService 
} from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function DoctorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [stats, setStats] = useState({
    activePatients: 0,
    totalConsultations: 0,
    pendingRequests: 0
  });
  const [activeConversations, setActiveConversations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    if (user) {
      loadDoctorData();
    }
  }, [user]);

  // Check if user is a doctor
  useEffect(() => {
    if (user) {
      checkDoctorAccess();
    }
  }, [user]);

  const checkDoctorAccess = async () => {
    const profile = await ProfileService.getProfile(user.id);
    if (!profile || profile.role !== 'doctor') {
      router.replace('/(tabs)');
    } else {
      setDoctorProfile(profile);
      setIsAvailable(profile.status !== 'offline');
    }
  };

  const loadDoctorData = async () => {
    setIsLoading(true);
    try {
      // Get doctor's conversations
      const conversations = await ConversationService.getDoctorConversations(user.id);
      
      // Get active conversations
      const active = conversations.filter(c => c.status === 'active');
      setActiveConversations(active);
      
      // Get pending doctor requests
      const requests = await DoctorRequestService.getPendingRequests();
      setPendingRequests(requests.slice(0, 5));
      
      // Calculate stats
      const uniquePatients = new Set(conversations.map(c => c.user_id));
      
      setStats({
        activePatients: uniquePatients.size,
        totalConsultations: conversations.length,
        pendingRequests: requests.length
      });
    } catch (error) {
      console.error('Error loading doctor dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleAvailability = async (value) => {
    if (!doctorProfile) return;
    
    setIsAvailable(value);
    
    // Update doctor status in database
    const status = value ? 'online' : 'offline';
    await ProfileService.updateUserStatus(user.id, status);
    
    // Update local state
    setDoctorProfile({
      ...doctorProfile,
      status
    });
  };

  const handleAcceptRequest = async (requestId) => {
    setIsLoading(true);
    try {
      // Update request status to approved
      const success = await DoctorRequestService.updateRequestStatus(
        requestId, 
        'approved',
        user.id
      );
      
      if (success) {
        // Refresh data
        loadDoctorData();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDoctorData();
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading dashboard data...</Text>
      </View>
    );
  }

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
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-rubik-bold text-white">Doctor Dashboard</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="person" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Doctor info card */}
        <View className="mt-4 bg-white/20 p-4 rounded-xl backdrop-blur-lg">
          <View className="flex-row items-center">
            <View className="h-14 w-14 rounded-full bg-white items-center justify-center mr-3">
              {doctorProfile?.avatar_url ? (
                <Image 
                  source={{ uri: doctorProfile.avatar_url }} 
                  className="h-14 w-14 rounded-full" 
                />
              ) : (
                <Text className="text-emerald-600 text-xl font-rubik-bold">
                  {doctorProfile?.full_name?.charAt(0) || 'D'}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-rubik-bold">
                {doctorProfile?.full_name || 'Doctor'}
              </Text>
              <Text className="text-white/80 font-rubik">
                {doctorProfile?.specialty || 'Healthcare Professional'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-white mr-2 font-rubik">
                {isAvailable ? 'Available' : 'Offline'}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: '#ffffff40', true: '#ffffff80' }}
                thumbColor={isAvailable ? '#ffffff' : '#e5e7eb'}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10b981']}
          />
        }
      >
        {/* Stats Overview */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-white shadow-sm rounded-xl p-4 w-[31%]">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="people" size={20} color="#10b981" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.activePatients}</Text>
            <Text className="text-gray-500 font-rubik text-xs">Patients</Text>
          </View>
          
          <View className="bg-white shadow-sm rounded-xl p-4 w-[31%]">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.totalConsultations}</Text>
            <Text className="text-gray-500 font-rubik text-xs">Consultations</Text>
          </View>
          
          <View className="bg-white shadow-sm rounded-xl p-4 w-[31%]">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="hourglass" size={20} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.pendingRequests}</Text>
            <Text className="text-gray-500 font-rubik text-xs">Requests</Text>
          </View>
        </View>
        
        {/* Pending Doctor Requests */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">Consultation Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(doctor)/requests')}>
              <Text className="text-emerald-600 font-rubik-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          {pendingRequests.length === 0 ? (
            <View className="bg-white rounded-xl p-6 shadow-sm items-center">
              <Ionicons name="checkmark-circle" size={40} color="#10b981" />
              <Text className="text-gray-800 mt-2 font-rubik-medium">No pending requests</Text>
              <Text className="text-gray-500 text-center mt-1 font-rubik">
                You have no active consultation requests at the moment
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {pendingRequests.map((request, index) => (
                <View 
                  key={request.id}
                  className={`p-4 ${
                    index < pendingRequests.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="h-10 w-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                      {request.profiles?.avatar_url ? (
                        <Image 
                          source={{ uri: request.profiles.avatar_url }} 
                          className="h-10 w-10 rounded-full" 
                        />
                      ) : (
                        <Text className="text-amber-600 font-rubik-bold">
                          {request.profiles?.full_name?.charAt(0) || 'U'}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-rubik-medium">
                        {request.profiles?.full_name || 'Patient'}
                      </Text>
                      <Text className="text-gray-500 text-xs font-rubik">
                        {new Date(request.created_at).toLocaleString()}
                      </Text>
                    </View>
                    <View className="bg-amber-100 rounded-full px-2 py-0.5">
                      <Text className="text-amber-800 text-xs font-rubik-medium">Pending</Text>
                    </View>
                  </View>
                  
                  <Text className="text-gray-600 font-rubik mb-3" numberOfLines={2}>
                    {request.reason || 'No reason provided'}
                  </Text>
                  
                  <View className="flex-row justify-end">
                    <TouchableOpacity 
                      onPress={() => router.push({
                        pathname: '/(doctor)/request-details',
                        params: { id: request.id }
                      })}
                      className="bg-gray-100 px-4 py-2 rounded-xl mr-2"
                    >
                      <Text className="text-gray-600 font-rubik-medium text-sm">View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleAcceptRequest(request.id)}
                      className="bg-emerald-100 px-4 py-2 rounded-xl"
                    >
                      <Text className="text-emerald-700 font-rubik-medium text-sm">Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Active Conversations */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">Active Consultations</Text>
            <TouchableOpacity onPress={() => router.push('/(doctor)/conversations')}>
              <Text className="text-emerald-600 font-rubik-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          {activeConversations.length === 0 ? (
            <View className="bg-white rounded-xl p-6 shadow-sm items-center">
              <Ionicons name="chatbubbles" size={40} color="#3b82f6" />
              <Text className="text-gray-800 mt-2 font-rubik-medium">No active consultations</Text>
              <Text className="text-gray-500 text-center mt-1 font-rubik">
                Your consultation list is empty at the moment
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {activeConversations.map((conversation, index) => (
                <TouchableOpacity 
                  key={conversation.id}
                  onPress={() => router.push({
                    pathname: '/(tabs)/chat',
                    params: { conversationId: conversation.id }
                  })}
                  className={`p-4 ${
                    index < activeConversations.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
                      {conversation.profiles?.avatar_url ? (
                        <Image 
                          source={{ uri: conversation.profiles.avatar_url }} 
                          className="h-12 w-12 rounded-full" 
                        />
                      ) : (
                        <Text className="text-indigo-600 font-rubik-bold">
                          {conversation.profiles?.full_name?.charAt(0) || 'P'}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-rubik-medium">
                        {conversation.profiles?.full_name || 'Patient'}
                      </Text>
                      
                      {conversation.unreadCount > 0 && (
                        <View className="flex-row items-center">
                          <View className="h-2 w-2 rounded-full bg-emerald-500 mr-1" />
                          <Text className="text-emerald-600 text-xs font-rubik">
                            {conversation.unreadCount} new {conversation.unreadCount === 1 ? 'message' : 'messages'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Quick actions */}
        <View className="mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => router.push('/(doctor)/schedule')}
              className="bg-white rounded-xl shadow-sm p-4 items-center w-[48%]"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-2">
                <Ionicons name="calendar" size={24} color="#4f46e5" />
              </View>
              <Text className="text-gray-800 font-rubik-medium">Availability</Text>
              <Text className="text-gray-500 text-xs font-rubik text-center mt-1">
                Set your working hours
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(doctor)/patients')}
              className="bg-white rounded-xl shadow-sm p-4 items-center w-[48%]"
            >
              <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2">
                <Ionicons name="people" size={24} color="#10b981" />
              </View>
              <Text className="text-gray-800 font-rubik-medium">Patients</Text>
              <Text className="text-gray-500 text-xs font-rubik text-center mt-1">
                View patient history
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tips for Doctors */}
        <View className="mb-8">
          <View className="bg-indigo-50 rounded-xl p-5">
            <View className="flex-row items-start mb-3">
              <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mt-1 mr-3">
                <Ionicons name="information-circle" size={22} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-rubik-bold text-lg mb-1">Doctor Guidelines</Text>
                <Text className="text-gray-600 font-rubik">
                  Remember to maintain professional communication with patients at all times. Review their
                  medical history before consultations and ensure patient data confidentiality.
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => router.push('/(doctor)/guidelines')}
              className="bg-indigo-100 py-2.5 rounded-lg items-center mt-2"
            >
              <Text className="text-indigo-700 font-rubik-medium">View Full Guidelines</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
