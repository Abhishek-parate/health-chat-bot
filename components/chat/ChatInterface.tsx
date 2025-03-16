// components/chat/ChatInterface.tsx - Converted to use NativeWind
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  ScrollView,
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Text,
  Platform,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { 
  playMessageSentSound, 
  playMessageReceivedSound,
  playSimpleSound
} from '@/utils/notificationService';

// Simple Message Bubble component with NativeWind styling
const MessageBubble = React.memo(({ 
  message, 
  isUser, 
  timestamp,
  isError
}) => {
  // Format time as HH:MM
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <View className={`max-w-[75%] mb-4 ${isUser ? 'self-end' : 'self-start'}`}>
      <View 
        className={`p-3 rounded-2xl ${
          isUser 
            ? (isError ? 'bg-red-100 rounded-tr-sm' : 'bg-blue-500 rounded-tr-sm') 
            : 'bg-gray-100 rounded-tl-sm'
        }`}
      >
        <Text 
          className={`font-['Rubik-Regular'] ${
            isUser 
              ? (isError ? 'text-red-700' : 'text-white') 
              : 'text-gray-800'
          }`}
        >
          {message}
        </Text>
        <Text 
          className={`text-xs mt-1 ${
            isUser 
              ? (isError ? 'text-red-600 text-right' : 'text-white/80 text-right') 
              : 'text-gray-500'
          }`}
        >
          {timeString}
        </Text>
      </View>
    </View>
  );
});

// Explicitly set displayName to fix the error
MessageBubble.displayName = 'MessageBubble';

// Handle playing sound with fallback mechanism
const playMessageSound = async (isSent = true) => {
  try {
    // Try main method first
    if (isSent) {
      await playMessageSentSound();
    } else {
      await playMessageReceivedSound();
    }
  } catch (error) {
    console.log('Falling back to simple sound method');
    try {
      // Fall back to simple method if the main one fails
      await playSimpleSound(isSent);
    } catch (fallbackError) {
      console.error('Both sound methods failed, using vibration as last resort');
      // Last resort - just vibrate
      Vibration.vibrate(isSent ? 100 : 300);
    }
  }
};

// Define the Chat Interface Props
const ChatInterface = ({
  conversationId,
  initialMessages = [],
  onSendMessage,
  isDoctor = false,
  isDisabled = false,
  userId,
  isActive = true
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const subscription = useRef(null);
  
  // Track seen message IDs to prevent duplicate notifications
  const seenMessageIds = useRef(new Set());

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (conversationId) {
      try {
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
              
              // Skip this message if we've already seen it
              if (seenMessageIds.current.has(newMessage.id)) {
                console.log(`Skipping already processed message: ${newMessage.id}`);
                return;
              }
              
              // Mark this message as seen
              seenMessageIds.current.add(newMessage.id);
              
              // Only add message if it's not from the current user
              const isMine = newMessage.sender_id === userId;
              
              // Add message to the list if not already there
              setMessages(prev => {
                // Check if message with same content and sender already exists
                // This handles both temp IDs and real IDs
                const exists = prev.some(msg => 
                  msg.id === newMessage.id || 
                  (msg.content === newMessage.content && 
                   msg.sender_id === newMessage.sender_id &&
                   Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000)
                );

                if (exists) {
                  // If the message exists, replace the temporary one with the real one
                  return prev.map(msg => {
                    if (msg.content === newMessage.content && 
                        msg.sender_id === newMessage.sender_id &&
                        Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000) {
                      return newMessage;
                    }
                    return msg;
                  });
                }
                
                // If it doesn't exist, add it
                // Play sound for new message if it's not mine and app is active
                if (!isMine && isActive) {
                  playMessageSound(false);
                }
                return [...prev, newMessage];
              });
            }
          })
          .subscribe();
        
        subscription.current = messageSubscription;
      } catch (err) {
        console.error('Error setting up message subscription:', err);
      }
      
      // Cleanup subscription on unmount
      return () => {
        if (subscription.current) {
          try {
            supabase.removeChannel(subscription.current);
          } catch (err) {
            console.error('Error removing channel:', err);
          }
        }
      };
    }
  }, [conversationId, userId, isActive]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isDisabled) return;
    
    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Play sound when sending message using the new wrapper function
      playMessageSound(true);
      
      // Send message through the parent component
      const error = await onSendMessage(messageText);
      
      if (error) {
        console.error('Error sending message:', error);
        // Show error message if sending failed
        setMessages(prev => [
          ...prev, 
          {
            id: `error-${Date.now()}`,
            content: 'Failed to send message',
            sender_type: isDoctor ? 'doctor' : 'user',
            role: isDoctor ? 'doctor' : 'user',
            created_at: new Date().toISOString(),
            is_read: true,
            sender_id: userId,
            error: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (text) => {
    setInputMessage(text);
  };

  // Render messages safely with direct manual approach
  const renderMessages = () => {
    // Filter out invalid messages
    const validMessages = messages.filter(msg => msg && msg.content);
    
    if (validMessages.length === 0) {
      return (
        <View className="items-center justify-center py-10">
          <Text className="text-gray-500 font-['Rubik-Regular']">No messages yet</Text>
        </View>
      );
    }
    
    return validMessages.map(item => {
      try {
        // Handle different message format structures
        const senderType = item.sender_type || item.role || 'unknown';
        const isUser = senderType === 'user';
        const isCurrentUser = isDoctor ? !isUser : isUser;
        
        return (
          <MessageBubble 
            key={item.id.toString()} 
            message={item.content} 
            isUser={isCurrentUser}
            timestamp={new Date(item.created_at || new Date())}
            isError={!!item.error}
          />
        );
      } catch (error) {
        console.error('Error rendering message:', error);
        return null; // Skip rendering this message
      }
    });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {renderMessages()}
      </ScrollView>
      
      <View className="border-t border-gray-200 p-2 bg-white z-10 shadow-sm">
        {isDisabled ? (
          <View className="bg-gray-100 rounded-lg p-3 items-center">
            <Text className="text-gray-500 font-['Rubik-Medium']">
              This conversation has been closed
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center mb-14">
            <TextInput
              className="flex-1 bg-gray-100 rounded-3xl px-4 py-2 mr-2 min-h-10 max-h-24 font-['Rubik-Regular'] text-gray-900"
              placeholder="Type a message..."
              value={inputMessage}
              onChangeText={handleInputChange}
              multiline={true}
              editable={!isDisabled}
              placeholderTextColor="#9CA3AF"
            />
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || isDisabled}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isLoading || !inputMessage.trim() || isDisabled
                  ? 'bg-gray-400'
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

      {/* Add extra padding at bottom to ensure content stays above tab bar */}
      <View className={`h-${Platform.OS === 'ios' ? '8' : '5'}`} />
    </View>
  );
};

// Explicitly set displayName to fix the error
ChatInterface.displayName = 'ChatInterface';

export { ChatInterface };
export default ChatInterface;