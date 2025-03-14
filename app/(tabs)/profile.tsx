// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// Import useAuth from your Clerk implementation
import { useAuth } from '@/lib/clerk'; // Update path if needed

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, isLoading, isSignedIn } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
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
              if (!isSignedIn) {
                console.log('User is already signed out, redirecting to login');
                router.replace('/(auth)/login');
                return;
              }
              
              // Use try/catch block with SecureStore to clear tokens first
              // This avoids the "You are signed out" error
              try {
                // Import for local use to avoid importing at the top level
                const SecureStore = require('expo-secure-store');
                
                // Define known Clerk token keys that need to be cleared
                const knownClerkKeys = [
                  'clerk-js-session',
                  'clerk-frontend-api',
                  'clerk-session-id',
                  '__clerk_client_jwt',
                  'clerk_session_token'
                ];
                
                // Delete all known Clerk-related tokens
                for (const key of knownClerkKeys) {
                  await SecureStore.deleteItemAsync(key).catch(() => {
                    // Ignore errors when clearing tokens
                  });
                }
                
                console.log('Cleared auth tokens');
              } catch (e) {
                // Ignore token clearing errors
              }
              
              // Silent attempt to sign out
              try {
                await signOut();
                console.log('Successfully signed out');
              } catch (e) {
                // Ignore any errors from signOut
                // We've already cleared the tokens
              }
              
              // Redirect to login regardless of signOut result
              console.log('Redirecting to login screen');
              router.replace('/(auth)/login');
            } catch (error) {
              console.log('An unexpected error occurred during logout');
              
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
    if (!isLoading && !isSignedIn) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isSignedIn, router]);
  
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

  // Render loading state if still loading
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading profile...</Text>
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
          <Text className="text-2xl font-bold text-white">Profile</Text>
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
            {user?.imageUrl ? (
              <Image 
                source={{ uri: user.imageUrl }} 
                className="w-16 h-16 rounded-full" 
              />
            ) : (
              <Text className="text-2xl font-bold text-indigo-600">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-white">{user?.fullName || user?.username || 'User'}</Text>
            <Text className="text-white/80">{user?.email || 'user@example.com'}</Text>
            
            {user?.id === 'admin-id' && (
              <View className="bg-white/20 px-3 py-1 rounded-full mt-1 self-start">
                <Text className="text-white text-xs font-medium">Admin</Text>
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
            <Text className="text-xl font-bold text-gray-800">28</Text>
            <Text className="text-gray-500 text-xs">Days Active</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-bold text-gray-800">13</Text>
            <Text className="text-gray-500 text-xs">Conversations</Text>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm items-center w-[31%]">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="star" size={20} color="#f59e0b" />
            </View>
            <Text className="text-xl font-bold text-gray-800">4.9</Text>
            <Text className="text-gray-500 text-xs">Rating</Text>
          </View>
        </View>
        
        {/* Admin Panel (for admin users only) */}
        {user?.id === 'admin-id' && (
          <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-indigo-100 p-3 rounded-full mr-3">
                <Ionicons name="shield" size={20} color="#4f46e5" />
              </View>
              <Text className="text-lg font-bold text-gray-800">Admin Tools</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <TouchableOpacity
                onPress={() => router.push('/admin/users')}
                className="bg-white border border-indigo-200 rounded-xl py-3 px-4 w-[48%] shadow-sm"
              >
                <Ionicons name="people" size={22} color="#4f46e5" />
                <Text className="text-indigo-700 font-medium mt-1">Manage Users</Text>
                <Text className="text-gray-500 text-xs mt-1">24 active users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => Alert.alert('Health Content', 'Admin would manage health content here.')}
                className="bg-white border border-indigo-200 rounded-xl py-3 px-4 w-[48%] shadow-sm"
              >
                <Ionicons name="document-text" size={22} color="#4f46e5" />
                <Text className="text-indigo-700 font-medium mt-1">Content</Text>
                <Text className="text-gray-500 text-xs mt-1">48 topics</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => Alert.alert('Analytics', 'View app analytics and metrics.')}
              className="bg-indigo-600 rounded-xl py-3 px-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-medium">View Analytics</Text>
                  <Text className="text-white/70 text-xs mt-1">User activity, engagement, and more</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Settings Categories */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4 px-1">Settings</Text>
          
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
                    <Text className="text-gray-800 font-medium">{item.title}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{item.description}</Text>
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
                    <Text className="text-gray-800 font-medium">{item.title}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{item.description}</Text>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Logout Button - Updated for better visual feedback */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          className={`bg-white rounded-xl py-4 shadow-sm mb-10 flex-row items-center justify-center ${
            isLoggingOut ? 'opacity-70' : ''
          }`}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-medium ml-2">
            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}