// app/(doctor)/guidelines.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Define guidelines sections
const guidelineSections = [
  {
    id: 'communication',
    title: 'Communication Guidelines',
    icon: 'chatbubbles',
    content: [
      'Always maintain a professional and compassionate tone when communicating with patients.',
      'Avoid using complex medical terminology without explanation.',
      'Respond to patient messages within 24 hours during business days.',
      'If you need more information to provide appropriate guidance, ask clear and specific questions.',
      'Remember that text-based communication may lack non-verbal cues, so be thorough and precise.',
      'Always acknowledge the patient\'s concerns and show empathy in your responses.'
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Confidentiality',
    icon: 'shield-checkmark',
    content: [
      'All patient information shared through the platform is confidential and subject to medical privacy laws.',
      'Never share patient information outside of the secure HealthAssist platform.',
      'Be careful not to inadvertently reference one patient\'s information when communicating with another.',
      'If you suspect a privacy breach, report it immediately to the platform administrators.',
      'Do not take screenshots or save patient information on personal devices.',
      'Log out of your account when not actively using the platform.'
    ]
  },
  {
    id: 'scope',
    title: 'Scope of Service',
    icon: 'medical',
    content: [
      'HealthAssist is designed for informational and consultative purposes only.',
      'Do not use this platform for emergency medical situations. Direct patients to emergency services when appropriate.',
      'Refrain from making definitive diagnoses based solely on digital consultations.',
      'Prescriptions cannot be issued through this platform. Refer patients to in-person care when medication is needed.',
      'When a patient\'s needs exceed the platform\'s capabilities, provide clear guidance on appropriate next steps.',
      'Remember that this service supplements but does not replace traditional healthcare.'
    ]
  },
  {
    id: 'documentation',
    title: 'Documentation Standards',
    icon: 'document-text',
    content: [
      'Document all substantive patient interactions within the platform.',
      'Use clear, concise language when documenting consultations.',
      'Include your reasoning process for any recommendations provided.',
      'Record any referrals or follow-up instructions given to patients.',
      'Document any instances where you advised a patient to seek in-person care.',
      'Regular audits of documentation may be conducted to ensure quality standards.'
    ]
  },
  {
    id: 'ethics',
    title: 'Ethical Considerations',
    icon: 'heart',
    content: [
      'Always prioritize patient wellbeing in your recommendations.',
      'Provide objective information even when patients may be seeking specific answers.',
      'Respect patient autonomy while ensuring they have accurate information for decision-making.',
      'Avoid conflicts of interest, such as recommending specific products or services without disclosure.',
      'Be mindful of vulnerable populations and adjust communication accordingly.',
      'When in doubt about the ethical course of action, consult with platform administrators.'
    ]
  }
];

export default function DoctorGuidelinesScreen() {
  const router = useRouter();
  
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#0d9488']}
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
          <Text className="text-2xl font-rubik-bold text-white">Guidelines</Text>
        </View>
        
        <Text className="text-white/90 font-rubik">
          Professional standards and best practices for healthcare professionals on the HealthAssist platform.
        </Text>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-4 pt-4 pb-10">
        {/* Introduction */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
          <Text className="text-xl font-rubik-bold text-gray-800 mb-3">
            Doctor Guidelines
          </Text>
          
          <Text className="text-gray-600 font-rubik mb-3">
            Welcome to the HealthAssist platform. These guidelines are designed to help you provide the highest quality care while maintaining professional standards.
          </Text>
          
          <Text className="text-gray-600 font-rubik">
            Please familiarize yourself with these guidelines and refer back to them as needed. Adherence to these standards ensures a consistent experience for patients and protects both you and those you serve.
          </Text>
        </View>
        
        {/* Guidelines Sections */}
        {guidelineSections.map((section) => (
          <View key={section.id} className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                <Ionicons name={section.icon} size={20} color="#10b981" />
              </View>
              <Text className="text-lg font-rubik-bold text-gray-800">
                {section.title}
              </Text>
            </View>
            
            {section.content.map((item, index) => (
              <View key={index} className="flex-row mb-3 last:mb-0">
                <Text className="text-emerald-600 font-rubik mr-2">•</Text>
                <Text className="text-gray-600 font-rubik flex-1">{item}</Text>
              </View>
            ))}
          </View>
        ))}
        
        {/* Additional resources */}
        <View className="bg-indigo-50 p-5 rounded-xl shadow-sm mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-3">
            Additional Resources
          </Text>
          
          <TouchableOpacity className="flex-row items-center mb-3">
            <Ionicons name="document-text" size={18} color="#4f46e5" />
            <Text className="text-indigo-600 font-rubik-medium ml-2">
              Telehealth Best Practices Guide
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center mb-3">
            <Ionicons name="book" size={18} color="#4f46e5" />
            <Text className="text-indigo-600 font-rubik-medium ml-2">
              Digital Communication in Healthcare
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle" size={18} color="#4f46e5" />
            <Text className="text-indigo-600 font-rubik-medium ml-2">
              Frequently Asked Questions
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Compliance acknowledgment */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-10">
          <Text className="text-gray-800 font-rubik-medium mb-2">
            Compliance Acknowledgment
          </Text>
          
          <Text className="text-gray-600 font-rubik mb-4">
            By participating as a healthcare professional on the HealthAssist platform, you acknowledge that you have read, understood, and agree to follow these guidelines.
          </Text>
          
          <TouchableOpacity
            className="bg-emerald-600 py-3 rounded-xl items-center"
          >
            <Text className="text-white font-rubik-medium">I Understand and Agree</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}