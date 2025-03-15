// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider'; // Updated import for Supabase authentication
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Get user from Supabase auth context
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);
  
  const healthTopics = [
    { id: '1', title: 'Nutrition', icon: '🍎', color: '#10b981', gradient: ['#0bab6c', '#07bc8b'] },
    { id: '2', title: 'Exercise', icon: '🏃', color: '#f59e0b', gradient: ['#f59e0b', '#f7b045'] },
    { id: '3', title: 'Mental Health', icon: '🧠', color: '#8b5cf6', gradient: ['#8b5cf6', '#a78bfa'] },
    { id: '4', title: 'Sleep', icon: '😴', color: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] },
    { id: '5', title: 'Heart Health', icon: '❤️', color: '#ef4444', gradient: ['#ef4444', '#f87171'] },
    { id: '6', title: 'Hydration', icon: '💧', color: '#06b6d4', gradient: ['#06b6d4', '#22d3ee'] },
  ];

  const healthTips = [
    {
      title: "Stay Hydrated",
      description: "Aim for 8 glasses of water daily to maintain optimal health and energy levels.",
      icon: "💧",
      color: "#06b6d4",
      topic: "Hydration"
    },
    {
      title: "Mental Wellness Break",
      description: "Take 5 minutes each day for mindfulness meditation to reduce stress and improve focus.",
      icon: "🧘",
      color: "#8b5cf6",
      topic: "Mindfulness"
    },
    {
      title: "Nutritional Balance",
      description: "Fill half your plate with colorful vegetables at each meal for essential nutrients.",
      icon: "🥗",
      color: "#10b981",
      topic: "Nutrition"
    }
  ];

  // Get the user's first name from Supabase user metadata or user_metadata
  const getUserName = () => {
    if (!user) return 'there';
    
    // Try to get name from user metadata (set during signup)
    if (user.user_metadata && user.user_metadata.full_name) {
      // Split the full name and return the first part
      return user.user_metadata.full_name.split(' ')[0];
    }
    
    // Fallback to email if no name is available
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'there';
  };

  const firstName = getUserName();

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-lg font-rubik-medium">{greeting},</Text>
            <Text className="text-white text-2xl font-rubik-bold">
              {firstName}
            </Text>
          </View>
          <TouchableOpacity className="bg-white/20 p-2 rounded-full">
            <Ionicons name="notifications" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View className="bg-white mt-4 rounded-2xl p-4 shadow-xl">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
              <Text className="text-2xl">🩺</Text>
            </View>
            <View className="flex-1">
              <Text className="font-rubik-bold text-lg text-gray-800">Health Assistant</Text>
              <Text className="text-gray-600 font-rubik">How can I help you today?</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/chat')}
              className="bg-indigo-600 h-10 w-10 rounded-full items-center justify-center"
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 bg-gray-50 px-5 pt-6">
        {/* Health metrics summary */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-rubik-bold text-gray-800">Your Health</Text>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-rubik-medium">View all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-4 pb-2">
              <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm w-32 items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
                  <Ionicons name="heart" size={20} color="#3b82f6" />
                </View>
                <Text className="text-2xl font-rubik-bold text-gray-800">72</Text>
                <Text className="text-gray-500 text-sm font-rubik">Heart Rate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm w-32 items-center">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mb-2">
                  <Ionicons name="footsteps" size={20} color="#10b981" />
                </View>
                <Text className="text-2xl font-rubik-bold text-gray-800">8,546</Text>
                <Text className="text-gray-500 text-sm font-rubik">Steps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm w-32 items-center">
                <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mb-2">
                  <Ionicons name="bed" size={20} color="#8b5cf6" />
                </View>
                <Text className="text-2xl font-rubik-bold text-gray-800">7.5h</Text>
                <Text className="text-gray-500 text-sm font-rubik">Sleep</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm w-32 items-center">
                <View className="w-10 h-10 rounded-full bg-cyan-100 items-center justify-center mb-2">
                  <Ionicons name="water" size={20} color="#06b6d4" />
                </View>
                <Text className="text-2xl font-rubik-bold text-gray-800">1.2L</Text>
                <Text className="text-gray-500 text-sm font-rubik">Hydration</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        
        {/* Quick actions */}
        <View className="mb-8">
          <Text className="text-xl font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/chat')}
              className="bg-white rounded-xl shadow-sm p-3 items-center w-[30%]"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-2">
                <Ionicons name="chatbubbles" size={24} color="#4f46e5" />
              </View>
              <Text className="text-gray-800 font-rubik-medium text-sm">Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-white rounded-xl shadow-sm p-3 items-center w-[30%]">
              <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-2">
                <Ionicons name="calendar" size={24} color="#f59e0b" />
              </View>
              <Text className="text-gray-800 font-rubik-medium text-sm">Reminders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-white rounded-xl shadow-sm p-3 items-center w-[30%]">
              <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2">
                <Ionicons name="fitness" size={24} color="#10b981" />
              </View>
              <Text className="text-gray-800 font-rubik-medium text-sm">Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Health Topics */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-rubik-bold text-gray-800">Health Topics</Text>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-rubik-medium">See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <View className="flex-row space-x-4">
              {healthTopics.map(topic => (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/chat',
                      params: { topic: topic.title }
                    });
                  }}
                >
                  <LinearGradient
                    colors={topic.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-36 h-36 rounded-2xl p-4 justify-between"
                  >
                    <Text className="text-3xl">{topic.icon}</Text>
                    <View>
                      <Text className="text-white font-rubik-bold text-lg">{topic.title}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-white text-xs opacity-80 font-rubik">Learn more</Text>
                        <Ionicons name="arrow-forward" size={12} color="white" style={{ opacity: 0.8, marginLeft: 4 }} />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Health Tips */}
        <View className="mb-8">
          <Text className="text-xl font-rubik-bold text-gray-800 mb-4">Daily Health Tips</Text>
          
          {healthTips.map((tip, index) => (
            <TouchableOpacity 
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 mb-4"
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/chat',
                  params: { topic: tip.topic }
                });
              }}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${tip.color}20` }}
                >
                  <Text className="text-2xl">{tip.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-rubik-bold text-gray-800 text-lg">{tip.title}</Text>
                  <Text className="text-gray-600 font-rubik">{tip.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4f46e5" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Community Support */}
        <View className="mb-8">
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl p-5"
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white font-rubik-bold text-xl mb-2">Join Our Health Community</Text>
                <Text className="text-white opacity-90 mb-4 font-rubik">Connect with others on your wellness journey</Text>
                <TouchableOpacity className="bg-white self-start py-2 px-4 rounded-lg">
                  <Text className="text-blue-600 font-rubik-bold">Join Now</Text>
                </TouchableOpacity>
              </View>
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                <Ionicons name="people" size={32} color="white" />
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </>
  );
}