import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from './ui/MessageBubble';
import { getChatCompletion } from '../lib/groq';
import { executeQuery } from '../lib/db';
import { useAuth } from '@clerk/clerk-expo';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

type ChatInterfaceProps = {
  conversationId?: number;
};

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { userId } = useAuth();

  // Load messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      // Welcome message for new conversation
      setMessages([
        {
          id: 'welcome',
          content: "Hello! I'm your health assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const result = await executeQuery(
        `SELECT id, content, is_user, created_at FROM messages 
         WHERE conversation_id = $1 
         ORDER BY created_at ASC`,
        [conversationId]
      );

      const loadedMessages = result.map((msg: any) => ({
        id: msg.id.toString(),
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.created_at),
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessage = async (content: string, isUser: boolean) => {
    try {
      let activeConversationId = conversationId;

      // Create a new conversation if needed
      if (!activeConversationId) {
        const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        const conversationResult = await executeQuery(
          `INSERT INTO conversations (user_id, title) 
           VALUES ($1, $2) 
           RETURNING id`,
          [userId, title]
        );
        activeConversationId = conversationResult[0].id;
      }

      // Save the message
      const result = await executeQuery(
        `INSERT INTO messages (conversation_id, content, is_user) 
         VALUES ($1, $2, $3) 
         RETURNING id, created_at`,
        [activeConversationId, content, isUser]
      );

      return {
        id: result[0].id.toString(),
        conversationId: activeConversationId,
        timestamp: new Date(result[0].created_at),
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessageText = inputMessage.trim();
    setInputMessage('');
    
    try {
      // Add user message to UI
      const tempUserId = Date.now().toString();
      const tempUserMessage = {
        id: tempUserId,
        content: userMessageText,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Save user message to database
      const savedUserMessage = await saveMessage(userMessageText, true);
      
      // Format messages for AI
      const messageHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Add current message
      messageHistory.push({ role: 'user', content: userMessageText });

      // Get AI response
      const aiResponse = await getChatCompletion(messageHistory);
      
      if (aiResponse && aiResponse.content) {
        // Save AI response to database
        const savedAiMessage = await saveMessage(aiResponse.content, false);
        
        // Add AI response to UI
        setMessages(prev => [
          ...prev.map(msg => msg.id === tempUserId ? 
            { ...msg, id: savedUserMessage.id.toString() } : msg),
          {
            id: savedAiMessage.id.toString(),
            content: aiResponse.content,
            isUser: false,
            timestamp: savedAiMessage.timestamp,
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item.content}
            isUser={item.isUser}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
      
      <View className="flex-row items-center p-2 border-t border-gray-200 bg-white">
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
          placeholder="Type your message..."
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className={`rounded-full p-2 ${
            isLoading || !inputMessage.trim() ? 'bg-gray-300' : 'bg-primary'
          }`}
        >
          <Ionicons
            name="send"
            size={24}
            color={isLoading || !inputMessage.trim() ? '#666' : 'white'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}