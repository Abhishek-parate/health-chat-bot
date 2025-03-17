// app/(tabs)/profile.tsx - User/Patient profile
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, Image, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  ProfileService, 
  ConversationService, 
  MessageService,
  DoctorRequestService 
} from '@/lib/supabaseService';

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    conversationCount: 0,
    messageCount: 0,
    daysActive: 0,
    doctorConsultations: 0
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [doctorRequests, setDoctorRequests] = useState([]);
  
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading user profile data');
      
      // Get user profile
      const profile = await ProfileService.getProfile(user.id);
      console.log('User profile:', profile);
      setUserProfile(profile);
      
      // Check user role
      if (profile && profile.role !== 'user') {
        // Redirect to appropriate profile screen for non-patients
        if (profile.role === 'doctor') {
          console.log('Redirecting to doctor profile');
          router.replace('/(doctor)/profile');
          return;
        } else if (profile.role === 'admin') {
          console.log('Redirecting to admin profile');
          router.replace('/(admin)/profile');
          return;
        }
      }
      
      // Calculate days active
      const createdAt = new Date(profile?.created_at || user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now - createdAt);
      const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Fetch user conversations
      const conversations = await ConversationService.getUserConversations(user.id);
      console.log(`Retrieved ${conversations.length} user conversations`);
      
      // Count messages and doctor consultations
      let totalMessages = 0;
      let doctorConsultations = 0;
      
      for (const conversation of conversations) {
        const { count } = await MessageService.getMessageCount(conversation.id);
        totalMessages += count;
        
        if (conversation.is_doctor_chat) {
          doctorConsultations++;
        }
      }
      
      // Get doctor requests
      const requests = await DoctorRequestService.getUserRequests(user.id);
      setDoctorRequests(requests);
      
      // Set metrics
      setMetrics({
        conversationCount: conversations.length,
        messageCount: totalMessages,
        daysActive: daysActive,
        doctorConsultations: doctorConsultations
      });
    } catch (error) {
      console.error('Error loading user data:', error);
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
      description: 'Get updates and reminders',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled
    },
    {
      icon: 'analytics',
      title: 'Health Insights',
      description: 'Personalized recommendations',
      type: 'toggle',
      value: dataSharingEnabled,
      onToggle: setDataSharingEnabled
    },
    {
      icon: 'shield-checkmark',
      title: 'Privacy Policy',
      description: 'How we protect your data',
      type: 'link',
    },
    {
      icon: 'document-text',
      title: 'Terms of Service',
      description: 'User agreement',
      type: 'link',
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      description: 'Get assistance',
      type: 'link',
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
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5"
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-rubik-bold text-white">My Profile</Text>
        </View>
        
        {/* User Profile Summary */}
        <View className="flex-row items-center bg-white/10 rounded-xl p-4 backdrop-blur-lg">
          <View className="bg-white w-16 h-16 rounded-full items-center justify-center">
            {userProfile?.avatar_url ? (
              <Image 
                source={{ uri: userProfile.avatar_url }} 
                className="w-16 h-16 rounded-full" 
              />
            ) : (
              <Text className="text-2xl font-rubik-bold text-blue-600">
                {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-xl font-rubik-bold text-white">
              {userProfile?.full_name || 'User'}
            </Text>
            <Text className="text-white/80 font-rubik">{user?.email}</Text>
            
            {/* Phone verification status */}
            {userProfile?.phone_number && (
              <View className="flex-row items-center mt-1">
                <Ionicons 
                  name={userProfile.phone_verified ? "checkmark-circle" : "alert-circle"} 
                  size={14} 
                  color={userProfile.phone_verified ? "#d1fae5" : "#fef3c7"} 
                />
                <Text className="text-white/90 font-rubik text-xs ml-1">
                  {userProfile.phone_verified ? "Phone verified" : "Phone not verified"}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/edit-profile')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="pencil" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Use contentContainerStyle to add padding at the bottom for tab bar */}
      <ScrollView 
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }} // Add extra padding at bottom to avoid tab overlap
      >
        {/* Metrics Overview */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="calendar" size={20} color="#3b82f6" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.daysActive}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Days Active</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.conversationCount}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Chats</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="medkit" size={20} color="#f59e0b" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.doctorConsultations}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Consultations</Text>
          </View>
        </View>
        
        {/* Doctor Request Status */}
        {doctorRequests.length > 0 && doctorRequests.some(r => r.status === 'pending') && (
          <View className="bg-amber-50 p-4 rounded-xl mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="hourglass" size={22} color="#f59e0b" />
              <Text className="text-amber-800 font-rubik-medium ml-2">Doctor Request Pending</Text>
            </View>
            <Text className="text-amber-700 font-rubik text-sm">
              Your request to speak with a doctor is being processed. A healthcare professional will be assigned to you shortly.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/doctor-request',
                params: { id: doctorRequests.find(r => r.status === 'pending').id }
              })}
              className="bg-amber-100 py-2 rounded-lg items-center mt-3"
            >
              <Text className="text-amber-800 font-rubik-medium">View Request Status</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Quick actions */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              onPress={() => router.push('/chat')}
              className="bg-blue-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="chatbubbles-outline" size={24} color="#3b82f6" />
              <Text className="text-blue-700 font-rubik-medium mt-1">New Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/conversations')}
              className="bg-blue-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="list-outline" size={24} color="#3b82f6" />
              <Text className="text-blue-700 font-rubik-medium mt-1">My Conversations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/request-doctor')}
              className="bg-blue-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="medkit-outline" size={24} color="#3b82f6" />
              <Text className="text-blue-700 font-rubik-medium mt-1">Request Doctor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/health-topics')}
              className="bg-blue-50 rounded-xl p-3 w-[48%] mb-4"
            >
              <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
              <Text className="text-blue-700 font-rubik-medium mt-1">Health Topics</Text>
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
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name={item.icon} size={18} color="#3b82f6" />
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
                    trackColor={{ false: '#e2e8f0', true: '#dbeafe' }}
                    thumbColor={item.value ? '#3b82f6' : '#f1f5f9'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Logout Button - ensure it's not hidden behind tab bar */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          className={`bg-white rounded-xl py-4 shadow-sm flex-row items-center justify-center mb-4 ${
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