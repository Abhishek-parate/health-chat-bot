// app/(doctor)/patient-details.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileService, ConversationService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'consultations'
  
  useEffect(() => {
    if (id && user) {
      loadPatientData();
    }
  }, [id, user]);
  
  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      // Fetch patient profile
      const profile = await ProfileService.getProfile(id);
      setPatient(profile);
      
      // Fetch conversations with this patient
      const doctorConversations = await ConversationService.getDoctorConversations(user.id);
      const patientConversations = doctorConversations.filter(c => c.user_id === id);
      setConversations(patientConversations);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewConsultation = async () => {
    try {
      // Create a new conversation with this patient
      const conversation = await ConversationService.createConversation(id, 'New Consultation');
      
      // Assign the current doctor
      await ConversationService.assignDoctorToConversation(conversation.id, user.id);
      
      // Navigate to the chat screen
      router.push({
        pathname: '/(tabs)/chat',
        params: { conversationId: conversation.id }
      });
    } catch (error) {
      console.error('Error starting new consultation:', error);
    }
  };
  
  const renderConversationItem = ({ item }) => {
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString();
    
    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/(tabs)/chat',
          params: { conversationId: item.id }
        })}
        className="bg-white rounded-xl shadow-sm mb-4 p-4"
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-rubik-bold text-gray-800">
            {item.title || 'Consultation'}
          </Text>
          <View className={`rounded-full px-2 py-0.5 ${
            item.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
          }`}>
            <Text className={`text-xs font-rubik-medium ${
              item.status === 'active' ? 'text-emerald-700' : 'text-gray-700'
            }`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center mt-2">
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text className="text-gray-500 text-sm font-rubik ml-1">
            {formattedDate}
          </Text>
          
          {item.lastMessage && (
            <>
              <View className="h-1 w-1 bg-gray-400 rounded-full mx-2" />
              <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 text-sm font-rubik ml-1">
                Last message: {new Date(item.lastMessage.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </>
          )}
        </View>
        
        {item.lastMessage && (
          <Text className="text-gray-600 font-rubik mt-2" numberOfLines={2}>
            {item.lastMessage.content}
          </Text>
        )}
        
        <View className="flex-row justify-end mt-3">
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(tabs)/chat',
              params: { conversationId: item.id }
            })}
            className="bg-indigo-100 px-4 py-2 rounded-xl"
          >
            <Text className="text-indigo-700 font-rubik-medium">View</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  const PatientOverview = () => (
    <View className="p-4">
      {/* Patient Bio */}
      <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <Text className="text-lg font-rubik-bold text-gray-800 mb-4">About Patient</Text>
        
        <View className="flex-row mb-2">
          <Text className="w-28 text-gray-500 font-rubik">Full Name:</Text>
          <Text className="text-gray-800 font-rubik-medium flex-1">{patient?.full_name || 'Not provided'}</Text>
        </View>
        
        <View className="flex-row mb-2">
          <Text className="w-28 text-gray-500 font-rubik">Email:</Text>
          <Text className="text-gray-800 font-rubik-medium flex-1">{patient?.email || 'Not provided'}</Text>
        </View>
        
        {patient?.phone_number && (
          <View className="flex-row mb-2">
            <Text className="w-28 text-gray-500 font-rubik">Phone:</Text>
            <Text className="text-gray-800 font-rubik-medium flex-1">{patient.phone_number}</Text>
          </View>
        )}
        
        <View className="flex-row mb-2">
          <Text className="w-28 text-gray-500 font-rubik">Patient Since:</Text>
          <Text className="text-gray-800 font-rubik-medium flex-1">
            {new Date(patient?.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>
        
        {patient?.bio && (
          <View className="mt-2">
            <Text className="text-gray-500 font-rubik mb-1">Bio:</Text>
            <Text className="text-gray-800 font-rubik">{patient.bio}</Text>
          </View>
        )}
        
        {!patient?.bio && !patient?.phone_number && (
          <Text className="text-gray-500 font-rubik italic mt-2">
            Limited patient information available
          </Text>
        )}
      </View>
      
      {/* Consultation History Summary */}
      <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Consultation History</Text>
        
        <View className="flex-row justify-between mb-4">
          <View className="items-center">
            <Text className="text-2xl font-rubik-bold text-gray-800">{conversations.length}</Text>
            <Text className="text-gray-500 font-rubik text-sm">Total Consultations</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-2xl font-rubik-bold text-gray-800">
              {conversations.filter(c => c.status === 'active').length}
            </Text>
            <Text className="text-gray-500 font-rubik text-sm">Active</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-2xl font-rubik-bold text-gray-800">
              {conversations.length > 0 
                ? new Date(conversations[0].created_at).toLocaleDateString() 
                : 'N/A'}
            </Text>
            <Text className="text-gray-500 font-rubik text-sm">First Consultation</Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => setActiveTab('consultations')}
          className="bg-gray-100 py-2 rounded-xl items-center"
        >
          <Text className="text-gray-700 font-rubik-medium">View All Consultations</Text>
        </TouchableOpacity>
      </View>
      
      {/* Recent Consultation */}
      {conversations.length > 0 && (
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">Most Recent Consultation</Text>
            <Text className="text-gray-500 font-rubik text-sm">
              {new Date(conversations[0].created_at).toLocaleDateString()}
            </Text>
          </View>
          
          {conversations[0].lastMessage && (
            <Text className="text-gray-600 font-rubik mb-4" numberOfLines={3}>
              {conversations[0].lastMessage.content}
            </Text>
          )}
          
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(tabs)/chat',
              params: { conversationId: conversations[0].id }
            })}
            className="bg-indigo-100 py-2 rounded-xl items-center"
          >
            <Text className="text-indigo-700 font-rubik-medium">Continue Conversation</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity
        onPress={startNewConsultation}
        className="bg-emerald-600 py-3 rounded-xl items-center mb-6"
      >
        <Text className="text-white font-rubik-medium">Start New Consultation</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading patient details...</Text>
      </View>
    );
  }
  
  if (!patient) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="alert-circle" size={50} color="#ef4444" />
        <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
          Patient Not Found
        </Text>
        <Text className="text-gray-500 text-center font-rubik mb-6">
          The patient profile you're looking for couldn't be found.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(doctor)/patients')}
          className="bg-indigo-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-rubik-medium">Back to Patients</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header with Patient Info */}
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
          <Text className="text-2xl font-rubik-bold text-white">Patient Details</Text>
        </View>
        
        {/* Patient summary card */}
        <View className="flex-row items-center mt-2">
          <View className="h-16 w-16 rounded-full bg-white items-center justify-center mr-4">
            {patient.avatar_url ? (
              <Image 
                source={{ uri: patient.avatar_url }} 
                className="h-16 w-16 rounded-full" 
              />
            ) : (
              <Text className="text-2xl font-rubik-bold text-emerald-600">
                {patient.full_name?.charAt(0) || 'P'}
              </Text>
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-white text-xl font-rubik-bold">{patient.full_name}</Text>
            
            <View className="flex-row items-center mt-1">
              <Text className="text-white/80 font-rubik">
                {conversations.length} {conversations.length === 1 ? 'consultation' : 'consultations'}
              </Text>
              
              {patient.phone_number && (
                <>
                  <View className="h-1 w-1 bg-white/50 rounded-full mx-2" />
                  <Text className="text-white/80 font-rubik">{patient.phone_number}</Text>
                </>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={startNewConsultation}
            className="bg-white p-2.5 rounded-full"
          >
            <Ionicons name="chatbubble" size={22} color="#10b981" />
          </TouchableOpacity>
        </View>
        
        {/* Tab selector */}
        <View className="flex-row bg-white/20 rounded-full p-1 mt-6">
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-full ${
              activeTab === 'overview' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text className={`text-center font-rubik-medium ${
              activeTab === 'overview' ? 'text-emerald-600' : 'text-white'
            }`}>
              Overview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('consultations')}
            className={`flex-1 py-2 rounded-full ${
              activeTab === 'consultations' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text className={`text-center font-rubik-medium ${
              activeTab === 'consultations' ? 'text-emerald-600' : 'text-white'
            }`}>
              Consultations
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Content based on active tab */}
      {activeTab === 'overview' ? (
        <ScrollView>
          <PatientOverview />
        </ScrollView>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="bg-white rounded-xl p-6 shadow-sm items-center">
              <Ionicons name="chatbubbles" size={40} color="#9ca3af" />
              <Text className="text-gray-800 mt-2 font-rubik-medium text-center">
                No consultations yet
              </Text>
              <Text className="text-gray-500 text-center mt-1 font-rubik">
                You haven't had any consultations with this patient
              </Text>
              <TouchableOpacity
                onPress={startNewConsultation}
                className="bg-emerald-600 px-4 py-2 rounded-xl mt-4"
              >
                <Text className="text-white font-rubik-medium">Start First Consultation</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}