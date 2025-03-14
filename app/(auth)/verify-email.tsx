// app/(auth)/verify-email.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

export default function VerifyEmail() {
  const router = useRouter();
  const { email, signupId } = useLocalSearchParams();
  const [isDevOptionsVisible, setIsDevOptionsVisible] = useState(false);
  
  const handleBackToLogin = () => {
    router.push("/(auth)/login");
  };
  
  const handleResendEmail = () => {
    // In a real implementation, we would call Clerk's resend verification email API
    // For now, we'll just show an alert
    Alert.alert(
      'Resend Email',
      `Verification email has been resent to ${email}`,
      [{ text: 'OK' }]
    );
  };
  
  const showDevOptions = () => {
    // This reveals the development options after multiple taps
    setIsDevOptionsVisible(true);
  };
  
  const handleDevBypass = () => {
    Alert.alert(
      'Development Bypass',
      'This is only for development testing. In a production environment, email verification is required.',
      [
        { 
          text: 'Continue Anyway', 
          onPress: () => router.replace('/(tabs)') 
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };
  
  return (
    <View className="flex-1">
      <StatusBar style="light" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        bounces={false}
      >
        {/* Top gradient header */}
        <LinearGradient
          colors={['#4f46e5', '#7c3aed']}
          className="h-1/4 w-full rounded-b-3xl"
        >
          <View className="flex-1 items-center justify-center pt-12">
            <TouchableOpacity 
              onPress={showDevOptions} 
              activeOpacity={0.8}
            >
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-2 backdrop-blur-lg">
                <Text className="text-white text-3xl">✉️</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Verify Your Email</Text>
            <Text className="text-white/80 text-sm font-medium">Check your inbox</Text>
          </View>
        </LinearGradient>
        
        {/* Verification info */}
        <View className="px-6 pt-8 pb-4 -mt-6 bg-white rounded-t-3xl flex-1">
          <View className="items-center mb-8">
            <View className="w-32 h-32 bg-indigo-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail" size={64} color="#4f46e5" />
            </View>
          </View>
          
          <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Check Your Email
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            We've sent a verification email to:
          </Text>
          
          <Text className="text-indigo-600 font-bold text-lg text-center mb-8">
            {email || 'your email address'}
          </Text>
          
          <Text className="text-gray-600 text-center mb-8">
            Please click the link in the email to verify your account. 
            If you don't see it, check your spam folder.
          </Text>
          
          <Button
            title="Resend Verification Email"
            onPress={handleResendEmail}
            variant="outline"
            className="mb-4"
          />
          
          <Button
            title="Back to Login"
            onPress={handleBackToLogin}
            className="mb-6"
          />
          
          {isDevOptionsVisible && (
            <View className="mt-8 pt-8 border-t border-gray-200">
              <Text className="text-red-500 text-center mb-4 font-bold">
                DEVELOPMENT OPTIONS ONLY
              </Text>
              <Button
                title="Skip Verification (DEV ONLY)"
                onPress={handleDevBypass}
                className="bg-orange-500 mb-2"
              />
              <Text className="text-gray-400 text-xs text-center">
                This option should be removed in production builds.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}