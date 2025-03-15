// app/(tabs)/request-doctor.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { requestDoctorConsultation } from '@/lib/chatService';
import { ProfileService } from '@/lib/supabaseService';

export default function RequestDoctorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('normal'); // 'low', 'normal', 'high'
  const [isLoading, setIsLoading] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  
  // Load available doctors on component mount
  React.useEffect(() => {
    fetchAvailableDoctors();
  }, []);
  
  const fetchAvailableDoctors = async () => {
    try {
      const doctors = await ProfileService.getAvailableDoctors();
      setAvailableDoctors(doctors);
    } catch (error) {
      console.error('Error fetching available doctors:', error);
    }
  };
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your consultation request');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success, conversationId } = await requestDoctorConsultation(
        user.id,
        reason
      );
      
      if (success && conversationId) {
        Alert.alert(
          'Request Submitted',
          'Your doctor consultation request has been submitted. A healthcare professional will review it shortly.',
          [
            {
              text: 'View Chat',
              onPress: () => router.push({
                pathname: '/(tabs)/chat',
                params: { conversationId }
              })
            }
          ]
        );
      } else {
        throw new Error('Failed to create doctor request');
      }
    } catch (error) {
      console.error('Error submitting doctor request:', error);
      Alert.alert('Error', 'There was an error submitting your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getUrgencyColor = (level) => {
    switch(level) {
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'normal':
        return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };
  
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
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-rubik-bold text-white">Request Doctor</Text>
        </View>
        
        <Text className="text-white/80 mt-2 font-rubik">
          Submit a request to speak with a healthcare professional about your health concerns
        </Text>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-6">
          {/* Available doctors information */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={22} color="#4f46e5" />
              <Text className="text-gray-800 font-rubik-bold text-lg ml-2">Doctor Availability</Text>
            </View>
            
            <Text className="text-gray-600 font-rubik mb-3">
              We currently have {availableDoctors.length} healthcare professionals available to assist you.
            </Text>
            
            {availableDoctors.length > 0 ? (
              <View className="bg-emerald-50 px-4 py-3 rounded-lg">
                <Text className="text-emerald-700 font-rubik">
                  Doctors are available now. Your request will be processed promptly.
                </Text>
              </View>
            ) : (
              <View className="bg-amber-50 px-4 py-3 rounded-lg">
                <Text className="text-amber-700 font-rubik">
                  No doctors are currently online. Your request will be processed when a healthcare professional becomes available.
                </Text>
              </View>
            )}
          </View>
          
          {/* Request form */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-gray-800 font-rubik-bold text-lg mb-4">
              Consultation Details
            </Text>
            
            <Text className="text-gray-700 font-rubik-medium mb-2">
              Reason for Consultation*
            </Text>
            <View className="border border-gray-200 rounded-xl mb-4">
              <TextInput
                placeholder="Please describe your health concern in detail..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="p-4 min-h-[120px] text-gray-800 font-rubik"
                value={reason}
                onChangeText={setReason}
              />
            </View>
            
            <Text className="text-gray-700 font-rubik-medium mb-2">
              Urgency Level
            </Text>
            <View className="flex-row justify-between mb-6">
              {['low', 'normal', 'high'].map((level) => {
                const isSelected = urgency === level;
                const colors = getUrgencyColor(level);
                
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setUrgency(level)}
                    className={`border rounded-xl py-2 px-4 items-center w-[31%] ${
                      isSelected 
                        ? `${colors.bg} border-transparent` 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text className={`capitalize font-rubik-medium ${
                      isSelected ? colors.text : 'text-gray-600'
                    }`}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text className="text-gray-500 text-sm font-rubik mb-6">
              Note: This is not an emergency service. If you are experiencing a medical emergency, 
              please call emergency services immediately.
            </Text>
            
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || !reason.trim()}
              className={`py-3.5 rounded-xl items-center ${
                isLoading || !reason.trim() ? 'bg-gray-300' : 'bg-indigo-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-rubik-bold">Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* FAQ */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-8">
            <Text className="text-gray-800 font-rubik-bold text-lg mb-4">
              Frequently Asked Questions
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-800 font-rubik-medium mb-1">
                How long will it take to get a response?
              </Text>
              <Text className="text-gray-600 font-rubik">
                Most requests are reviewed within 30 minutes during business hours. 
                Response times may vary based on doctor availability.
              </Text>
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-800 font-rubik-medium mb-1">
                Is there a cost for doctor consultations?
              </Text>
              <Text className="text-gray-600 font-rubik">
                Doctor consultations are included with your HealthAssist subscription 
                at no additional cost.
              </Text>
            </View>
            
            <View>
              <Text className="text-gray-800 font-rubik-medium mb-1">
                Can doctors prescribe medication?
              </Text>
              <Text className="text-gray-600 font-rubik">
                Our platform is for informational purposes only. Doctors cannot prescribe 
                medication through this platform but may advise you to see your primary care 
                physician when necessary.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}