// app/(auth)/forgot-password.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useClerk } from '@clerk/clerk-expo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPassword() {
  const router = useRouter();
  const { client } = useClerk();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      
      // Request password reset email via Clerk
      await client.signIn.createResetPasswordFlow({
        strategy: 'reset_password_email',
        identifier: email.trim()
      });
      
      setResetSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
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
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-2 backdrop-blur-lg">
              <Text className="text-white text-3xl">🩺</Text>
            </View>
            <Text className="text-white text-2xl font-bold">HealthAssist</Text>
            <Text className="text-white/80 text-sm font-medium">Reset Your Password</Text>
          </View>
        </LinearGradient>
        
        {/* Reset password form */}
        <View className="px-6 pt-8 pb-4 -mt-6 bg-white rounded-t-3xl flex-1">
          {!resetSent ? (
            <>
              <Text className="text-2xl font-bold text-gray-800 mb-4">Reset Password</Text>
              <Text className="text-gray-600 mb-6">
                Enter the email address associated with your account, and we'll send you a link to reset your password.
              </Text>
              
              <View className="space-y-4 mb-6">
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />
              </View>
              
              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={loading}
                className="mb-6"
              />
            </>
          ) : (
            <>
              <View className="items-center py-8">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                  <Text className="text-4xl">✓</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
                  Check Your Email
                </Text>
                <Text className="text-gray-600 mb-6 text-center">
                  We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
                </Text>
              </View>
              
              <Button
                title="Back to Login"
                onPress={handleBackToLogin}
                variant="outline"
                className="mb-6"
              />
            </>
          )}
          
          <View className="flex-row justify-center mt-auto pb-6">
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text className="text-indigo-600 font-semibold">Back to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}