// components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Keyboard,
  Image,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ChatMessage } from '@/lib/chatService';
import { markConversationAsRead } from '@/lib/chatService';

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: ChatMessage[];
  onSendMessage: (message: string) => Promise<string>;
  otherUser?: {
    name: string;
    avatar?: string;
    role: string;
    status?: 'online' | 'offline' | 'busy';
  };
  isDoctor?: boolean;
  onRequestDoctor?: () => void;
}

export function ChatInterface({ 
  conversationId, 
  initialMessages = [], 
  onSendMessage,
  otherUser,
  isDoctor = false,
  onRequestDoctor
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDoctorRequestModal, setShowDoctorRequestModal] = useState(false);
  const [doctorRequestReason, setDoctorRequestReason] = useState('');
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  
  // Mark messages as read when they're displayed
  useEffect(() => {
    if (conversationId && user) {
      markConversationAsRead(conversationId, user.id);
    }
  }, [conversationId, messages, user]);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Simulate typing indicator for more natural feel
  useEffect(() => {
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, randomDelay);
      
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [isTyping]);
  
  // Handle sending a message
  const handleSend = async () => {
    const messageText = inputMessage.trim();
    if (!messageText || isLoading) return;
    
    setInputMessage('');
    Keyboard.dismiss();
    setIsLoading(true);
    
    try {
      // Add message to UI immediately for responsive feel
      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
        sender: user ? {
          id: user.id,
          name: user?.user_metadata?.full_name || 'You',
        } : undefined,
        isRead: true
      };
      
      setMessages(prev => [...prev, tempUserMsg]);
      
      // If this is a doctor chat or regular chat
      if (otherUser && otherUser.role === 'doctor') {
        // For doctor chats, show typing indicator
        setIsTyping(true);
      } else {
        // For AI chats, show loading messages
        startLoadingMessages();
      }
      
      // Send to server/AI and get response
      const response = await onSendMessage(messageText);
      
      if (otherUser && otherUser.role === 'doctor') {
        // For doctor chats, we don't show an immediate response
        // The doctor's response will come through real-time subscription
      } else {
        // For AI responses, add to messages
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
          isRead: true
        };
        
        // Stop the loading message animation
        setLoadingMessages([]);
        // Add the real AI message
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error in UI
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your message. Please try again.',
        timestamp: new Date().toISOString(),
        isRead: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingMessages([]);
      setIsTyping(false);
    }
  };
  
  // Handle submitting doctor request
  const handleSubmitDoctorRequest = () => {
    if (!doctorRequestReason.trim()) {
      Alert.alert('Please provide a reason for your consultation request');
      return;
    }
    
    if (onRequestDoctor) {
      onRequestDoctor();
      setShowDoctorRequestModal(false);
      setDoctorRequestReason('');
      
      // Add a system message about the request
      const systemMsg: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: 'Your request to speak with a healthcare professional has been submitted. ' +
                'A doctor will be with you as soon as possible. You can continue to chat with me ' +
                'in the meantime if you have general health questions.',
        timestamp: new Date().toISOString(),
        isRead: true
      };
      
      setMessages(prev => [...prev, systemMsg]);
    }
  };
  
  // Start the loading animation with typing messages
  const startLoadingMessages = () => {
    const loadingTexts = [
      'Thinking...',
      'Analyzing your question...',
      'Searching medical knowledge...',
      'Formulating response...'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      setLoadingMessages([loadingTexts[index]]);
      index = (index + 1) % loadingTexts.length;
      
      // Clear after reasonable time if response takes too long
      if (index === 0 && loadingMessages.length > 0) {
        clearInterval(interval);
      }
    }, 1500);
    
    // Clear on component unmount
    return () => clearInterval(interval);
  };
  
  // Render message bubble
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isDoctor = item.role === 'doctor';
    const isAssistant = item.role === 'assistant';
    
    return (
      <View 
        className={`mb-4 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
      >
        {/* Sender name for group chats or when needed */}
        {!isUser && item.sender?.name && (
          <Text className="text-gray-500 text-xs ml-2 mb-1 font-rubik">
            {isDoctor ? '👨‍⚕️ ' : ''}{item.sender.name}
          </Text>
        )}
        
        <View className="flex-row items-end">
          {/* Avatar for non-user messages */}
          {!isUser && (
            <View className="h-8 w-8 rounded-full overflow-hidden mr-2 bg-indigo-100 items-center justify-center">
              {item.sender?.avatar ? (
                <Image 
                  source={{ uri: item.sender.avatar }} 
                  className="h-8 w-8" 
                />
              ) : isAssistant ? (
                <Text>🩺</Text>
              ) : (
                <Ionicons name="person" size={16} color="#4f46e5" />
              )}
            </View>
          )}
          
          {/* Message content */}
          <View 
            className={`rounded-2xl px-4 py-2.5 ${
              isUser ? 'bg-indigo-600 rounded-br-none' : 
              isDoctor ? 'bg-emerald-100 rounded-bl-none' : 
              'bg-gray-100 rounded-bl-none'
            }`}
          >
            <Text 
              className={`${
                isUser ? 'text-white' : isDoctor ? 'text-emerald-800' : 'text-gray-800'
              } font-rubik`}
            >
              {item.content}
            </Text>
          </View>
          
          {/* User avatar or spacer */}
          {isUser && (
            <View className="h-8 w-8 rounded-full overflow-hidden ml-2 bg-indigo-600 items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <Image 
                  source={{ uri: user.user_metadata.avatar_url }} 
                  className="h-8 w-8" 
                />
              ) : (
                <Text className="text-white font-rubik-bold">
                  {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Timestamp */}
        <Text 
          className={`text-gray-500 text-xs mt-1 font-rubik ${
            isUser ? 'self-end mr-10' : 'ml-10'
          }`}
        >
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };
  
  // Render loading indicator or typing indicator
  const renderLoadingOrTyping = () => {
    if (loadingMessages.length > 0) {
      return (
        <View className="flex-row items-center self-start bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none mb-4">
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text className="ml-2 text-gray-700 font-rubik">{loadingMessages[0]}</Text>
        </View>
      );
    }
    
    if (isTyping) {
      return (
        <View className="flex-row items-center self-start mb-4">
          {otherUser?.avatar ? (
            <Image 
              source={{ uri: otherUser.avatar }}
              className="h-8 w-8 rounded-full mr-2" 
            />
          ) : (
            <View className="h-8 w-8 rounded-full overflow-hidden mr-2 bg-emerald-100 items-center justify-center">
              <Ionicons name="person" size={16} color="#059669" />
            </View>
          )}
          
          <View className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none">
            <View className="flex-row items-center">
              <View className="h-2 w-2 bg-gray-400 rounded-full mr-1 animate-bounce" />
              <View className="h-2 w-2 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <View className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </View>
          </View>
        </View>
      );
    }
    
    return null;
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-6">
      <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
        <Text className="text-2xl">💬</Text>
      </View>
      <Text className="text-xl text-gray-800 font-rubik-medium text-center mb-2">
        Start a conversation
      </Text>
      <Text className="text-gray-500 text-center mb-6 font-rubik">
        {isDoctor
          ? "Ask any health questions or concerns you have. Your doctor will respond as soon as possible."
          : "Ask any health-related questions and get instant advice from our AI health assistant."}
      </Text>
      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        className="bg-indigo-600 px-5 py-3 rounded-full"
      >
        <Text className="text-white font-rubik-medium">Start chatting</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Doctor request modal
  const renderDoctorRequestModal = () => (
    <Modal
      visible={showDoctorRequestModal}
      transparent={true}
      animationType="slide"
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 min-h-[40%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-rubik-bold text-gray-800">Request Doctor Consultation</Text>
            <TouchableOpacity
              onPress={() => setShowDoctorRequestModal(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-gray-600 mb-4 font-rubik">
            Please provide a brief reason for your consultation request. This helps the doctor 
            prepare for your conversation.
          </Text>
          
          <View className="border border-gray-200 rounded-xl bg-gray-50 p-3 mb-6">
            <TextInput
              placeholder="Briefly describe your health concern..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="min-h-[100px] text-gray-800 font-rubik"
              value={doctorRequestReason}
              onChangeText={setDoctorRequestReason}
            />
          </View>
          
          <TouchableOpacity
            onPress={handleSubmitDoctorRequest}
            className="bg-indigo-600 py-3 rounded-xl items-center"
          >
            <Text className="text-white font-rubik-medium">Submit Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Doctor request modal */}
      {renderDoctorRequestModal()}
      
      {/* Chat messages */}
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: 8 
          }}
          className="flex-1 bg-white"
        />
      )}
      
      {/* Loading or typing indicators */}
      {(loadingMessages.length > 0 || isTyping) && (
        <View className="px-4">
          {renderLoadingOrTyping()}
        </View>
      )}
      
      {/* Input bar */}
      <View className="border-t border-gray-100 px-4 py-2 bg-white">
        {/* Doctor request button (only shown for AI chats) */}
        {!isDoctor && !otherUser && onRequestDoctor && (
          <TouchableOpacity
            onPress={() => setShowDoctorRequestModal(true)}
            className="bg-emerald-50 mb-2 py-2 px-4 rounded-full self-start flex-row items-center"
          >
            <Ionicons name="medkit" size={16} color="#059669" />
            <Text className="ml-2 text-emerald-700 font-rubik-medium text-sm">
              Speak with a doctor
            </Text>
          </TouchableOpacity>
        )}
        
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-2">
            <TextInput
              ref={inputRef}
              placeholder="Type a message..."
              value={inputMessage}
              onChangeText={setInputMessage}
              className="flex-1 font-rubik text-gray-800"
              multiline
              maxLength={1000}
              style={{ maxHeight: 100 }}
            />
            
            {/* Additional features like image upload could go here */}
          </View>
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={isLoading || !inputMessage.trim()}
            className={`rounded-full p-2.5 ${
              isLoading || !inputMessage.trim() 
                ? 'bg-gray-300' 
                : 'bg-indigo-600'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}