// app/(tabs)/chat/index.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { 
  createConversation, 
  getConversationMessages, 
  sendMessageAndGetResponse,
  ChatMessage
} from '@/lib/chatService';
import { ConversationService, MessageService } from '@/lib/supabaseService';
import { supabase } from '@/utils/supabase';

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
          
          // Get conversation details to check if it's a doctor chat
          const conversationData = await ConversationService.getConversation(convoId);
          
          if (!conversationData) {
            throw new Error('Failed to load conversation');
          }
          
          setConversation(conversationData);
          
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
            
            // Mark messages as read
            await MessageService.markMessagesAsRead(convoId, user.id);
          } else {
            // It's an AI chat
            const aiMessages = await getConversationMessages(convoId);
            setMessages(aiMessages);
          }
        } else {
          // Create a new conversation with AI
          const conversation = await createConversation(user.id);
          
          if (!conversation) {
            throw new Error('Failed to create conversation');
          }
          
          setConversationId(conversation.id);
          setConversation(conversation);
          
          // If topic was provided, send an initial message
          if (params.topic) {
            const topic = params.topic;
            await handleSendMessage(`Tell me about ${topic}`);
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
        
        if (userMessage) {
          // Update the local messages state
          setMessages(prev => [...prev, userMessage]);
          return '';
        } else {
          throw new Error('Failed to send message to doctor');
        }
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
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-4 text-gray-600 font-rubik">Checking authentication...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading your chat...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 mb-4 font-rubik">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.replace('/chat')}
        >
          <Text className="text-white font-rubik-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className={`px-4 pt-12 pb-4 border-b border-gray-200 ${isWithDoctor ? 'bg-emerald-50' : 'bg-white'}`}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push('/conversations')}
            className="mr-3"
          >
            <FontAwesome name="list" size={20} color="#4b5563" />
          </TouchableOpacity>
          
          {isWithDoctor && doctorInfo ? (
            <View className="flex-1 flex-row items-center">
              <View className="h-8 w-8 rounded-full bg-emerald-100 items-center justify-center mr-2">
                {doctorInfo.avatar_url ? (
                  <Image 
                    source={{ uri: doctorInfo.avatar_url }} 
                    className="h-8 w-8 rounded-full" 
                  />
                ) : (
                  <Text className="text-emerald-600 font-rubik-bold">
                    {doctorInfo.full_name?.charAt(0) || 'D'}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-rubik-bold text-emerald-800">
                  Dr. {doctorInfo.full_name || 'Doctor'}
                </Text>
                {doctorInfo.specialty && (
                  <Text className="text-emerald-600 text-xs font-rubik">
                    {doctorInfo.specialty}
                  </Text>
                )}
              </View>
              <View className={`px-2 py-1 rounded-full ${
                doctorInfo.status === 'online' ? 'bg-emerald-100' : 
                doctorInfo.status === 'busy' ? 'bg-amber-100' : 'bg-gray-100'
              }`}>
                <Text className={`text-xs font-rubik-medium ${
                  doctorInfo.status === 'online' ? 'text-emerald-800' :
                  doctorInfo.status === 'busy' ? 'text-amber-800' : 'text-gray-600'
                }`}>
                  {doctorInfo.status || 'offline'}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-xl font-rubik-bold flex-1">
              {isWithDoctor ? 'Doctor Consultation' : 'Health Chat'}
            </Text>
          )}
          
          <TouchableOpacity 
            className="p-2"
            onPress={() => router.replace('/chat')}
          >
            <FontAwesome name="plus" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main content with keyboard avoiding */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Interface */}
        <ChatInterface
          conversationId={conversationId || undefined}
          initialMessages={messages}
          onSendMessage={handleSendMessage}
          isDoctor={false}
          isDisabled={isWithDoctor && conversation?.status === 'closed'}
        />
        
        {/* Bottom padding */}
        <View className="h-8" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}