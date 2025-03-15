// app/(doctor)/chat.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Platform,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ConversationService, MessageService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';

export default function DoctorChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [patient, setPatient] = useState(null);
  
  // Initialize conversation on load
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if conversationId was passed as a parameter
        if (params.conversationId) {
          const convoId = params.conversationId.toString();
          console.log(`Loading conversation with ID: ${convoId}`);
          
          // Load conversation details
          const conversationData = await ConversationService.getConversation(convoId);
          
          if (!conversationData) {
            console.log(`Conversation not found, may be a new conversation`);
            // This might happen for newly created conversations, redirect back to conversations
            router.replace('/(doctor)/(tabs)/conversations');
            return;
          }
          
          console.log(`Conversation loaded successfully: ${JSON.stringify(conversationData)}`);
          setConversation(conversationData);
          
          // Load messages for this conversation
          const messagesData = await MessageService.getMessages(convoId);
          console.log(`Loaded ${messagesData.length} messages for conversation`);
          setMessages(messagesData);
          
          // Mark messages as read
          await MessageService.markMessagesAsRead(convoId, user.id);
          
          // Load patient profile
          if (conversationData.user_id) {
            console.log(`Loading patient profile for user ID: ${conversationData.user_id}`);
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', conversationData.user_id)
              .maybeSingle();
                
            if (data) {
              console.log(`Patient profile loaded successfully: ${data.full_name}`);
              setPatient(data);
            } else {
              console.log('Patient profile not found, using default');
              // Create a default patient object
              setPatient({
                id: conversationData.user_id,
                full_name: 'Patient',
                avatar_url: null
              });
            }
          }
        } else {
          console.log('No conversationId provided, redirecting to conversations');
          // Redirect back to conversations list if no conversation ID
          router.replace('/(doctor)/(tabs)/conversations');
          return;
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to load conversation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [isAuthenticated, user, params.conversationId]);
  
  // Handle sending a message
  const handleSendMessage = async (message) => {
    if (!conversation?.id || !message.trim()) {
      return "Could not send your message. Please try again.";
    }
    
    try {
      console.log(`Sending message to conversation ${conversation.id}: ${message.substring(0, 30)}...`);
      // Create a message from the doctor
      const sentMessage = await MessageService.sendMessage(
        conversation.id,
        'doctor',
        message,
        user.id
      );
      
      if (sentMessage) {
        console.log('Message sent successfully');
        // Update local messages state
        setMessages(prev => [...prev, sentMessage]);
        return '';
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      return "Sorry, I couldn't send your message. Please try again.";
    }
  };
  
  // If not signed in, redirect to sign in page
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);
  
  // Handle closing the conversation
  const handleCloseConversation = async () => {
    try {
      console.log(`Closing conversation ${conversation.id}`);
      setIsLoading(true);
      const success = await ConversationService.updateConversation(
        conversation.id,
        { status: 'closed' }
      );
      
      if (success) {
        console.log('Conversation closed successfully');
        // Optionally send a system message
        await MessageService.sendMessage(
          conversation.id,
          'assistant',
          'This conversation has been closed by the doctor.',
          null
        );
        
        // Update local state
        setConversation(prev => ({ ...prev, status: 'closed' }));
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Checking authentication...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading conversation...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 mb-4 font-rubik">{error}</Text>
        <TouchableOpacity
          className="bg-emerald-500 px-4 py-2 rounded-lg"
          onPress={() => router.replace('/(doctor)/(tabs)/conversations')}
        >
          <Text className="text-white font-rubik-medium">Back to Consultations</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Handle back navigation
  const handleBack = () => {
    console.log('Navigating back to conversations');
    router.replace('/(doctor)/(tabs)/conversations');
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-4 px-4"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          {patient ? (
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 rounded-full bg-white items-center justify-center mr-3 ">
                {patient.avatar_url ? (
                  <Image 
                    source={{ uri: patient.avatar_url }} 
                    className="h-10 w-10 rounded-full" 
                  />
                ) : (
                  <Text className="text-emerald-600 font-rubik-bold">
                    {patient.full_name?.charAt(0) || 'P'}
                  </Text>
                )}
              </View>
              <View>
                <Text className="text-lg font-rubik-bold text-white">
                  {patient.full_name || 'Patient'}
                </Text>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-white mr-1" />
                  <Text className="text-white text-xs font-rubik">
                    {conversation?.status === 'active' ? 'Active Consultation' : 'Closed Consultation'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Default UI when patient profile not found
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 rounded-full bg-white items-center justify-center mr-3">
                <Text className="text-emerald-600 font-rubik-bold">P</Text>
              </View>
              <View>
                <Text className="text-lg font-rubik-bold text-white">
                  Patient
                </Text>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-white mr-1" />
                  <Text className="text-white text-xs font-rubik">
                    {conversation?.status === 'active' ? 'Active Consultation' : 'Closed Consultation'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {conversation?.status === 'active' && (
            <TouchableOpacity
              onPress={handleCloseConversation}
              className="bg-white/20 rounded-full p-2"
            >
              <Ionicons name="close-circle" size={22} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      
      {/* Main content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View className="flex-1">
          {/* Chat Interface */}
          <ChatInterface
            conversationId={conversation?.id}
            initialMessages={messages}
            onSendMessage={handleSendMessage}
            isDoctor={true}
            isDisabled={conversation?.status === 'closed'}
          />
        </View>
        
        {/* Bottom padding */}
        <View className="h-10" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}