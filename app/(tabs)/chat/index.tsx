// app/(tabs)/chat/index.tsx - Updated with improved UI
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 16, color: '#6b7280', fontWeight: '500' }}>Checking authentication...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 16, color: '#6b7280', fontWeight: '500' }}>Loading your chat...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16, 
          padding: 24, 
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 2,
          width: '100%',
          maxWidth: 400
        }}>
          <View style={{ 
            backgroundColor: '#fee2e2', 
            borderRadius: 100, 
            width: 56, 
            height: 56, 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <Ionicons name="alert-circle" size={32} color="#dc2626" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>
            Connection Error
          </Text>
          <Text style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#4f46e5',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center'
            }}
            onPress={() => router.replace('/chat')}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.push('/conversations')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            {isWithDoctor && doctorInfo ? (
              <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  {doctorInfo.avatar_url ? (
                    <Image 
                      source={{ uri: doctorInfo.avatar_url }} 
                      style={{ width: 36, height: 36, borderRadius: 18 }} 
                    />
                  ) : (
                    <MaterialCommunityIcons name="doctor" size={24} color="white" />
                  )}
                </View>
                <View>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    Dr. {doctorInfo.full_name?.split(' ')[0] || 'Doctor'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: doctorInfo.status === 'online' ? '#10b981' : 
                                      doctorInfo.status === 'busy' ? '#f59e0b' : '#9ca3af',
                      marginRight: 4
                    }} />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                      {doctorInfo.status || 'offline'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {currentTopic}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => router.replace('/chat')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Main content with keyboard avoiding */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isWithDoctor && doctorInfo && (
          <View style={{ 
            marginHorizontal: 16, 
            marginTop: -20, 
            backgroundColor: 'white', 
            borderRadius: 12, 
            padding: 12, 
            flexDirection: 'row',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
            marginBottom: 4
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: '#059669', marginBottom: 2 }}>
                Doctor Consultation
              </Text>
              {doctorInfo.specialty && (
                <Text style={{ fontSize: 13, color: '#6b7280' }}>
                  {doctorInfo.specialty} • {doctorInfo.years_experience || 5}+ years experience
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#ecfdf5',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>
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
        <View style={{ height: 8 }} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}