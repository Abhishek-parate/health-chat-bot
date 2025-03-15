// app/(admin)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, Image, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  ProfileService, 
  ConversationService,
  MessageService
} from '@/lib/supabaseService';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalConversations: 0,
    pendingRequests: 0
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);
  
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading admin profile data');
      
      // Get admin profile
      const profile = await ProfileService.getProfile(user.id);
      console.log('Admin profile:', profile);
      setAdminProfile(profile);
      
      // Fetch users by role
      const users = await ProfileService.getAllUsers();
      const doctors = await ProfileService.getUsersByRole('doctor');
      
      // Fetch all conversations
      const conversations = await ConversationService.getAllConversations();
      
      // Set metrics
      setMetrics({
        totalUsers: users.filter(u => u.role === 'user').length,
        totalDoctors: doctors.length,
        totalConversations: conversations.length,
        pendingRequests: 0 // This would need to be fetched from DoctorRequestService
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isLoggingOut) return;
              setIsLoggingOut(true);
              
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error during logout:', error);
              router.replace('/(auth)/login');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };
  
  const settingsOptions = [
    {
      icon: 'notifications',
      title: 'Notifications',
      description: 'Get system alerts and updates',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled
    },
    {
      icon: 'shield-checkmark',
      title: 'Privacy Policy',
      description: 'How we protect your data',
      type: 'link',
      onPress: () => router.push('/privacy-policy')
    },
    {
      icon: 'document-text',
      title: 'Terms of Service',
      description: 'User agreement',
      type: 'link',
      onPress: () => router.push('/terms')
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      description: 'Get assistance',
      type: 'link',
      onPress: () => router.push('/support')
    },
    {
      icon: 'information-circle',
      title: 'About',
      description: 'App version 1.0.0',
      type: 'link',
      onPress: () => router.push('/about')
    },
  ];
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading admin profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-6 pb-6 px-5 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-rubik-bold text-white">Admin Profile</Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/dashboard')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="grid-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Admin Profile Summary */}
        <View className="flex-row items-center bg-white/10 rounded-xl p-4 backdrop-blur-lg">
          <View className="bg-white w-16 h-16 rounded-full items-center justify-center">
            {adminProfile?.avatar_url ? (
              <Image 
                source={{ uri: adminProfile.avatar_url }} 
                className="w-16 h-16 rounded-full" 
              />
            ) : (
              <Text className="text-2xl font-rubik-bold text-indigo-600">
                {adminProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </Text>
            )}
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-xl font-rubik-bold text-white">
              {adminProfile?.full_name || 'Administrator'}
            </Text>
            <Text className="text-white/80 font-rubik">{user?.email}</Text>
            
            {/* Admin badge */}
            <View className="mt-1">
              <View className="px-3 py-1 rounded-full self-start bg-indigo-100">
                <Text className="text-xs font-rubik-medium text-indigo-800">Administrator</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/edit-profile')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="pencil" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-5 pt-6">
        {/* Metrics Overview - Admin metrics */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[48%]">
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mb-2">
              <Ionicons name="people" size={20} color="#4f46e5" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.totalUsers}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Total Patients</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[48%]">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="medkit" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.totalDoctors}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Total Doctors</Text>
          </View>
        </View>
        
        <View className="flex-row justify-between mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[48%]">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#3b82f6" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.totalConversations}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Total Consultations</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[48%]">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="hourglass" size={20} color="#f59e0b" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.pendingRequests}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Pending Requests</Text>
          </View>
        </View>
        
        {/* Admin-specific quick actions */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Admin Actions</Text>
          
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              onPress={() => router.push('/dashboard')}
              className="bg-indigo-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="home-outline" size={24} color="#4f46e5" />
              <Text className="text-indigo-700 font-rubik-medium mt-1">Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/users')}
              className="bg-indigo-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="people-outline" size={24} color="#4f46e5" />
              <Text className="text-indigo-700 font-rubik-medium mt-1">Manage Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/doctors')}
              className="bg-indigo-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="medkit-outline" size={24} color="#4f46e5" />
              <Text className="text-indigo-700 font-rubik-medium mt-1">Manage Doctors</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/requests')}
              className="bg-indigo-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="list-outline" size={24} color="#4f46e5" />
              <Text className="text-indigo-700 font-rubik-medium mt-1">Doctor Requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/health-topics')}
              className="bg-indigo-50 rounded-xl p-3 w-[48%]"
            >
              <Ionicons name="information-circle-outline" size={24} color="#4f46e5" />
              <Text className="text-indigo-700 font-rubik-medium mt-1">Health Topics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/system-logs')}
              className="bg-indigo-50 rounded-xl p-3 w-[48%]"
            >
              <Ionicons name="analytics-outline" size={24} color="#4f46e5" />
              <Text className="text-indigo-700 font-rubik-medium mt-1">System Logs</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Settings Categories */}
        <View className="mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4 px-1">Settings</Text>
          
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {settingsOptions.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.type === 'link' ? item.onPress : undefined}
                className={`flex-row items-center justify-between p-4 ${
                  index < settingsOptions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Ionicons name={item.icon} size={18} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-rubik-medium">{item.title}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5 font-rubik">{item.description}</Text>
                  </View>
                </View>
                
                {item.type === 'toggle' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                    thumbColor={item.value ? '#4f46e5' : '#f1f5f9'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          className={`bg-white rounded-xl py-4 shadow-sm mb-10 flex-row items-center justify-center ${
            isLoggingOut ? 'opacity-70' : ''
          }`}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-rubik-medium ml-2">
            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}