
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { generateAIResponse } from '../../../lib/groq';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Types for the chat messages
type MessageRole = 'user' | 'assistant';
type Message = {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingAnimation, setTypingAnimation] = useState(false);
  const [chatTitle, setChatTitle] = useState(params.chatTitle as string || 'New Chat');
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const isNewChat = params.isNew === 'true';
  
  // Suggested questions for empty chats
  const suggestedQuestions = [
    "What's the best way to stay hydrated?",
    "How can I improve my sleep quality?",
    "What are effective stress management techniques?",
    "How much exercise do I need daily?"
  ];
  
  useEffect(() => {
    if (isNewChat && params.topic) {
      const topic = params.topic as string;
      handleSendMessage(`Tell me about ${topic}`);
      // Set a better title based on the topic
      setChatTitle(topic);
    } else if (!isNewChat && params.chatId) {
      // In a real app, you would fetch messages for this chat ID
      // This is just a simulation for the example
      fetchChatMessages(params.chatId as string);
    }
  }, [params.chatId, params.topic, isNewChat]);
  
  const fetchChatMessages = (chatId: string) => {
    // This would be an API call in a real app
    // For now, just simulate with a timeout
    setIsLoading(true);
    setTimeout(() => {
      // These messages would come from your database
      const sampleMessages: Message[] = [
        {
          id: '101',
          content: chatId === '1' ? 'What foods should I eat for better nutrition?' : 
                  chatId === '2' ? 'How often should I exercise?' :
                  chatId === '3' ? "I'm having trouble sleeping. Any advice?" :
                  'What are some good ways to manage stress?',
          role: 'user',
          createdAt: new Date(Date.now() - 1000 * 60 * 35)
        },
        {
          id: '102',
          content: chatId === '1' ? 'Great question! For better nutrition, focus on a balanced diet with plenty of fruits, vegetables, lean proteins, and whole grains. Try to include more leafy greens in your diet for essential vitamins and minerals.' : 
                  chatId === '2' ? 'A combination of cardio and strength training 3-4 times per week is ideal for most people.' :
                  chatId === '3' ? 'Consider establishing a regular sleep schedule and avoiding screens at least an hour before bedtime.' :
                  'Regular mindfulness practice can help reduce stress and improve overall mental wellbeing.',
          role: 'assistant',
          createdAt: new Date(Date.now() - 1000 * 60 * 30)
        }
      ];
      setMessages(sampleMessages);
      setIsLoading(false);
    }, 1000);
  };
  
  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && !isLoading) return;
    
    // Clear input if it's from the text input (not from params)
    if (content === inputText) {
      setInputText('');
    }
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setTypingAnimation(true);
    
    try {
      // Format messages for the AI
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current message
      formattedMessages.push({
        role: 'user',
        content
      });
      
      // Get AI response
      const response = await generateAIResponse(formattedMessages);
      
      // Simulate typing for a more natural feel
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add AI message to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't process your request. Please try again.",
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTypingAnimation(false);
    }
  };
  
  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isUser = item.role === 'user';
    const showAvatar = !isUser && (index === 0 || messages[index - 1]?.role === 'user');
    const isConsecutive = index > 0 && messages[index - 1]?.role === item.role;
    
    return (
      <View className={`mb-2 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && showAvatar && (
          <View className="h-10 w-10 rounded-full bg-indigo-100 mr-2 mt-1 items-center justify-center overflow-hidden">
            <Text className="text-xl">🩺</Text>
          </View>
        )}
        
        {!isUser && !showAvatar && <View className="w-10 mr-2" />}
        
        <View className={`max-w-[75%] ${isConsecutive ? 'mt-1' : 'mt-3'}`}>
          <LinearGradient
            colors={isUser ? ['#4f46e5', '#7c3aed'] : ['#F9FAFB', '#F3F4F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`p-3 rounded-2xl ${
              isUser 
                ? 'rounded-br-sm' 
                : 'rounded-bl-sm'
            }`}
          >
            <Text 
              className={`${
                isUser ? 'text-white' : 'text-gray-800'
              } leading-5`}
            >
              {item.content}
            </Text>
          </LinearGradient>
          
          <Text 
            className={`text-xs text-gray-500 mt-1 ${
              isUser ? 'text-right mr-1' : 'ml-1'
            }`}
          >
            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // Render the typing indicator
  const renderTypingIndicator = () => {
    if (!typingAnimation) return null;
    
    return (
      <View className="flex-row mb-4">
        <View className="h-10 w-10 rounded-full bg-indigo-100 mr-2 mt-1 items-center justify-center">
          <Text className="text-xl">🩺</Text>
        </View>
        
        <View className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm max-w-[75%]">
          <View className="flex-row items-center">
            <View className="h-2 w-2 bg-gray-400 rounded-full mx-0.5 animate-bounce" />
            <View className="h-2 w-2 bg-gray-400 rounded-full mx-0.5 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <View className="h-2 w-2 bg-gray-400 rounded-full mx-0.5 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </View>
        </View>
      </View>
    );
  };
  
  const renderSuggestedQuestion = (question: string) => {
    return (
      <TouchableOpacity 
        key={question}
        onPress={() => handleSendMessage(question)}
        className="bg-white border border-gray-200 rounded-full px-4 py-2 mr-3 mb-3"
      >
        <Text className="text-indigo-600">{question}</Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#f9fafb']}
        className="pt-12 pb-4 px-4 border-b border-gray-200"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={24} color="#4f46e5" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-gray-900">{chatTitle}</Text>
              <Text className="text-gray-500 text-sm">Health Assistant</Text>
            </View>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity 
              className="p-2"
              onPress={() => setMessages([])}
            >
              <Ionicons name="trash-outline" size={22} color="#4f46e5" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Chat Area */}
      <View className="flex-1 bg-gray-50">
        {isLoading && messages.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-gray-500 mt-4">Loading conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 justify-center items-center p-5">
            <View className="w-16 h-16 rounded-full bg-indigo-100 items-center justify-center mb-4">
              <Text className="text-3xl">🩺</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              Start a New Conversation
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Ask me anything about health and wellness
            </Text>
            
            <Text className="font-semibold text-gray-700 mb-3">Try asking about:</Text>
            <View className="flex-row flex-wrap justify-center">
              {suggestedQuestions.map(renderSuggestedQuestion)}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            ListFooterComponent={renderTypingIndicator}
          />
        )}
      </View>
      
      {/* Message Input */}
      <BlurView intensity={90} tint="light" className="border-t border-gray-200">
        <View className="px-4 py-3">
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-full px-4 py-2 mr-2">
              <TextInput
                ref={textInputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask your health question..."
                className="flex-1 text-gray-800 min-h-8"
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity 
                className="p-1"
                onPress={() => {
                  // Could add attachment feature here
                }}
              >
                <Ionicons name="attach" size={22} color="#4f46e5" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              className={`rounded-full p-3 ${
                !isLoading && inputText.trim() ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={18} 
                  color="white"
                  style={{ marginLeft: 2 }} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}