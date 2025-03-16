// app/(tabs)/insights.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
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
import UserGreeting from '@/components/UserGreeting';

export default function InsightsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    conversationCount: 0,
    messageCount: 0,
    daysActive: 0,
    doctorConsultations: 0,
    averageMessagesPerDay: 0
  });
  
  // Mock health data - in a real app, this would come from a health API or database
  const [healthData, setHealthData] = useState({
    heartRate: 72,
    steps: 8546,
    sleep: 7.5,
    hydration: 1.2,
    weeklyActivity: [
      { day: 'Mon', value: 65 },
      { day: 'Tue', value: 75 },
      { day: 'Wed', value: 45 },
      { day: 'Thu', value: 85 },
      { day: 'Fri', value: 60 },
      { day: 'Sat', value: 90 },
      { day: 'Sun', value: 50 }
    ],
    topTopics: [
      { name: 'Mental Health', count: 12 },
      { name: 'Nutrition', count: 8 },
      { name: 'Sleep', count: 7 },
      { name: 'Exercise', count: 5 },
      { name: 'Heart Health', count: 3 }
    ]
  });
  
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading user data for insights');
      
      // Get user profile
      const profile = await ProfileService.getProfile(user.id);
      setUserProfile(profile);
      
      // Calculate days active
      const createdAt = new Date(profile?.created_at || user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now - createdAt);
      const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Fetch user conversations
      const conversations = await ConversationService.getUserConversations(user.id);
      
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
      
      // Calculate average messages per day
      const averageMessagesPerDay = daysActive > 0 ? (totalMessages / daysActive).toFixed(1) : 0;
      
      // Set metrics
      setMetrics({
        conversationCount: conversations.length,
        messageCount: totalMessages,
        daysActive: daysActive,
        doctorConsultations: doctorConsultations,
        averageMessagesPerDay: averageMessagesPerDay
      });
      
      // In a real app, you would fetch health data from a health API
      // For now, we're using the mock data initialized above
      
    } catch (error) {
      console.error('Error loading data for insights:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to render activity bars
  const renderActivityBar = (value, maxValue = 100, color = '#3b82f6') => {
    const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
    
    return (
      <View className="h-4 bg-gray-200 rounded-full w-full overflow-hidden">
        <View 
          className="h-full rounded-full" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
    );
  };
  
  const renderOverviewTab = () => (
    <View className="space-y-6">
      {/* Health Summary Section */}
      <View className="bg-white rounded-xl p-5 shadow-sm">
        <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Health Summary</Text>
        
        <View className="flex-row justify-between mb-6">
          <View className="bg-blue-50 rounded-xl p-3 shadow-sm items-center w-[23%]">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="heart" size={20} color="#3b82f6" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{healthData.heartRate}</Text>
            <Text className="text-gray-500 text-xs font-rubik">BPM</Text>
          </View>
          
          <View className="bg-green-50 rounded-xl p-3 shadow-sm items-center w-[23%]">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mb-2">
              <Ionicons name="footsteps" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{healthData.steps}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Steps</Text>
          </View>
          
          <View className="bg-purple-50 rounded-xl p-3 shadow-sm items-center w-[23%]">
            <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mb-2">
              <Ionicons name="bed" size={20} color="#8b5cf6" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{healthData.sleep}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Hours</Text>
          </View>
          
          <View className="bg-cyan-50 rounded-xl p-3 shadow-sm items-center w-[23%]">
            <View className="w-10 h-10 rounded-full bg-cyan-100 items-center justify-center mb-2">
              <Ionicons name="water" size={20} color="#06b6d4" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{healthData.hydration}L</Text>
            <Text className="text-gray-500 text-xs font-rubik">Water</Text>
          </View>
        </View>
        
        <Text className="text-sm font-rubik-medium text-gray-700 mb-2">Weekly Activity</Text>
        <View className="space-y-3">
          {healthData.weeklyActivity.map((day, index) => (
            <View key={index} className="flex-row items-center">
              <Text className="w-8 font-rubik text-gray-500">{day.day}</Text>
              <View className="flex-1 ml-2">
                {renderActivityBar(day.value, 100, '#3b82f6')}
              </View>
              <Text className="ml-2 font-rubik-medium text-gray-700 w-8 text-right">{day.value}%</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Rest of the component remains the same... */}
      {/* App Usage Section */}
      <View className="bg-white rounded-xl p-5 shadow-sm">
        <Text className="text-lg font-rubik-bold text-gray-800 mb-4">App Usage</Text>
        
        <View className="flex-row justify-between mb-6">
          <View className="bg-gray-100 rounded-xl p-3 shadow-sm w-[48%]">
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mb-2">
              <Ionicons name="calendar" size={20} color="#4f46e5" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.daysActive}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Days Active</Text>
          </View>
          
          <View className="bg-gray-100 rounded-xl p-3 shadow-sm w-[48%]">
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mb-2">
              <Ionicons name="chatbubbles" size={20} color="#4f46e5" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.conversationCount}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Total Conversations</Text>
          </View>
        </View>
        
        <View className="flex-row justify-between mb-6">
          <View className="bg-gray-100 rounded-xl p-3 shadow-sm w-[48%]">
            <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="chatbox" size={20} color="#10b981" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.messageCount}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Total Messages</Text>
          </View>
          
          <View className="bg-gray-100 rounded-xl p-3 shadow-sm w-[48%]">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
              <Ionicons name="medkit" size={20} color="#f59e0b" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800">{metrics.doctorConsultations}</Text>
            <Text className="text-gray-500 text-xs font-rubik">Doctor Consultations</Text>
          </View>
        </View>
        
        <Text className="text-sm font-rubik-medium text-gray-700 mb-2">Activity Distribution</Text>
        <View className="bg-gray-100 p-4 rounded-lg">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-rubik text-gray-600">Chat Sessions</Text>
            <Text className="font-rubik-medium text-gray-800">65%</Text>
          </View>
          {renderActivityBar(65, 100, '#3b82f6')}
          
          <View className="flex-row justify-between items-center mb-2 mt-3">
            <Text className="font-rubik text-gray-600">Doctor Consultations</Text>
            <Text className="font-rubik-medium text-gray-800">15%</Text>
          </View>
          {renderActivityBar(15, 100, '#ef4444')}
          
          <View className="flex-row justify-between items-center mb-2 mt-3">
            <Text className="font-rubik text-gray-600">Health Topic Browsing</Text>
            <Text className="font-rubik-medium text-gray-800">20%</Text>
          </View>
          {renderActivityBar(20, 100, '#10b981')}
        </View>
      </View>
    </View>
  );
  
  const renderHealthTab = () => (
    <View className="space-y-6">
      {/* Same health tab content... */}
    </View>
  );
  
  const renderActivityTab = () => (
    <View className="space-y-6">
      {/* Same activity tab content... */}
    </View>
  );
  
  // Colors for health topics
  const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading insights...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light" />
      
      {/* Header with Greeting */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-center mb-4">
          {/* Use the UserGreeting component here */}
          <UserGreeting />
          
          <TouchableOpacity 
            onPress={() => loadUserData()}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Stats Summary */}
        <View className="flex-row justify-between">
          <View className="bg-white/10 p-3 rounded-xl backdrop-blur-sm w-[48%]">
            <Text className="text-white/70 text-xs font-rubik">Total Chats</Text>
            <Text className="text-white text-xl font-rubik-bold">{metrics.conversationCount}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="chatbubbles" size={12} color="white" style={{ opacity: 0.7 }} />
              <Text className="text-white/70 text-xs font-rubik ml-1">
                {metrics.messageCount} messages
              </Text>
            </View>
          </View>
          
          <View className="bg-white/10 p-3 rounded-xl backdrop-blur-sm w-[48%]">
            <Text className="text-white/70 text-xs font-rubik">Consultations</Text>
            <Text className="text-white text-xl font-rubik-bold">{metrics.doctorConsultations}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="medkit" size={12} color="white" style={{ opacity: 0.7 }} />
              <Text className="text-white/70 text-xs font-rubik ml-1">
                {metrics.daysActive} days active
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      {/* Rest of the UI remains the same */}
      {/* Tab Navigation */}
      <View className="bg-white rounded-xl mx-5 mt-4 p-1 shadow-sm flex-row">
        <TouchableOpacity 
          onPress={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-indigo-100' : ''}`}
        >
          <Text 
            className={`text-center font-rubik-medium text-sm ${
              activeTab === 'overview' ? 'text-indigo-700' : 'text-gray-600'
            }`}
          >
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setActiveTab('health')}
          className={`flex-1 py-2 rounded-lg ${activeTab === 'health' ? 'bg-indigo-100' : ''}`}
        >
          <Text 
            className={`text-center font-rubik-medium text-sm ${
              activeTab === 'health' ? 'text-indigo-700' : 'text-gray-600'
            }`}
          >
            Health
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setActiveTab('activity')}
          className={`flex-1 py-2 rounded-lg ${activeTab === 'activity' ? 'bg-indigo-100' : ''}`}
        >
          <Text 
            className={`text-center font-rubik-medium text-sm ${
              activeTab === 'activity' ? 'text-indigo-700' : 'text-gray-600'
            }`}
          >
            Activity
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <ScrollView className="flex-1 mx-5 my-4">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'activity' && renderActivityTab()}
        
        {/* Quick Actions Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm my-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              onPress={() => router.push('/chat')}
              className="bg-indigo-50 rounded-xl p-4 w-[48%] mb-4 items-center"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-2">
                <Ionicons name="chatbubbles-outline" size={24} color="#4f46e5" />
              </View>
              <Text className="text-indigo-700 font-rubik-medium">New Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/request-doctor')}
              className="bg-red-50 rounded-xl p-4 w-[48%] mb-4 items-center"
            >
              <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-2">
                <Ionicons name="medkit-outline" size={24} color="#ef4444" />
              </View>
              <Text className="text-red-700 font-rubik-medium">Doctor Consult</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/health-topics')}
              className="bg-green-50 rounded-xl p-4 w-[48%] mb-4 items-center"
            >
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-2">
                <Ionicons name="information-circle-outline" size={24} color="#10b981" />
              </View>
              <Text className="text-green-700 font-rubik-medium">Health Topics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              className="bg-purple-50 rounded-xl p-4 w-[48%] mb-4 items-center"
            >
              <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mb-2">
                <Ionicons name="person-outline" size={24} color="#8b5cf6" />
              </View>
              <Text className="text-purple-700 font-rubik-medium">My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}