// app/(doctor)/profile.tsx - with fixed logout button
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

export default function DoctorProfileScreen() {
  // ... existing state and hooks ...
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    conversationCount: 0,
    messageCount: 0,
    patientCount: 0,
    daysActive: 0
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // ... existing loadDoctorData function and useEffect ...
  useEffect(() => {
    if (user) {
      loadDoctorData();
    }
  }, [user]);
  
  const loadDoctorData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading doctor profile data');
      
      // Get doctor profile
      const profile = await ProfileService.getProfile(user.id);
      console.log('Doctor profile:', profile);
      setDoctorProfile(profile);
      
      // Calculate days active
      const createdAt = new Date(profile?.created_at || user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now - createdAt);
      const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Fetch conversations
      const conversations = await ConversationService.getDoctorConversations(user.id);
      console.log(`Retrieved ${conversations.length} doctor conversations`);
      
      // Get unique patient count
      const uniquePatients = new Set(conversations.map(c => c.user_id));
      
      // Count messages
      let totalMessages = 0;
      for (const conversation of conversations) {
        const { count } = await MessageService.getMessageCount(conversation.id);
        totalMessages += count;
      }
      
      // Set metrics
      setMetrics({
        conversationCount: conversations.length,
        messageCount: totalMessages,
        patientCount: uniquePatients.size,
        daysActive: daysActive
      });
    } catch (error) {
      console.error('Error loading doctor data:', error);
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
      description: 'Get updates about your patients',
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
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading doctor profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-6 pb-6 px-5 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-rubik-bold text-white">Doctor Profile</Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/dashboard')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="grid-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Doctor Profile Summary */}
        <View className="flex-row items-center bg-white/10 rounded-xl p-4 backdrop-blur-lg">
          <View className="bg-white w-16 h-16 rounded-full items-center justify-center">
            {doctorProfile?.avatar_url ? (
              <Image 
                source={{ uri: doctorProfile.avatar_url }} 
                className="w-16 h-16 rounded-full" 
              />
            ) : (
              <Text className="text-2xl font-rubik-bold text-emerald-600">
                {doctorProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'D'}
              </Text>
            )}
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-xl font-rubik-bold text-white">
              {doctorProfile?.full_name || 'Doctor'}
            </Text>
            <Text className="text-white/80 font-rubik">{user?.email}</Text>
            
            {/* Specialty */}
            {doctorProfile?.specialty && (
              <Text className="text-white/90 font-rubik text-sm mt-0.5">
                {doctorProfile.specialty}
              </Text>
            )}
            
            {/* Doctor badge */}
            <View className="mt-1">
              <View className="px-3 py-1 rounded-full self-start bg-emerald-100">
                <Text className="text-xs font-rubik-medium text-emerald-800">Doctor</Text>
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
      
      <View className="flex-1">
        {/* Main ScrollView - with paddingBottom to ensure logout button is visible */}
        <ScrollView 
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 100 }} // Add padding at the bottom to ensure everything is visible
        >
          {/* Metrics Overview - Real metrics */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[23%]">
              <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mb-2">
                <Ionicons name="people" size={16} color="#10b981" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800">{metrics.patientCount}</Text>
              <Text className="text-gray-500 text-xs font-rubik">Patients</Text>
            </View>
            
            <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[23%]">
              <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mb-2">
                <Ionicons name="calendar" size={16} color="#4f46e5" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800">{metrics.daysActive}</Text>
              <Text className="text-gray-500 text-xs font-rubik">Days</Text>
            </View>
            
            <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[23%]">
              <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mb-2">
                <Ionicons name="chatbubbles" size={16} color="#10b981" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800">{metrics.conversationCount}</Text>
              <Text className="text-gray-500 text-xs font-rubik">Consults</Text>
            </View>
            
            <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[23%]">
              <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center mb-2">
                <Ionicons name="chatbubble" size={16} color="#f59e0b" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800">{metrics.messageCount}</Text>
              <Text className="text-gray-500 text-xs font-rubik">Messages</Text>
            </View>
          </View>
          
          {/* Doctor-specific quick actions */}
          <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
            
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity 
                onPress={() => router.push('/dashboard')}
                className="bg-emerald-50 rounded-xl p-3 w-[48%] mb-4"
              >
                <Ionicons name="home-outline" size={24} color="#10b981" />
                <Text className="text-emerald-700 font-rubik-medium mt-1">Dashboard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/conversations')}
                className="bg-emerald-50 rounded-xl p-3 w-[48%] mb-4"
              >
                <Ionicons name="chatbubbles-outline" size={24} color="#10b981" />
                <Text className="text-emerald-700 font-rubik-medium mt-1">Consultations</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/patients')}
                className="bg-emerald-50 rounded-xl p-3 w-[48%] mb-4"
              >
                <Ionicons name="people-outline" size={24} color="#10b981" />
                <Text className="text-emerald-700 font-rubik-medium mt-1">My Patients</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/schedule')}
                className="bg-emerald-50 rounded-xl p-3 w-[48%] mb-4"
              >
                <Ionicons name="calendar-outline" size={24} color="#10b981" />
                <Text className="text-emerald-700 font-rubik-medium mt-1">Availability</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/requests')}
                className="bg-emerald-50 rounded-xl p-3 w-[48%]"
              >
                <Ionicons name="notifications-outline" size={24} color="#10b981" />
                <Text className="text-emerald-700 font-rubik-medium mt-1">Requests</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/guidelines')}
                className="bg-emerald-50 rounded-xl p-3 w-[48%]"
              >
                <Ionicons name="information-circle-outline" size={24} color="#10b981" />
                <Text className="text-emerald-700 font-rubik-medium mt-1">Guidelines</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Doctor Info */}
          {doctorProfile && (
            <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
              <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Professional Info</Text>
              
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-rubik mb-1">Specialty</Text>
                <Text className="text-gray-800 font-rubik-medium">
                  {doctorProfile.specialty || 'Not specified'}
                </Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-rubik mb-1">Experience</Text>
                <Text className="text-gray-800 font-rubik-medium">
                  {doctorProfile.years_experience ? `${doctorProfile.years_experience} years` : 'Not specified'}
                </Text>
              </View>
              
              {doctorProfile.bio && (
                <View className="mb-4">
                  <Text className="text-gray-500 text-sm font-rubik mb-1">Bio</Text>
                  <Text className="text-gray-800 font-rubik">{doctorProfile.bio}</Text>
                </View>
              )}
              
              {doctorProfile.website && (
                <View>
                  <Text className="text-gray-500 text-sm font-rubik mb-1">Website</Text>
                  <Text className="text-indigo-600 font-rubik">{doctorProfile.website}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                onPress={() => router.push('/edit-profile')}
                className="bg-emerald-100 py-2 rounded-lg items-center mt-3"
              >
                <Text className="text-emerald-700 font-rubik-medium">Edit Professional Info</Text>
              </TouchableOpacity>
            </View>
          )}
          
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
                    <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                      <Ionicons name={item.icon} size={18} color="#10b981" />
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
                      trackColor={{ false: '#e2e8f0', true: '#d1fae5' }}
                      thumbColor={item.value ? '#10b981' : '#f1f5f9'}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Logout Button inside ScrollView */}
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
        
        {/* Alternative: Fixed Logout Button outside ScrollView */}
        {/* Uncomment this and remove the one in ScrollView if you prefer a fixed button */}
        {/*
        <View className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoggingOut}
            className={`bg-white rounded-xl py-4 shadow-sm flex-row items-center justify-center ${
              isLoggingOut ? 'opacity-70' : ''
            }`}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-rubik-medium ml-2">
              {isLoggingOut ? 'Logging Out...' : 'Log Out'}
            </Text>
          </TouchableOpacity>
        </View>
        */}
      </View>
    </SafeAreaView>
  );
}