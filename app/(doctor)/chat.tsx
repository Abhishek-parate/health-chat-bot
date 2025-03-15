// app/(doctor)/chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import {
  ConversationService,
  MessageService,
  ProfileService,
  Message,
  Profile
} from '@/lib/supabaseService';
import { supabase } from '@/utils/supabase';

export default function DoctorChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = params.conversationId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patient, setPatient] = useState<Profile | null>(null);
  const [doctor, setDoctor] = useState<Profile | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (user) {
      loadChatData();
      subscribeToMessages();
    }
    
    return () => {
      supabase.removeAllChannels();
    };
  }, [user, conversationId]);
  
  const loadChatData = async () => {
    setIsLoading(true);
    try {
      // Get conversation details
      const conversation = await ConversationService.getConversation(conversationId);
      
      if (!conversation) {
        console.error('Conversation not found');
        router.replace('/(doctor)/conversations');
        return;
      }
      
      // Get patient profile
      if (conversation.user_id) {
        const patientProfile = await ProfileService.getProfile(conversation.user_id);
        setPatient(patientProfile);
      }
      
      // Get doctor profile (should be current user)
      if (user?.id) {
        const doctorProfile = await ProfileService.getProfile(user.id);
        setDoctor(doctorProfile);
      }
      
      // Get messages
      const chatMessages = await MessageService.getMessages(conversationId);
      setMessages(chatMessages);
      
      // Mark messages as read
      if (user?.id) {
        await MessageService.markMessagesAsRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const subscribeToMessages = () => {
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Only add if not from the current user
          if (newMsg.sender_id !== user?.id) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read
            if (user?.id) {
              await MessageService.markMessagesAsRead(conversationId, user.id);
            }
          }
        }
      )
      .subscribe();
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    
    setSending(true);
    try {
      const sentMessage = await MessageService.sendMessage(
        conversationId,
        'doctor',
        newMessage.trim(),
        user.id
      );
      
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.sender_id === user?.id;
    const isAssistant = item.role === 'assistant';
    
    return (
      <View 
        className={`mb-3 max-w-[80%] ${isFromMe ? 'self-end' : 'self-start'}`}
      >
        {/* Message bubble */}
        <View
          className={`rounded-2xl p-3 ${
            isFromMe 
              ? 'bg-emerald-500 rounded-tr-none' 
              : isAssistant 
                ? 'bg-gray-200 rounded-tl-none'
                : 'bg-indigo-100 rounded-tl-none'
          }`}
        >
          <Text 
            className={`${
              isFromMe ? 'text-white' : 'text-gray-800'
            } font-rubik`}
          >
            {item.content}
          </Text>
        </View>
        
        {/* Timestamp */}
        <Text className="text-gray-500 text-xs mt-1 font-rubik">
          {isFromMe ? 'You' : isAssistant ? 'Assistant' : patient?.full_name} • {
            new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" />
      
      {/* Patient info header */}
      <View className="bg-white border-b border-gray-200 py-3 px-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
            {patient?.avatar_url ? (
              <Image 
                source={{ uri: patient.avatar_url }} 
                className="h-10 w-10 rounded-full" 
              />
            ) : (
              <Text className="text-indigo-600 font-rubik-bold">
                {patient?.full_name?.charAt(0) || 'P'}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-rubik-medium">
              {patient?.full_name || 'Patient'}
            </Text>
            <View className="flex-row items-center">
              <View className="h-2 w-2 rounded-full bg-emerald-500 mr-1" />
              <Text className="text-gray-500 text-xs font-rubik">
                Medical Consultation
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/(doctor)/patient-details',
              params: { id: patient?.id }
            })}
            className="bg-gray-100 p-2 rounded-full"
          >
            <Ionicons name="information-circle-outline" size={22} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      {/* Bottom input bar */}
      <View className="border-t border-gray-200 bg-white p-2 flex-row items-center">
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 font-rubik"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          className={`rounded-full p-2 ${
            !newMessage.trim() || sending ? 'bg-gray-300' : 'bg-emerald-500'
          }`}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}