// components/chat/ChatInterface.tsx - Optimized implementation
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  ScrollView,
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Text,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { playMessageSentSound, playMessageReceivedSound } from '@/utils/notificationService';
import { Message } from '@/lib/supabaseService';

// Simple Message Bubble component (replace with your own if needed)
const MessageBubble = React.memo(({ 
  message, 
  isUser, 
  timestamp,
  isError
}: { 
  message: string; 
  isUser: boolean; 
  timestamp: Date;
  isError?: boolean;
}) => {
  // Format time as HH:MM
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <View style={[
      styles.messageBubbleContainer,
      isUser ? styles.userMessageContainer : styles.otherMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        isUser 
          ? (isError ? styles.errorBubble : styles.userBubble) 
          : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser 
            ? (isError ? styles.errorText : styles.userText) 
            : styles.otherText
        ]}>
          {message}
        </Text>
        <Text style={[
          styles.timeText,
          isUser 
            ? (isError ? styles.errorTimeText : styles.userTimeText) 
            : styles.otherTimeText
        ]}>
          {timeString}
        </Text>
      </View>
    </View>
  );
});

// Define the Chat Interface Props
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

  // Render messages safely with direct manual approach
  const renderMessages = () => {
    // Filter out invalid messages
    const validMessages = messages.filter(msg => msg && msg.content);
    
    if (validMessages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
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
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {renderMessages()}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        {isDisabled ? (
          <View style={styles.disabledContainer}>
            <Text style={styles.disabledText}>
              This conversation has been closed
            </Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
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
              style={[
                styles.sendButton,
                isLoading || !inputMessage.trim() || isDisabled
                  ? styles.disabledButton
                  : isDoctor
                    ? styles.doctorButton
                    : styles.userButton
              ]}
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontFamily: 'Rubik-Regular',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 8,
    backgroundColor: 'white',
  },
  disabledContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  disabledText: {
    color: '#6B7280',
    fontFamily: 'Rubik-Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 100,
    fontFamily: 'Rubik-Regular',
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  doctorButton: {
    backgroundColor: '#10B981',
  },
  userButton: {
    backgroundColor: '#3B82F6',
  },
  messageBubbleContainer: {
    maxWidth: '75%',
    marginBottom: 16,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#FEE2E2',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontFamily: 'Rubik-Regular',
  },
  userText: {
    color: 'white',
  },
  otherText: {
    color: '#1F2937',
  },
  errorText: {
    color: '#B91C1C',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  otherTimeText: {
    color: '#6B7280',
  },
  errorTimeText: {
    color: '#DC2626',
    textAlign: 'right',
  },
});

export default ChatInterface;