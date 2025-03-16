// app/(patient)/doctor-request-status.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  StatusBar,
  RefreshControl,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DoctorRequestService, DoctorRequest } from '@/lib/supabaseService';
import { supabase } from '@/utils/supabase';

export default function DoctorRequestStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user || !params.id) return;
    
    loadRequestData();
    
    // Set up real-time subscription for updates
    const channel = supabase.channel(`doctor_request_${params.id}`);
    
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'doctor_requests',
        filter: `id=eq.${params.id}`
      }, (payload) => {
        console.log('Request updated:', payload.new);
        // Reload the full request data to get all related information
        loadRequestData();
        
        // Show status change alert
        if (payload.new.status !== payload.old.status) {
          const newStatus = formatStatus(payload.new.status);
          Alert.alert(
            'Request Updated',
            `Your request status has been updated to: ${newStatus}`
          );
        }
      })
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, params.id]);
  
  const formatStatus = (status) => {
    return status
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const loadRequestData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get request details
      const requestData = await DoctorRequestService.getRequest(params.id);
      
      if (!requestData) {
        throw new Error('Request not found');
      }
      
      // Verify this request belongs to the current user
      if (requestData.user_id !== user.id) {
        throw new Error('You do not have permission to view this request');
      }
      
      setRequest(requestData);
      
      // If a doctor has been assigned, get doctor details
      if (requestData.doctor_id) {
        const { data: doctorData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', requestData.doctor_id)
          .maybeSingle();
          
        if (doctorData) {
          setDoctor(doctorData);
        }
      }
    } catch (err) {
      console.error('Error loading request data:', err);
      setError(err.message || 'Could not load request details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadRequestData();
  };
  
  // Cancel request handler
  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel your request for doctor consultation?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await DoctorRequestService.updateRequestStatus(
                params.id,
                'cancelled'
              );
              
              // Update local state
              setRequest({
                ...request,
                status: 'cancelled'
              });
              
              Alert.alert(
                'Request Cancelled',
                'Your doctor consultation request has been cancelled.'
              );
              
              // Navigate back to profile after a short delay
              setTimeout(() => {
                router.replace('/profile');
              }, 1500);
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert(
                'Error',
                'Failed to cancel the request. Please try again.'
              );
            }
          }
        }
      ]
    );
  };
  
  // Go to chat if available
  const handleGoToChat = () => {
    if (request?.conversation_id) {
      router.push({
        pathname: '/chat',
        params: { conversationId: request.conversation_id }
      });
    }
  };
  
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading request details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <View className="bg-white rounded-2xl p-6 items-center shadow-sm w-full max-w-md">
          <View className="bg-red-100 rounded-full w-14 h-14 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={32} color="#dc2626" />
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Error
          </Text>
          <Text className="text-center text-gray-500 mb-6">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-indigo-600 py-3 px-6 rounded-lg w-full items-center"
            onPress={() => router.replace('/profile')}
          >
            <Text className="text-white font-semibold">Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
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
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-xl font-rubik-bold text-white">
            Doctor Request Status
          </Text>
        </View>
      </LinearGradient>
      
      <ScrollView 
        className="flex-1 p-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
          />
        }
      >
        {/* Status Badge */}
        <View className="items-center mb-5">
          <StatusBadge status={request?.status} />
        </View>
        
        {/* Request Info Card */}
        <View className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-rubik-bold text-gray-800">
              Request Details
            </Text>
            <Text className="text-gray-500 text-xs font-rubik">
              ID: #{params.id.slice(0, 8)}
            </Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-500 font-rubik mb-1">
              Requested on
            </Text>
            <Text className="text-gray-800 font-rubik-medium">
              {new Date(request?.created_at).toLocaleString()}
            </Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-500 font-rubik mb-1">
              Reason for consultation
            </Text>
            <Text className="text-gray-800 font-rubik-medium">
              {request?.reason || 'Not specified'}
            </Text>
          </View>
          
          {request?.notes && (
            <View className="mb-2">
              <Text className="text-gray-500 font-rubik mb-1">
                Additional notes
              </Text>
              <Text className="text-gray-800 font-rubik-medium">
                {request.notes}
              </Text>
            </View>
          )}
        </View>
        
        {/* Doctor Details Card (if assigned) */}
        {doctor && (
          <View className="bg-white rounded-xl shadow-sm p-5 mb-5">
            <Text className="text-lg font-rubik-bold text-gray-800 mb-4">
              Assigned Doctor
            </Text>
            
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mr-4">
                {doctor.avatar_url ? (
                  <Image 
                    source={{ uri: doctor.avatar_url }} 
                    className="w-16 h-16 rounded-full" 
                  />
                ) : (
                  <Ionicons name="person" size={32} color="#10b981" />
                )}
              </View>
              
              <View className="flex-1">
                <Text className="text-gray-800 font-rubik-bold text-lg">
                  Dr. {doctor.full_name || 'Unknown'}
                </Text>
                
                {doctor.specialty && (
                  <Text className="text-gray-600 font-rubik">
                    {doctor.specialty}
                  </Text>
                )}
                
                <View className="flex-row items-center mt-1">
                  <View className={`w-2 h-2 rounded-full mr-1 ${
                    doctor.status === 'online' 
                      ? 'bg-emerald-500' 
                      : doctor.status === 'busy' 
                        ? 'bg-amber-500' 
                        : 'bg-gray-400'
                  }`} />
                  <Text className="text-gray-500 text-xs font-rubik">
                    {doctor.status || 'offline'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Status Timeline */}
        <View className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <Text className="text-lg font-rubik-bold text-gray-800 mb-4">
            Request Timeline
          </Text>
          
          <StatusTimeline status={request?.status} />
        </View>
        
        {/* Actions */}
        <View className="flex-row justify-between mb-10">
          {request?.status === 'pending' && (
            <TouchableOpacity
              onPress={handleCancelRequest}
              className="bg-white py-3 px-4 rounded-xl shadow-sm items-center justify-center flex-1"
            >
              <Text className="text-red-500 font-rubik-medium">Cancel Request</Text>
            </TouchableOpacity>
          )}
          
          {(request?.status === 'accepted' || request?.status === 'pending') && request?.conversation_id && (
            <TouchableOpacity
              onPress={handleGoToChat}
              className="bg-indigo-600 py-3 px-4 rounded-xl shadow-sm items-center justify-center flex-1 ml-2"
            >
              <Text className="text-white font-rubik-medium">Go to Chat</Text>
            </TouchableOpacity>
          )}
          
          {request?.status === 'completed' && request?.conversation_id && (
            <TouchableOpacity
              onPress={handleGoToChat}
              className="bg-emerald-600 py-3 px-4 rounded-xl shadow-sm items-center justify-center flex-1"
            >
              <Text className="text-white font-rubik-medium">View Consultation</Text>
            </TouchableOpacity>
          )}
          
          {(request?.status === 'cancelled' || request?.status === 'rejected') && (
            <TouchableOpacity
              onPress={() => router.push('/request-doctor')}
              className="bg-indigo-600 py-3 px-4 rounded-xl shadow-sm items-center justify-center flex-1"
            >
              <Text className="text-white font-rubik-medium">New Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Status Badge Component
const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let icon = 'time-outline';
  
  switch (status) {
    case 'pending':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      icon = 'time-outline';
      break;
    case 'accepted':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = 'checkmark-circle-outline';
      break;
    case 'in_progress':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      icon = 'chatbubbles-outline';
      break;
    case 'completed':
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-800';
      icon = 'checkmark-done-circle-outline';
      break;
    case 'cancelled':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = 'close-circle-outline';
      break;
    case 'rejected':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = 'alert-circle-outline';
      break;
  }
  
  return (
    <View className={`px-4 py-2 rounded-full flex-row items-center ${bgColor}`}>
      <Ionicons name={icon} size={18} color={textColor.replace('text-', '')} style={{ marginRight: 4 }} />
      <Text className={`text-sm font-rubik-medium capitalize ${textColor}`}>
        {status?.replace('_', ' ') || 'Unknown'}
      </Text>
    </View>
  );
};

// Status Timeline Component
const StatusTimeline = ({ status }) => {
  const statuses = [
    { key: 'pending', label: 'Request Submitted', icon: 'checkmark-circle' },
    { key: 'accepted', label: 'Doctor Assigned', icon: 'person' },
    { key: 'in_progress', label: 'Consultation in Progress', icon: 'chatbubbles' },
    { key: 'completed', label: 'Consultation Complete', icon: 'checkmark-done-circle' }
  ];
  
  // If canceled or rejected, show different timeline
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <View className="pl-3">
        <View className="flex-row items-center mb-4">
          <View className="h-10 w-10 rounded-full bg-emerald-100 mr-3 items-center justify-center">
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
          <Text className="text-gray-800 font-rubik-medium">Request Submitted</Text>
        </View>
        
        <View className="h-6 w-1 bg-gray-200 ml-5 -mt-2 mb-2" />
        
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-red-100 mr-3 items-center justify-center">
            <Ionicons 
              name={status === 'cancelled' ? 'close-circle' : 'alert-circle'} 
              size={20} 
              color="#ef4444" 
            />
          </View>
          <Text className="text-gray-800 font-rubik-medium">
            {status === 'cancelled' ? 'Request Cancelled' : 'Request Rejected'}
          </Text>
        </View>
      </View>
    );
  }
  
  // Find the current status index
  const currentIndex = statuses.findIndex(s => s.key === status);
  
  return (
    <View className="pl-3">
      {statuses.map((item, index) => {
        const isActive = currentIndex >= index;
        const isLast = index === statuses.length - 1;
        
        return (
          <React.Fragment key={item.key}>
            <View className="flex-row items-center mb-4">
              <View className={`h-10 w-10 rounded-full mr-3 items-center justify-center ${
                isActive ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={isActive ? '#10b981' : '#9ca3af'} 
                />
              </View>
              <Text className={`font-rubik-medium ${
                isActive ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {item.label}
              </Text>
            </View>
            
            {!isLast && (
              <View className={`h-6 w-1 ml-5 -mt-2 mb-2 ${
                currentIndex > index ? 'bg-emerald-200' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};