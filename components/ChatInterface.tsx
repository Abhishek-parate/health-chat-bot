// components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  View, 
  ScrollView,
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { playMessageSentSound, playMessageReceivedSound } from '@/utils/notificationService';

// Import or define your MessageBubble component
const MessageBubble = memo(({ message = '', isUser = false, timestamp = new Date() }) => {
  return (
    <View className={`max-w-3/4 mb-4 ${isUser ? 'items-end self-end' : 'items-start self-start'}`}>
      <View className={`px-4 py-2 ${isUser ? 'bg-blue-500 rounded-xl rounded-tr-none' : 'bg-gray-100 rounded-xl rounded-tl-none'}`}>
        <Text className={`${isUser ? 'text-white' : 'text-gray-800'} font-rubik`}>{message}</Text>
        <Text className={`${isUser ? 'text-blue-200' : 'text-gray-500'} text-xs mt-1 font-rubik`}>{
          timestamp instanceof Date ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'
        }</Text>
      </View>
    </View>
  );
});

// Define props interface
interface ChatInterfaceProps {
  conversationId?: string | number;
  initialMessages?: any[];
  onSendMessage: (message: string) => Promise<string>;
  isDoctor?: boolean;
  isDisabled?: boolean;
  userId: string;
  isActive?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  initialMessages = [],
  onSendMessage,
  isDoctor = false,
  isDisabled = false,
  userId,
  isActive = true
}) => {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const subscription = useRef<any>(null);

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (conversationId) {
      // Subscribe to new messages for this conversation
      const messageSubscription = supabase
        .channel(`conversation:${conversationId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          // Add new message to the list
          if (payload.new) {
            const newMessage = payload.new;
            
            // Only add message if it's not from the current user
            const isMine = newMessage.sender_id === userId;
            
            // Add message to the list if not already there
            setMessages(prev => {
              // Check if message already exists in our list
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (!exists) {
                // Play sound for new message if it's not mine and app is active
                if (!isMine && isActive) {
                  playMessageReceivedSound();
                }
                return [...prev, newMessage];
              }
              return prev;
            });
          }
        })
        .subscribe();
      
      subscription.current = messageSubscription;
      
      // Cleanup subscription on unmount
      return () => {
        if (subscription.current) {
          supabase.removeChannel(subscription.current);
        }
      };
    }
  }, [conversationId, userId, isActive]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isLoading || isDisabled) return;
    
    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Play sound when sending message
      playMessageSentSound();
      
      // Add optimistic message
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        content: messageText,
        sender_type: isDoctor ? 'doctor' : 'user',
        role: isDoctor ? 'doctor' : 'user', // Add both for consistency
        created_at: new Date().toISOString(),
        is_read: true,
        sender_id: userId
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Send message through the parent component
      const error = await onSendMessage(messageText);
      
      if (error) {
        console.error('Error sending message:', error);
        // Show error by replacing the temp message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? {...msg, content: 'Failed to send message', error: true} 
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (text: string): void => {
    setInputMessage(text);
  };

  // Render messages with safe error handling
  const renderMessages = () => {
    return messages
      .filter(msg => msg && msg.content) // Filter out invalid messages
      .map(item => {
        try {
          const senderType = item.sender_type || item.role || 'unknown';
          const isUser = senderType === 'user';
          const isCurrentUser = isDoctor ? !isUser : isUser;
          
          return (
            <MessageBubble
              key={item.id.toString()}
              message={item.content || ''}
              isUser={isCurrentUser}
              timestamp={new Date(item.created_at || new Date())}
            />
          );
        } catch (error) {
          console.error('Error rendering message item:', error);
          return null;
        }
      });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View className="flex items-center justify-center py-10">
            <Text className="text-gray-500 font-rubik">No messages yet</Text>
          </View>
        ) : (
          renderMessages()
        )}
      </ScrollView>
      
      <View className="border-t border-gray-200 px-4 py-2 bg-white">
        {isDisabled ? (
          <View className="bg-gray-100 rounded-lg p-3 items-center">
            <Text className="text-gray-500 font-rubik-medium">
              This conversation has been closed
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 min-h-10 max-h-24 font-rubik"
              placeholder="Type a message..."
              value={inputMessage}
              onChangeText={handleInputChange}
              multiline={true}
              editable={!isDisabled}
            />
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || isDisabled}
              className={`rounded-full p-2 ${
                isLoading || !inputMessage.trim() || isDisabled
                  ? 'bg-gray-300'
                  : isDoctor
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default ChatInterface;