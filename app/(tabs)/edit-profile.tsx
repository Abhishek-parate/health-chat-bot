// app/(tabs)/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileService } from '@/lib/supabaseService';
import { supabase } from '@/utils/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    avatar_url: null,
    bio: ''
  });
  
  // Load user profile data
  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await ProfileService.getProfile(user.id);
        
        if (profile) {
          setProfileData({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            email: user.email || '',
            avatar_url: profile.avatar_url || null,
            bio: profile.bio || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user]);
  
  // Handle saving profile changes
  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!profileData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setIsSaving(true);
    try {
      // Update profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Your profile has been updated successfully.');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to open image upload modal - we'll customize this further when we add the image library
  const handleAvatarPress = () => {
    // For now, just show an alert that this feature is coming soon
    Alert.alert(
      'Feature Coming Soon',
      'Profile image upload will be available in the next update.',
      [{ text: 'OK' }]
    );
  };
  
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-600 font-rubik">Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
            Edit Profile
          </Text>
        </View>
      </LinearGradient>
      
      <ScrollView className="flex-1 px-5 pt-6">
        {/* Avatar Section */}
        <View className="items-center mb-8">
          <View className="mb-4 relative">
            {profileData.avatar_url ? (
              <Image 
                source={{ uri: profileData.avatar_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-indigo-100 items-center justify-center">
                <Text className="text-3xl font-rubik-bold text-indigo-600">
                  {profileData.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={handleAvatarPress}
              className="absolute bottom-0 right-0 bg-indigo-600 rounded-full w-8 h-8 items-center justify-center"
            >
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          {profileData.avatar_url && (
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}>
              <Text className="text-red-500 font-rubik-medium">Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Form Fields */}
        <View className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <View className="mb-4">
            <Text className="text-gray-600 font-rubik-medium mb-2">Full Name</Text>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg font-rubik text-gray-800"
              value={profileData.full_name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, full_name: text }))}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-600 font-rubik-medium mb-2">Email</Text>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg font-rubik text-gray-500"
              value={profileData.email}
              editable={false}
            />
            <Text className="text-xs text-gray-500 mt-1 ml-1 font-rubik">
              Email cannot be changed
            </Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-600 font-rubik-medium mb-2">Phone Number</Text>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg font-rubik text-gray-800"
              value={profileData.phone_number}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, phone_number: text }))}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
          
          <View className="mb-2">
            <Text className="text-gray-600 font-rubik-medium mb-2">Bio</Text>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg font-rubik text-gray-800"
              value={profileData.bio}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ height: 100 }}
            />
          </View>
        </View>
        
        {/* Buttons */}
        <View className="flex-row justify-between mb-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white py-3 px-4 rounded-xl shadow-sm items-center justify-center flex-1 mr-2"
          >
            <Text className="text-gray-800 font-rubik-medium">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isSaving}
            className={`${isSaving ? 'bg-indigo-400' : 'bg-indigo-600'} py-3 px-4 rounded-xl shadow-sm items-center justify-center flex-1 ml-2`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-rubik-medium">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}