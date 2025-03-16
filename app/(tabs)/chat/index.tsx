// app/(tabs)/chat/index.tsx - Converted to NativeWind
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { 
  createConversation, 
  getConversationMessages, 
  sendMessageAndGetResponse,
  getUserConversations
} from '@/lib/chatService';
import { ConversationService, MessageService } from '@/lib/supabaseService';
import { supabase } from '@/utils/supabase';
import { setUnreadMessageCount } from '@/utils/notificationService';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isWithDoctor, setIsWithDoctor] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(params.topic || 'Health Chat');
  
  // Initialize conversation on load
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if conversationId was passed as a parameter
        if (params.conversationId) {
          const convoId = params.conversationId;
          setConversationId(convoId);
          
          // First, update the unread counts to ensure UI is updated immediately
          await updateUnreadCounts(convoId);
          
          // Get conversation details to check if it's a doctor chat
          const conversationData = await ConversationService.getConversation(convoId);
          
          if (!conversationData) {
            throw new Error('Failed to load conversation');
          }
          
          setConversation(conversationData);
          if (conversationData.title) {
            setCurrentTopic(conversationData.title);
          }
          
          // Check if this is a doctor chat
          if (conversationData.is_doctor_chat && conversationData.doctor_id) {
            setIsWithDoctor(true);
            
            // Load doctor info
            const { data: doctorData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', conversationData.doctor_id)
              .maybeSingle();
              
            if (doctorData) {
              setDoctorInfo(doctorData);
            }
            
            // Load messages using MessageService for doctor chats
            const doctorMessages = await MessageService.getMessages(convoId);
            setMessages(doctorMessages);
          } else {
            // It's an AI chat
            const aiMessages = await getConversationMessages(convoId);
            setMessages(aiMessages);
          }
        } else {
          // Create a new conversation with AI
          let title = "Health Chat";
          if (params.topic) {
            title = params.topic;
          }
          
          const conversation = await createConversation(user.id, title);
          
          if (!conversation) {
            throw new Error('Failed to create conversation');
          }
          
          setConversationId(conversation.id);
          setConversation(conversation);
          
          // If topic was provided, send an initial message
          if (params.topic) {
            setCurrentTopic(params.topic);
            await handleSendMessage(`Tell me about ${params.topic}`);
          }
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [isAuthenticated, user, params.conversationId, params.topic]);
  
  // Helper function to update unread counts
  const updateUnreadCounts = async (currentConvoId) => {
    try {
      // 1. First mark messages in this conversation as read
      await MessageService.markMessagesAsRead(currentConvoId, user.id);
      
      // 2. Get all conversations to calculate remaining unread counts
      const allConversations = await getUserConversations(user.id);
      
      // 3. Calculate total unread count (excluding current conversation)
      let totalUnread = 0;
      allConversations.forEach(convo => {
        if (convo.id !== currentConvoId) {
          totalUnread += (convo.unreadCount || 0);
        }
      });
      
      // 4. Update app badge count
      await setUnreadMessageCount(totalUnread);
      
      console.log(`Updated unread counts. Total remaining: ${totalUnread}`);
      
    } catch (error) {
      console.error('Error updating unread counts:', error);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async (message) => {
    if (!conversationId || !message.trim()) {
      return "Could not process your message. Please try again.";
    }
    
    try {
      if (isWithDoctor) {
        // If it's a doctor chat, use MessageService
        const userMessage = await MessageService.sendMessage(
          conversationId,
          'user',
          message,
          user.id
        );
        
        if (!userMessage) {
          throw new Error('Failed to send message to doctor');
        }
        
        return '';
      } else {
        // If it's an AI chat, use chatService
        const { userMessage, aiMessage } = await sendMessageAndGetResponse(
          conversationId,
          message
        );
        
        // If we got a valid AI message, return its content
        if (aiMessage) {
          // Update the local messages state
          setMessages(prev => [
            ...prev,
            userMessage,
            aiMessage
          ]);
          
          return '';
        } else {
          throw new Error('Failed to get AI response');
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      return "Sorry, I couldn't process your request. Please try again.";
    }
  };
  
  // If not signed in, redirect to sign in page
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);
  
  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-500 font-medium">Checking authentication...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-500 font-medium">Loading your chat...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <View className="bg-white rounded-2xl p-6 items-center shadow-sm w-full max-w-md">
          <View className="bg-red-100 rounded-full w-14 h-14 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={32} color="#dc2626" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Connection Error
          </Text>
          <Text className="text-center text-gray-500 mb-6">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-indigo-600 py-3 px-6 rounded-lg w-full items-center"
            onPress={() => router.replace('/chat')}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Determine header gradient colors based on chat type
  const headerGradient = isWithDoctor 
    ? ['#059669', '#10b981'] // Doctor chat - green gradient
    : ['#4f46e5', '#7c3aed']; // AI chat - purple gradient
  
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push('/conversations')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            {isWithDoctor && doctorInfo ? (
              <View className="items-center flex-row">
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
                  {doctorInfo.avatar_url ? (
                    <Image 
                      source={{ uri: doctorInfo.avatar_url }} 
                      className="w-9 h-9 rounded-full" 
                    />
                  ) : (
                    <MaterialCommunityIcons name="doctor" size={24} color="white" />
                  )}
                </View>
                <View>
                  <Text className="text-white font-bold text-base">
                    Dr. {doctorInfo.full_name?.split(' ')[0] || 'Doctor'}
                  </Text>
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-1 ${
                      doctorInfo.status === 'online' 
                        ? 'bg-emerald-500' 
                        : doctorInfo.status === 'busy' 
                          ? 'bg-amber-500' 
                          : 'bg-gray-400'
                    }`} />
                    <Text className="text-white/80 text-xs">
                      {doctorInfo.status || 'offline'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-white font-bold text-base">
                {currentTopic}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => router.replace('/chat')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Main content with keyboard avoiding */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isWithDoctor && doctorInfo && (
          <View className="mx-4 -mt-5 bg-white rounded-xl p-3 flex-row shadow-sm mb-1">
            <View className="flex-1">
              <Text className="font-semibold text-emerald-600 mb-0.5">
                Doctor Consultation
              </Text>
              {doctorInfo.specialty && (
                <Text className="text-xs text-gray-500">
                  {doctorInfo.specialty} • {doctorInfo.years_experience || 5}+ years experience
                </Text>
              )}
            </View>
            <TouchableOpacity
              className="px-3 py-1.5 bg-emerald-50 rounded-lg items-center justify-center"
            >
              <Text className="text-xs text-emerald-600 font-semibold">
                {conversation?.status === 'closed' ? 'Closed' : 'Active'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Chat Interface with realtime messaging */}
        <ChatInterface
          conversationId={conversationId || undefined}
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          isDoctor={false}
          isDisabled={isWithDoctor && conversation?.status === 'closed'}
          userId={user.id} // Pass user ID for realtime subscription
        />
        
        {/* Bottom padding */}
        <View className="h-2" />
      </KeyboardAvoidingView>

    </View>
  );
}