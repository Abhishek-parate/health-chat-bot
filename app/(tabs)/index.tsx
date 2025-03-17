// app/(tabs)/index.tsx
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
  HealthTopicService,
  DoctorRequestService
} from '@/lib/supabaseService';
import UserGreeting from '@/components/UserGreeting';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    conversationCount: 0,
    messageCount: 0,
    daysActive: 0,
    doctorConsultations: 0,
    averageMessagesPerDay: 0
  });
  
  const [recentConversations, setRecentConversations] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [healthTopics, setHealthTopics] = useState([]);
  
  // Activity data - will be calculated from actual metrics
  const [activityData, setActivityData] = useState({
    chatSessions: 0,
    doctorConsultations: 0,
    healthTopics: 0
  });
  
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading user data for dashboard');
      
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
      
      // Get recent conversations for the dashboard
      if (conversations.length > 0) {
        // Sort by updated_at
        const sortedConversations = conversations.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        
        // Get the 3 most recent conversations
        const recentConvos = sortedConversations.slice(0, 3).map(convo => ({
          id: convo.id,
          title: convo.title || 'Untitled Conversation',
          isDoctor: convo.is_doctor_chat,
          updatedAt: new Date(convo.updated_at).toLocaleDateString(),
          preview: convo.lastMessage?.content || 'No messages yet'
        }));
        
        setRecentConversations(recentConvos);
      }
      
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
      
      // Calculate activity distribution percentages
      const totalActivities = conversations.length + doctorConsultations;
      if (totalActivities > 0) {
        const chatPercentage = Math.round(((conversations.length - doctorConsultations) / totalActivities) * 100);
        const consultPercentage = Math.round((doctorConsultations / totalActivities) * 100);
        const topicsPercentage = 100 - chatPercentage - consultPercentage;
        
        setActivityData({
          chatSessions: chatPercentage,
          doctorConsultations: consultPercentage,
          healthTopics: topicsPercentage
        });
      }
      
      // Get active doctor requests
      const requests = await DoctorRequestService.getUserRequests(user.id);
      if (requests.length > 0) {
        // Filter only pending or approved requests
        const pendingRequests = requests.filter(req => 
          req.status === 'pending' || req.status === 'approved'
        );
        setActiveRequests(pendingRequests);
      }
      
      // Get popular health topics
      const topics = await HealthTopicService.getHealthTopics();
      if (topics.length > 0) {
        setHealthTopics(topics.slice(0, 4));
      }
      
    } catch (error) {
      console.error('Error loading data for dashboard:', error);
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
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading dashboard...</Text>
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
          {/* User Greeting */}
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
      
      <ScrollView className="flex-1 px-5 mt-4">
        {/* Active Doctor Requests - Real Data */}
        {activeRequests.length > 0 && (
          <View className="bg-amber-50 p-4 rounded-xl mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="hourglass" size={22} color="#f59e0b" />
              <Text className="text-amber-800 font-rubik-medium ml-2">
                {activeRequests.length > 1 
                  ? `${activeRequests.length} Active Requests` 
                  : 'Doctor Request Pending'}
              </Text>
            </View>
            <Text className="text-amber-700 font-rubik text-sm">
              {activeRequests[0].status === 'pending'
                ? 'Your request to speak with a doctor is being processed. A healthcare professional will be assigned to you shortly.'
                : 'A doctor has been assigned to your request. You can now chat with them.'}
            </Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/doctor-request',
                params: { id: activeRequests[0].id }
              })}
              className="bg-amber-100 py-2 rounded-lg items-center mt-3"
            >
              <Text className="text-amber-800 font-rubik-medium">View Request Status</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* App Usage Section - Real Data */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
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
              <Text className="font-rubik-medium text-gray-800">{activityData.chatSessions}%</Text>
            </View>
            {renderActivityBar(activityData.chatSessions, 100, '#3b82f6')}
            
            <View className="flex-row justify-between items-center mb-2 mt-3">
              <Text className="font-rubik text-gray-600">Doctor Consultations</Text>
              <Text className="font-rubik-medium text-gray-800">{activityData.doctorConsultations}%</Text>
            </View>
            {renderActivityBar(activityData.doctorConsultations, 100, '#ef4444')}
            
            <View className="flex-row justify-between items-center mb-2 mt-3">
              <Text className="font-rubik text-gray-600">Health Topic Browsing</Text>
              <Text className="font-rubik-medium text-gray-800">{activityData.healthTopics}%</Text>
            </View>
            {renderActivityBar(activityData.healthTopics, 100, '#10b981')}
          </View>
        </View>
        
        {/* Recent Conversations - Real Data */}
        {recentConversations.length > 0 && (
          <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-rubik-bold text-gray-800">Recent Conversations</Text>
              <TouchableOpacity onPress={() => router.push('/conversations')}>
                <Text className="text-indigo-600 font-rubik-medium text-sm">See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentConversations.map((convo, index) => (
              <TouchableOpacity 
                key={convo.id}
                onPress={() => router.push({
                  pathname: '/chat',
                  params: { conversationId: convo.id }
                })}
                className={`flex-row items-center py-3 ${
                  index < recentConversations.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  convo.isDoctor ? 'bg-emerald-100' : 'bg-indigo-100'
                }`}>
                  <Ionicons 
                    name={convo.isDoctor ? "medkit" : "chatbubbles"} 
                    size={18} 
                    color={convo.isDoctor ? "#10b981" : "#4f46e5"} 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-rubik-medium">{convo.title}</Text>
                  <Text className="text-gray-500 text-xs font-rubik" numberOfLines={1}>
                    {convo.preview.length > 40 
                      ? convo.preview.substring(0, 40) + '...' 
                      : convo.preview}
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs">{convo.updatedAt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Browse Health Topics - Real Data */}
        {healthTopics.length > 0 && (
          <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-rubik-bold text-gray-800">Health Topics</Text>
              <TouchableOpacity onPress={() => router.push('/health-topics')}>
                <Text className="text-indigo-600 font-rubik-medium text-sm">Browse All</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row flex-wrap justify-between">
              {healthTopics.map((topic) => (
                <TouchableOpacity 
                  key={topic.id}
                  onPress={() => router.push({
                    pathname: '/health-topics',
                    params: { id: topic.id }
                  })}
                  className="bg-gray-100 rounded-xl p-3 mb-3 w-[48%]"
                >
                  <Text className="text-gray-800 font-rubik-medium">{topic.title}</Text>
                  <View className="h-1 w-10 mt-2 rounded-full" style={{
                    backgroundColor: topic.color || '#4f46e5'
                  }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {/* Quick Actions Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
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