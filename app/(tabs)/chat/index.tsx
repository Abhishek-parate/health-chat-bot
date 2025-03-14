// app/(tabs)/chat.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/clerk';

// Message type definition
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI health assistant. How can I help you today?",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock AI response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getMockResponse(inputText.trim()),
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // Simple mock response generator
  const getMockResponse = (input: string) => {
    // Sample responses based on keywords
    if (input.toLowerCase().includes('headache')) {
      return "Headaches can be caused by various factors including stress, dehydration, lack of sleep, or eye strain. For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. If headaches are severe, persistent, or accompanied by other symptoms, please consult a healthcare provider.\n\nDisclaimer: This information is not medical advice. Please consult a healthcare professional for proper diagnosis and treatment.";
    }
    
    if (input.toLowerCase().includes('cold') || input.toLowerCase().includes('flu')) {
      return "Common cold and flu symptoms include fever, cough, sore throat, body aches, and fatigue. Rest, fluids, and over-the-counter medications can help manage symptoms. If symptoms are severe or persistent, consult a healthcare provider.\n\nDisclaimer: This information is not medical advice. Please consult a healthcare professional for proper diagnosis and treatment.";
    }
    
    if (input.toLowerCase().includes('diet') || input.toLowerCase().includes('nutrition')) {
      return "A balanced diet should include fruits, vegetables, whole grains, lean proteins, and healthy fats. It's recommended to limit processed foods, added sugars, and excess sodium. Everyone's nutritional needs vary based on age, activity level, and health conditions.\n\nDisclaimer: This information is not medical advice. Please consult a healthcare professional or registered dietitian for personalized nutrition guidance.";
    }
    
    // Default response
    return "Thank you for your question. While I aim to provide helpful health information, I'm an AI assistant and not a medical professional. For accurate diagnosis and treatment, please consult with a qualified healthcare provider.\n\nIs there anything specific about this topic you'd like to know more about?";
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View 
        className={`px-4 py-3 rounded-lg max-w-[80%] my-1 ${
          isUser 
            ? 'bg-indigo-600 self-end rounded-tr-none' 
            : 'bg-gray-200 self-start rounded-tl-none'
        }`}
      >
        <Text 
          className={isUser ? 'text-white' : 'text-gray-800'}
        >
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
        <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
          <Text className="text-xl">🩺</Text>
        </View>
        <Text className="text-lg font-semibold text-gray-800 ml-3">
          HealthAssist Chat
        </Text>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        {isLoading && (
          <View className="items-center justify-center py-2">
            <ActivityIndicator size="small" color="#4f46e5" />
          </View>
        )}
        
        <View className="flex-row items-center p-2 border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2"
            placeholder="Type your health question..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
        
        <View className="bg-blue-50 p-2 border-t border-blue-100">
          <Text className="text-xs text-gray-600 text-center">
            HealthAssist provides general information only and is not a substitute for professional medical advice.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}