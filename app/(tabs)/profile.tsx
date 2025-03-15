// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// Import useAuth from Supabase implementation
import { useAuth } from '@/contexts/AuthProvider'; 

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get user profile data from Supabase user
  const getUserProfileData = () => {
    if (!user) return { fullName: 'User', email: 'user@example.com', imageUrl: null, isAdmin: false };
    
    const fullName = user.user_metadata?.full_name || 'User';
    const email = user.email || 'user@example.com';
    const imageUrl = user.user_metadata?.avatar_url || null;
    // You can set custom criteria for admin users
    const isAdmin = user.email === 'admin@example.com' || user.role === 'admin';
    
    return { fullName, email, imageUrl, isAdmin };
  };
  
  const profileData = getUserProfileData();
  
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
              // Prevent multiple logout attempts
              if (isLoggingOut) return;
              
              setIsLoggingOut(true);
              
              // Direct navigation if user is not signed in
              if (!isAuthenticated) {
                console.log('User is already signed out, redirecting to login');
                router.replace('/(auth)/login');
                return;
              }
              
              // Logout with Supabase
              await logout();
              console.log('Successfully signed out');
              
              // Redirect to login
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('An unexpected error occurred during logout:', error);
              
              // Still redirect to login if there's any error
              router.replace('/(auth)/login');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };
  
  // If user is not signed in, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);
  
  const settingsOptions = [
    {
      icon: 'moon',
      title: 'Dark Mode',
      description: 'Switch to dark theme',
      type: 'toggle',
      value: darkMode,
      onToggle: setDarkMode,
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      description: 'Get updates and reminders',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      icon: 'analytics',
      title: 'Health Insights',
      description: 'Personalized recommendations',
      type: 'toggle',
      value: dataSharingEnabled,
      onToggle: setDataSharingEnabled,
    },
    {
      icon: 'shield-checkmark',
      title: 'Privacy Policy',
      description: 'How we protect your data',
      type: 'link',
      onPress: () => router.push('/privacy-policy'),
    },
    {
      icon: 'document-text',
      title: 'Terms of Service',
      description: 'User agreement',
      type: 'link',
      onPress: () => router.push('/terms'),
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      description: 'Get assistance',
      type: 'link',
      onPress: () => router.push('/support'),
    },
    {
      icon: 'information-circle',
      title: 'About',
      description: 'App information and version',
      type: 'link',
      onPress: () => router.push('/about'),
    },
  ];

  // Render loading state if no user data yet
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="font-rubik">Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-rubik-bold text-white">Profile</Text>
          <TouchableOpacity 
            onPress={() => Alert.alert('Settings', 'Additional profile settings would appear here')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="settings-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* User Profile Summary */}
        <View className="flex-row items-center bg-white/10 rounded-xl p-4 backdrop-blur-lg">
          <View className="bg-white w-16 h-16 rounded-full items-center justify-center">
            {profileData.imageUrl ? (
              <Image 
                source={{ uri: profileData.imageUrl }} 
                className="w-16 h-16 rounded-full" 
              />
            ) : (
              <Text className="text-2xl font-rubik-bold text-indigo-600">
                {profileData.fullName.charAt(0) || profileData.email.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-xl font-rubik-bold text-white">{profileData.fullName}</Text>
            <Text className="text-white/80 font-rubik">{profileData.email}</Text>
            
            {profileData.isAdmin && (
              <View className="bg-white/20 px-3 py-1 rounded-full mt-1 self-start">
                <Text className="text-white text-xs font-rubik-medium">Admin</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => Alert.alert('Edit Profile', 'This feature would allow editing profile details.')}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="pencil" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-5 pt-6">
        {/* Stats Overview */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mb-2">
              <Ionicons name="calendar" size={20} color="#4f46e5" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">28</Text>
            <Text className="text-gray-500 text-xs font-rubik">Days Active</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">13</Text>
            <Text className="text-gray-500 text-xs font-rubik">Conversations</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="star" size={20} color="#f59e0b" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">4.9</Text>
            <Text className="text-gray-500 text-xs font-rubik">Rating</Text>
          </View>
        </View>
        
        {/* Admin Panel (for admin users only) */}
        {profileData.isAdmin && (
          <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-100 p-3 rounded-full mr-3">
                <Ionicons name="shield" size={20} color="#4f46e5" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800">Admin Tools</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <TouchableOpacity
                onPress={() => router.push('/admin/users')}
                className="bg-white border border-indigo-200 rounded-xl py-3 px-4 w-[48%] shadow-sm"
              >
                <Ionicons name="people" size={22} color="#4f46e5" />
                <Text className="text-indigo-700 font-rubik-medium mt-1">Manage Users</Text>
                <Text className="text-gray-500 text-xs mt-1 font-rubik">24 active users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => Alert.alert('Health Content', 'Admin would manage health content here.')}
                className="bg-white border border-indigo-200 rounded-xl py-3 px-4 w-[48%] shadow-sm"
              >
                <Ionicons name="document-text" size={22} color="#4f46e5" />
                <Text className="text-indigo-700 font-rubik-medium mt-1">Content</Text>
                <Text className="text-gray-500 text-xs mt-1 font-rubik">48 topics</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => Alert.alert('Analytics', 'View app analytics and metrics.')}
              className="bg-indigo-600 rounded-xl py-3 px-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-rubik-medium">View Analytics</Text>
                  <Text className="text-white/70 text-xs mt-1 font-rubik">User activity, engagement, and more</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Settings Categories */}
        <View className="mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4 px-1">Settings</Text>
          
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            {settingsOptions.slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.type === 'link' ? item.onPress : undefined}
                className={`flex-row items-center justify-between p-4 ${
                  index < settingsOptions.slice(0, 3).length - 1 ? 'border-b border-gray-100' : ''
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
          
          {/* Legal & Support */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {settingsOptions.slice(3).map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                className={`flex-row items-center justify-between p-4 ${
                  index < settingsOptions.slice(3).length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name={item.icon} size={18} color="#6b7280" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-rubik-medium">{item.title}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5 font-rubik">{item.description}</Text>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
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
    </>
  );
}