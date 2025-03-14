
// app/admin/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/ui/Card';
import { getUserById } from '../../lib/api';
import { User } from '../../types';

export default function AdminDashboard() {
  const router = useRouter();
  const { userId } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (userId) {
      getUserById(userId).then(userData => {
        setUser(userData);
        setLoading(false);
        
        // Redirect if not admin
        if (userData && userData.role !== 'admin') {
          router.replace('/chat');
        }
      }).catch(error => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      });
    }
  }, [userId, router]);
  
  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header title="Admin Dashboard" showBackButton />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </View>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return (
      <View className="flex-1 bg-background">
        <Header title="Unauthorized" showBackButton />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-center text-gray-500">
            You don't have permission to access the admin dashboard.
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-background">
      <Header title="Admin Dashboard" showBackButton />
      
      <View className="p-4">
        <Text className="text-xl font-semibold mb-4">Admin Controls</Text>
        
        <TouchableOpacity onPress={() => router.push('/admin/users')}>
          <Card className="mb-3 p-4 flex-row items-center">
            <Ionicons name="people-outline" size={24} color="#4F46E5" />
            <View className="ml-3">
              <Text className="font-medium text-lg">Manage Users</Text>
              <Text className="text-gray-500">View and manage user accounts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4F46E5" className="ml-auto" />
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/chat')}>
          <Card className="mb-3 p-4 flex-row items-center">
            <Ionicons name="chatbubbles-outline" size={24} color="#4F46E5" />
            <View className="ml-3">
              <Text className="font-medium text-lg">Return to Chat</Text>
              <Text className="text-gray-500">Go back to the chat interface</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4F46E5" className="ml-auto" />
          </Card>
        </TouchableOpacity>
      </View>
    </View>
  );
}