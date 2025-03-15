// app/(doctor)/schedule.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileService } from '@/lib/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

// Define schedule time slots
const timeSlots = [
  { id: 1, day: 'Monday', time: '9:00 AM - 12:00 PM' },
  { id: 2, day: 'Monday', time: '1:00 PM - 5:00 PM' },
  { id: 3, day: 'Tuesday', time: '9:00 AM - 12:00 PM' },
  { id: 4, day: 'Tuesday', time: '1:00 PM - 5:00 PM' },
  { id: 5, day: 'Wednesday', time: '9:00 AM - 12:00 PM' },
  { id: 6, day: 'Wednesday', time: '1:00 PM - 5:00 PM' },
  { id: 7, day: 'Thursday', time: '9:00 AM - 12:00 PM' },
  { id: 8, day: 'Thursday', time: '1:00 PM - 5:00 PM' },
  { id: 9, day: 'Friday', time: '9:00 AM - 12:00 PM' },
  { id: 10, day: 'Friday', time: '1:00 PM - 5:00 PM' },
  { id: 11, day: 'Saturday', time: '9:00 AM - 12:00 PM' },
  { id: 12, day: 'Sunday', time: 'Unavailable' }
];

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([1, 3, 5, 7, 9]); // Default selected slots
  const [autoOffline, setAutoOffline] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadDoctorProfile();
    }
  }, [user]);
  
  const loadDoctorProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await ProfileService.getProfile(user.id);
      if (!profile || profile.role !== 'doctor') {
        router.replace('/(tabs)');
        return;
      }
      
      setDoctorProfile(profile);
      setIsAvailable(profile.status !== 'offline');
      
      // In a real app, you'd load the doctor's schedule from the database
      // For now, we're using a default schedule
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleAvailability = async (value) => {
    if (!doctorProfile) return;
    
    setIsAvailable(value);
    
    // Update doctor status in database
    const status = value ? 'online' : 'offline';
    await ProfileService.updateUserStatus(user.id, status);
    
    // Update local state
    setDoctorProfile({
      ...doctorProfile,
      status
    });
  };
  
  const toggleTimeSlot = (slotId) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };
  
  const saveSchedule = async () => {
    setUpdating(true);
    
    try {
      // In a real app, you would send the selected slots to your backend
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Your availability schedule has been updated.');
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update your schedule. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const groupedTimeSlots = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = [];
    }
    acc[slot.day].push(slot);
    return acc;
  }, {});
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading schedule...</Text>
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
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-rubik-bold text-white">Availability Schedule</Text>
        </View>
        
        {/* Current availability */}
        <View className="bg-white/20 p-4 rounded-xl mt-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-rubik-medium">Current Status</Text>
              <Text className="text-white text-xl font-rubik-bold">
                {isAvailable ? 'Available' : 'Offline'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#ffffff40', true: '#ffffff80' }}
              thumbColor={isAvailable ? '#ffffff' : '#e5e7eb'}
            />
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Auto-offline toggle */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-gray-800 font-rubik-bold text-lg">Automatic Offline Hours</Text>
              <Text className="text-gray-600 font-rubik mt-1">
                Automatically set your status to offline outside your availability hours
              </Text>
            </View>
            <Switch
              value={autoOffline}
              onValueChange={setAutoOffline}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={autoOffline ? '#4f46e5' : '#f1f5f9'}
            />
          </View>
        </View>
        
        {/* Weekly schedule */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <Text className="text-gray-800 font-rubik-bold text-lg mb-4">Weekly Schedule</Text>
          
          {Object.entries(groupedTimeSlots).map(([day, slots]) => (
            <View key={day} className="mb-4">
              <Text className="text-gray-800 font-rubik-bold mb-2">{day}</Text>
              
              {slots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => toggleTimeSlot(slot.id)}
                  className={`flex-row items-center justify-between p-3 rounded-xl mb-2 ${
                    slot.time === 'Unavailable' 
                      ? 'bg-gray-100' 
                      : selectedSlots.includes(slot.id)
                        ? 'bg-emerald-100'
                        : 'bg-gray-100'
                  }`}
                  disabled={slot.time === 'Unavailable'}
                >
                  <Text className={`font-rubik ${
                    slot.time === 'Unavailable' 
                      ? 'text-gray-400' 
                      : selectedSlots.includes(slot.id)
                        ? 'text-emerald-800'
                        : 'text-gray-600'
                  }`}>
                    {slot.time}
                  </Text>
                  
                  {slot.time !== 'Unavailable' && (
                    selectedSlots.includes(slot.id) ? (
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        
        {/* Notes section */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <Text className="text-gray-800 font-rubik-bold text-lg mb-2">Important Notes</Text>
          
          <Text className="text-gray-600 font-rubik mb-2">
            • Your availability schedule helps patients know when you're typically available
          </Text>
          <Text className="text-gray-600 font-rubik mb-2">
            • You can still manually go online or offline at any time
          </Text>
          <Text className="text-gray-600 font-rubik">
            • Consultation requests may come in at any time, but you'll only be notified when you're online
          </Text>
        </View>
        
        {/* Save button */}
        <TouchableOpacity
          onPress={saveSchedule}
          disabled={updating}
          className={`bg-indigo-600 py-3 rounded-xl items-center mb-8 ${
            updating ? 'opacity-70' : ''
          }`}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-rubik-medium">Save Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}