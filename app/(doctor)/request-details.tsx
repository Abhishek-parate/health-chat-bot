// app/(doctor)/request-details.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { DoctorRequestService, ProfileService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [patient, setPatient] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    if (id && user) {
      loadRequestDetails();
    }
  }, [id, user]);
  
  const loadRequestDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch the request details
      const requests = await DoctorRequestService.getPendingRequests();
      const foundRequest = requests.find(r => r.id === id);
      
      if (!foundRequest) {
        Alert.alert('Error', 'Request not found');
        router.back();
        return;
      }
      
      setRequest(foundRequest);
      
      // Fetch patient details
      if (foundRequest.user_id) {
        const patientProfile = await ProfileService.getProfile(foundRequest.user_id);
        setPatient(patientProfile);
      }
    } catch (error) {
      console.error('Error loading request details:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptRequest = async () => {
    if (!request || !user) return;
    
    setActionLoading(true);
    try {
      const success = await DoctorRequestService.updateRequestStatus(
        request.id,
        'approved',
        user.id
      );
      
      if (success) {
        Alert.alert(
          'Request Accepted',
          'You have successfully accepted this consultation request.',
          [
            {
              text: 'View Conversation',
              onPress: () => {
                if (request.conversation_id) {
                  router.push({
                    pathname: '/(tabs)/chat',
                    params: { conversationId: request.conversation_id }
                  });
                }
              }
            },
            {
              text: 'Back to Requests',
              onPress: () => router.push('/(doctor)/requests')
            }
          ]
        );
      } else {
        throw new Error('Failed to update request status');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleRejectRequest = async () => {
    if (!request || !user) return;
    
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this consultation request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const success = await DoctorRequestService.updateRequestStatus(
                request.id,
                'rejected',
                user.id
              );
              
              if (success) {
                Alert.alert('Request Rejected', 'You have rejected this consultation request.');
                router.push('/(doctor)/requests');
              } else {
                throw new Error('Failed to update request status');
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading request details...</Text>
      </View>
    );
  }
  
  if (!request) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="alert-circle" size={50} color="#ef4444" />
        <Text className="text-xl text-gray-800 font-rubik-bold text-center mt-4 mb-2">
          Request Not Found
        </Text>
        <Text className="text-gray-500 text-center font-rubik mb-6">
          The consultation request you're looking for couldn't be found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-indigo-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-rubik-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
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
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-rubik-bold text-white">Request Details</Text>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Request Status */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">Request Status</Text>
            <View className={`rounded-full px-3 py-1 ${
              request.status === 'pending' ? 'bg-amber-100' : 
              request.status === 'approved' ? 'bg-emerald-100' : 
              'bg-red-100'
            }`}>
              <Text className={`font-rubik-medium ${
                request.status === 'pending' ? 'text-amber-800' : 
                request.status === 'approved' ? 'text-emerald-800' : 
                'text-red-800'
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View className="flex-row mb-2">
            <Text className="w-28 text-gray-500 font-rubik">Request ID:</Text>
            <Text className="text-gray-800 font-rubik-medium flex-1">{request.id}</Text>
          </View>
          
          <View className="flex-row mb-2">
            <Text className="w-28 text-gray-500 font-rubik">Created:</Text>
            <Text className="text-gray-800 font-rubik-medium flex-1">
              {new Date(request.created_at).toLocaleString()}
            </Text>
          </View>
          
          <View className="flex-row">
            <Text className="w-28 text-gray-500 font-rubik">Updated:</Text>
            <Text className="text-gray-800 font-rubik-medium flex-1">
              {new Date(request.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>
        
        {/* Patient Information */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">Patient Information</Text>
          
          <View className="flex-row items-center mb-4">
            <View className="h-16 w-16 rounded-full bg-indigo-100 items-center justify-center mr-4">
              {patient?.avatar_url ? (
                <Image 
                  source={{ uri: patient.avatar_url }} 
                  className="h-16 w-16 rounded-full" 
                />
              ) : (
                <Text className="text-2xl font-rubik-bold text-indigo-600">
                  {patient?.full_name?.charAt(0) || 'P'}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-xl font-rubik-bold text-gray-800">
                {patient?.full_name || 'Patient'}
              </Text>
              <Text className="text-gray-600 font-rubik">{patient?.email || request.user_id}</Text>
            </View>
          </View>
          
          {patient?.phone_number && (
            <View className="flex-row mb-2">
              <Text className="w-28 text-gray-500 font-rubik">Phone:</Text>
              <Text className="text-gray-800 font-rubik-medium flex-1">{patient.phone_number}</Text>
            </View>
          )}
          
          {patient?.bio && (
            <View className="mt-2">
              <Text className="text-gray-500 font-rubik mb-1">About:</Text>
              <Text className="text-gray-800 font-rubik">{patient.bio}</Text>
            </View>
          )}
        </View>
        
        {/* Consultation Reason */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-2">Consultation Reason</Text>
          
          <Text className="text-gray-800 font-rubik">
            {request.reason || 'No reason provided by the patient.'}
          </Text>
        </View>
        
        {/* Action Buttons */}
        {request.status === 'pending' && (
          <View className="flex-row justify-between mb-8">
            <TouchableOpacity
              onPress={handleRejectRequest}
              disabled={actionLoading}
              className="bg-white border border-red-500 rounded-xl py-3 w-[48%] items-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text className="text-red-500 font-rubik-medium">Decline</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleAcceptRequest}
              disabled={actionLoading}
              className="bg-emerald-600 rounded-xl py-3 w-[48%] items-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-rubik-medium">Accept Request</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* View Conversation Button (if approved) */}
        {request.status === 'approved' && request.conversation_id && (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(tabs)/chat',
              params: { conversationId: request.conversation_id }
            })}
            className="bg-indigo-600 rounded-xl py-3 items-center mb-8"
          >
            <Text className="text-white font-rubik-medium">View Conversation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}