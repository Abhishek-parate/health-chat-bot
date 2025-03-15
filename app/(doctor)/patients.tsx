// app/(doctor)/patients.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ConversationService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function DoctorPatientsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);
  
  const loadPatients = async () => {
    setIsLoading(true);
    try {
      // Get all conversations for this doctor
      const conversations = await ConversationService.getDoctorConversations(user.id);
      
      // Extract unique patients from conversations
      const uniquePatients = {};
      conversations.forEach(convo => {
        if (convo.profiles && !uniquePatients[convo.user_id]) {
          uniquePatients[convo.user_id] = {
            id: convo.user_id,
            fullName: convo.profiles.full_name,
            avatar: convo.profiles.avatar_url,
            conversationCount: 1,
            latestConversation: convo,
          };
        } else if (uniquePatients[convo.user_id]) {
          uniquePatients[convo.user_id].conversationCount += 1;
          
          // Check if this conversation is more recent
          if (new Date(convo.updated_at) > new Date(uniquePatients[convo.user_id].latestConversation.updated_at)) {
            uniquePatients[convo.user_id].latestConversation = convo;
          }
        }
      });
      
      setPatients(Object.values(uniquePatients));
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };
  
  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;
    return patient.fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const renderPatientItem = ({ item: patient }) => {
    // Format last activity date
    const lastActivity = new Date(patient.latestConversation.updated_at);
    const formattedDate = lastActivity.toLocaleDateString();
    
    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/(doctor)/patient-details',
          params: { id: patient.id }
        })}
        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      >
        <View className="p-4">
          <View className="flex-row items-center">
            <View className="h-16 w-16 rounded-full bg-indigo-100 items-center justify-center mr-4">
              {patient.avatar ? (
                <Image 
                  source={{ uri: patient.avatar }} 
                  className="h-16 w-16 rounded-full" 
                />
              ) : (
                <Text className="text-2xl font-rubik-bold text-indigo-600">
                  {patient.fullName?.charAt(0) || 'P'}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-xl font-rubik-bold text-gray-800">
                {patient.fullName}
              </Text>
              
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500 font-rubik">
                  {patient.conversationCount} {patient.conversationCount === 1 ? 'consultation' : 'consultations'}
                </Text>
                <View className="h-1 w-1 bg-gray-400 rounded-full mx-2" />
                <Text className="text-gray-500 font-rubik">
                  Last active: {formattedDate}
                </Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
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
          <Text className="text-2xl font-rubik-bold text-white">Your Patients</Text>
        </View>
        
        {/* Search bar */}
        <View className="bg-white/20 flex-row items-center rounded-xl p-2 mt-2">
          <Ionicons name="search" size={20} color="white" className="mx-2" />
          <TextInput
            placeholder="Search patients..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 h-10 text-white font-rubik ml-1"
            style={{ color: 'white' }}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="p-2"
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
      
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-4 text-gray-600 font-rubik">Loading patients...</Text>
        </View>
      ) : filteredPatients.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="people" size={50} color="#9ca3af" />
          <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
            {searchQuery 
              ? 'No patients match your search' 
              : 'No patients found'}
          </Text>
          <Text className="text-gray-500 text-center font-rubik">
            {searchQuery 
              ? `Try a different search term` 
              : "You haven't had any consultations with patients yet."}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="mt-4 bg-indigo-600 px-6 py-2 rounded-full"
            >
              <Text className="text-white font-rubik-medium">Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10b981']}
            />
          }
          ListHeaderComponent={
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-gray-600 font-rubik">
                {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
              </Text>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-emerald-600 font-rubik-medium mr-1">Sort by Recent</Text>
                <Ionicons name="chevron-down" size={16} color="#10b981" />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}