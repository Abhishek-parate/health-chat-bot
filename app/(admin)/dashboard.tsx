// app/(admin)/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileService, ConversationService, DoctorRequestService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    userCount: 0,
    doctorCount: 0,
    conversationCount: 0,
    pendingRequestsCount: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    const profile = await ProfileService.getProfile(user.id);
    if (!profile || profile.role !== 'admin') {
      router.replace('/(tabs)');
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get user counts
      const allUsers = await ProfileService.getAllUsers();
      const doctors = await ProfileService.getUsersByRole('doctor');
      
      // Get all conversations
      const conversations = await ConversationService.getAllConversations();
      
      // Get pending doctor requests
      const requests = await DoctorRequestService.getPendingRequests();
      
      // Update stats
      setStats({
        userCount: allUsers.filter(u => u.role === 'user').length,
        doctorCount: doctors.length,
        conversationCount: conversations.length,
        pendingRequestsCount: requests.length
      });
      
      // Set recent users (last 5)
      setRecentUsers(
        allUsers
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      );
      
      // Set pending requests
      setPendingRequests(requests.slice(0, 5));
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5"
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-rubik-bold text-white">Admin Dashboard</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="person" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
          />
        }
      >
        {/* Stats Overview */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="bg-white shadow-sm rounded-xl p-4 w-[48%] mb-4">
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mb-2">
              <Ionicons name="people" size={20} color="#4f46e5" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.userCount}</Text>
            <Text className="text-gray-500 font-rubik">Patients</Text>
          </View>
          
          <View className="bg-white shadow-sm rounded-xl p-4 w-[48%] mb-4">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="medkit" size={20} color="#10b981" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.doctorCount}</Text>
            <Text className="text-gray-500 font-rubik">Doctors</Text>
          </View>
          
          <View className="bg-white shadow-sm rounded-xl p-4 w-[48%] mb-4">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.conversationCount}</Text>
            <Text className="text-gray-500 font-rubik">Conversations</Text>
          </View>
          
          <View className="bg-white shadow-sm rounded-xl p-4 w-[48%] mb-4">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="hourglass" size={20} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-rubik-bold text-gray-800">{stats.pendingRequestsCount}</Text>
            <Text className="text-gray-500 font-rubik">Pending Requests</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/users')}
            className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]"
          >
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mb-1">
              <Ionicons name="people" size={20} color="#4f46e5" />
            </View>
            <Text className="text-gray-800 text-xs font-rubik-medium text-center">Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/requests')}
            className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]"
          >
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-1">
              <Ionicons name="document-text" size={20} color="#f59e0b" />
            </View>
            <Text className="text-gray-800 text-xs font-rubik-medium text-center">Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/conversations')}
            className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]"
          >
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-1">
              <Ionicons name="chatbubbles" size={20} color="#10b981" />
            </View>
            <Text className="text-gray-800 text-xs font-rubik-medium text-center">Conversations</Text>
          </TouchableOpacity>
        </View>
        
        {/* Recent Users */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">Recent Users</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/users')}>
              <Text className="text-indigo-600 font-rubik-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {recentUsers.map((user, index) => (
              <TouchableOpacity 
                key={user.id}
                onPress={() => router.push({
                  pathname: '/(admin)/user-details',
                  params: { id: user.id }
                })}
                className={`flex-row items-center p-4 ${
                  index < recentUsers.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="h-10 w-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  {user.avatar_url ? (
                    <Image 
                      source={{ uri: user.avatar_url }} 
                      className="h-10 w-10 rounded-full" 
                    />
                  ) : (
                    <Text className="text-indigo-600 font-rubik-bold">
                      {user.full_name.charAt(0)}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-rubik-medium">{user.full_name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 text-xs font-rubik mr-2">{user.role}</Text>
                    {user.role === 'doctor' && (
                      <View className="bg-emerald-100 rounded-full px-2 py-0.5">
                        <Text className="text-emerald-800 text-xs font-rubik-medium">Doctor</Text>
                      </View>
                    )}
                    {user.role === 'admin' && (
                      <View className="bg-indigo-100 rounded-full px-2 py-0.5">
                        <Text className="text-indigo-800 text-xs font-rubik-medium">Admin</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Pending Doctor Requests */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">Pending Doctor Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/requests')}>
              <Text className="text-indigo-600 font-rubik-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          {pendingRequests.length === 0 ? (
            <View className="bg-white rounded-xl p-6 shadow-sm items-center">
              <Ionicons name="checkmark-circle" size={40} color="#10b981" />
              <Text className="text-gray-800 mt-2 font-rubik-medium">No pending requests</Text>
              <Text className="text-gray-500 text-center mt-1 font-rubik">
                All doctor requests have been processed
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {pendingRequests.map((request, index) => (
                <TouchableOpacity 
                  key={request.id}
                  onPress={() => router.push({
                    pathname: '/(admin)/request-details',
                    params: { id: request.id }
                  })}
                  className={`p-4 ${
                    index < pendingRequests.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="h-8 w-8 rounded-full bg-amber-100 items-center justify-center mr-2">
                      {request.profiles?.avatar_url ? (
                        <Image 
                          source={{ uri: request.profiles.avatar_url }} 
                          className="h-8 w-8 rounded-full" 
                        />
                      ) : (
                        <Ionicons name="person" size={16} color="#f59e0b" />
                      )}
                    </View>
                    <Text className="text-gray-800 font-rubik-medium flex-1">
                      {request.profiles?.full_name || 'User'}
                    </Text>
                    <View className="bg-amber-100 rounded-full px-2 py-0.5">
                      <Text className="text-amber-800 text-xs font-rubik-medium">Pending</Text>
                    </View>
                  </View>
                  
                  <Text className="text-gray-600 font-rubik text-sm mb-1" numberOfLines={2}>
                    {request.reason || 'No reason provided'}
                  </Text>
                  
                  <Text className="text-gray-500 text-xs font-rubik">
                    {new Date(request.created_at).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}