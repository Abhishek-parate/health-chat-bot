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
  sendMessageAndGetResponse
} from '@/lib/chatService';
import { ConversationService, MessageService } from '@/lib/supabaseService';
import { supabase } from '@/utils/supabase';
import { playMessageSentSound, playMessageReceivedSound } from '@/utils/notificationService';
import { getProfile } from '@/lib/profileService';

// Define interfaces
interface ChatMessage {
  id: string | number;
  content: string;
  sender_type: 'user' | 'assistant' | 'doctor';
  created_at: string;
  is_read: boolean;
  sender_id?: string;
  attachment_url?: string;
}

interface Doctor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  specialty?: string;
  status?: 'online' | 'busy' | 'offline';
}

interface Conversation {
  id: string | number;
  user_id: string;
  doctor_id?: string;
  is_doctor_chat: boolean;
  status: 'active' | 'closed';
  created_at: string;
  title?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWithDoctor, setIsWithDoctor] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  
  // Initialize conversation on load
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if conversationId was passed as a parameter
        if (params.conversationId) {
          const convoId = params.conversationId as string;
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
            
            // Load doctor info using the profile service with caching
            try {
              const doctorData = await getProfile(conversationData.doctor_id);
              setDoctorInfo(doctorData);
            } catch (error) {
              console.error('Error loading doctor profile:', error);
              // Create a fallback profile
              setDoctorInfo({
                id: conversationData.doctor_id,
                full_name: 'Doctor',
                status: 'offline',
                avatar_url: null
              });
            }
            
            // Load messages using MessageService for doctor chats
            const doctorMessages = await MessageService.getMessages(convoId);
            
            // Validate the messages before setting
            const validMessages = doctorMessages.filter(msg => 
              msg && (msg.content || msg.attachment_url)
            );
            
            setMessages(validMessages);
            
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
            const topic = params.topic as string;
            await handleSendMessage(`Tell me about ${topic}`);
          }
        }
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [isAuthenticated, user, params.conversationId, params.topic]);
  
  // Handle sending a message
  const handleSendMessage = async (message: string): Promise<string> => {
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
        
        // Play sound when message is sent
        playMessageSentSound();
        
        return '';
      } else {
        // If it's an AI chat, use chatService
        const { userMessage, aiMessage } = await sendMessageAndGetResponse(
          conversationId,
          message
        );
        
        // Play sound when message is sent
        playMessageSentSound();
        
        // If we got a valid AI message, return its content
        if (aiMessage) {
          // Update the local messages state
          setMessages(prev => [
            ...prev,
            userMessage,
            aiMessage
          ]);
          
          // Play sound when AI responds
          setTimeout(() => {
            playMessageReceivedSound();
          }, 500); // Small delay so the sounds don't overlap
          
          return '';
        } else {
          throw new Error('Failed to get AI response');
        }
      }
    } catch (error: any) {
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
        {/* Chat Interface with realtime messaging */}
        {conversationId && user && (
          <ChatInterface
            conversationId={conversationId}
            initialMessages={messages}
            onSendMessage={handleSendMessage}
            isDoctor={false}
            isDisabled={isWithDoctor && conversation?.status === 'closed'}
            userId={user.id}
          />
        )}
        
        {/* Bottom padding */}
        <View className="h-8" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}