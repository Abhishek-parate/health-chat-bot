// app/(tabs)/about.tsx
import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Linking 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = () => {
  const router = useRouter();
  
  const appFeatures = [
    {
      title: "24/7 Health Assistant",
      description: "Get instant answers to your health questions anytime, anywhere.",
      icon: "chatbubble-ellipses"
    },
    {
      title: "Personalized Guidance",
      description: "Receive tailored health recommendations based on your profile and goals.",
      icon: "person"
    },
    {
      title: "Evidence-Based Information",
      description: "Access reliable health content backed by medical research and expertise.",
      icon: "document-text"
    },
    {
      title: "Private & Secure",
      description: "Your health data is encrypted and never shared with third parties.",
      icon: "shield-checkmark"
    }
  ];

  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      bio: "Board-certified physician with 15+ years of experience in preventive medicine."
    },
    {
      name: "Mike Chen",
      role: "Lead AI Engineer",
      bio: "AI specialist with expertise in natural language processing and healthcare applications."
    },
    {
      name: "Emma Rodriguez",
      role: "Health Content Director",
      bio: "Health journalist and certified nutritionist dedicated to evidence-based wellness information."
    }
  ];
  
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-5"
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">About Health Sync</Text>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
            <Text className="text-4xl">🩺</Text>
          </View>
          <View>
            <Text className="text-white text-lg font-semibold mb-1">Health Sync</Text>
            <Text className="text-white/80">Version 1.0.2</Text>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-5 pt-6">
        {/* App Mission */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-3">Our Mission</Text>
          <Text className="text-gray-600 leading-6">
            Health Sync is designed to make reliable health information accessible to everyone. 
            We combine advanced AI technology with expert medical knowledge to provide personalized 
            health guidance that empowers you to make informed decisions about your wellbeing.
          </Text>
        </View>
        
        {/* Key Features */}
        <Text className="text-xl font-bold text-gray-800 mb-4">Key Features</Text>
        {appFeatures.map((feature, index) => (
          <View 
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm mb-4 flex-row"
          >
            <View className="bg-indigo-100 h-12 w-12 rounded-full items-center justify-center mr-4">
              <Ionicons name={feature.icon} size={22} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800 mb-1">{feature.title}</Text>
              <Text className="text-gray-600">{feature.description}</Text>
            </View>
          </View>
        ))}
        
        {/* Our Team */}
        <Text className="text-xl font-bold text-gray-800 mb-4 mt-2">Our Team</Text>
        {teamMembers.map((member, index) => (
          <View 
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm mb-4"
          >
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Text className="text-xl">{member.name.charAt(0)}</Text>
              </View>
              <View>
                <Text className="font-bold text-gray-800">{member.name}</Text>
                <Text className="text-indigo-600">{member.role}</Text>
              </View>
            </View>
            <Text className="text-gray-600">{member.bio}</Text>
          </View>
        ))}
        
        {/* Disclaimer */}
        <View className="bg-amber-50 rounded-xl p-5 border border-amber-200 mb-6">
          <View className="flex-row items-start mb-2">
            <Ionicons name="information-circle" size={22} color="#f59e0b" className="mr-2" />
            <Text className="text-lg font-bold text-gray-800 ml-2">Important Disclaimer</Text>
          </View>
          <Text className="text-gray-700 leading-5">
            Health Sync provides general health information and is not a substitute for professional 
            medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider 
            for medical concerns.
          </Text>
        </View>
        
        {/* Contact & Support */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-3">Contact & Support</Text>
          
          <TouchableOpacity 
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <Ionicons name="mail" size={20} color="#4f46e5" />
            <Text className="text-gray-800 ml-3">support@Health Sync.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <Ionicons name="help-circle" size={20} color="#4f46e5" />
            <Text className="text-gray-800 ml-3">Help Center</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <Ionicons name="shield" size={20} color="#4f46e5" />
            <Text className="text-gray-800 ml-3">Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center py-3"
          >
            <Ionicons name="document-text" size={20} color="#4f46e5" />
            <Text className="text-gray-800 ml-3">Terms of Service</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer */}
        <View className="items-center pb-8">
          <Text className="text-gray-500 text-sm mb-2">© 2025 Health Sync, Inc.</Text>
          <Text className="text-gray-500 text-sm">All Rights Reserved</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutScreen;