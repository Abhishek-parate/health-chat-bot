// app/(auth)/signup.tsx
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
import { useAuth } from '@/lib/clerk';
import { createUserProfile } from '@/lib/db';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SignUp() {
  const router = useRouter();
  const { signUp, signOut, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSignUp = async () => {
    // Validate input
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      Alert.alert('Error', 'Password should be at least 8 characters');
      return;
    }
    
    // Enhanced password validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!(hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar)) {
      Alert.alert(
        'Weak Password', 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*(),.?":{}|<>).'
      );
      return;
    }
    
    try {
      setLoading(true);
      console.log('Starting signup process...');
      
      // Create user with Clerk
      const result = await signUp({
        emailAddress: email.trim(),
        password: password.trim(),
        username: username.trim()
      });
      
      // Save the signup ID for later reference (important for development)
      let signupId = '';
      try {
        // Get signup ID from the result if available
        if (typeof result === 'object' && result && result.id) {
          signupId = result.id;
        }
      } catch (e) {
        console.error('Error getting signup ID:', e);
      }
      
      if (result === true) {
        console.log('Signup successful!');
        
        // Sign out the user (we don't want to auto-login after signup)
        try {
          await signOut();
          console.log('Signed out after successful signup');
        } catch (signOutError) {
          console.error('Error signing out after signup:', signOutError);
        }
        
        // Show success alert and redirect to login
        Alert.alert(
          'Account Created', 
          'Your account has been created successfully. Please login with your credentials.',
          [
            { 
              text: 'OK', 
              onPress: () => router.push("/(auth)/login") 
            }
          ]
        );
      } else {
        console.log('Signup requires email verification');
        // Navigate to email verification screen
        router.push({
          pathname: "/(auth)/verify-email",
          params: { 
            email: email.trim(),
            signupId: signupId
          }
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Handle common clerk errors
      let errorMessage = 'Failed to create account';
      
      // Check for common error messages
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('data breach') || error.message.includes('Password has been found')) {
          errorMessage = 'This password has been found in a data breach. Please use a stronger, unique password.';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'An account with this email or username already exists.';
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password is too weak. Please use a stronger password with at least 8 characters including uppercase, lowercase, numbers, and special characters.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
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
            <Text className="text-white/80 text-sm font-medium">Create your account</Text>
          </View>
        </LinearGradient>
        
        {/* Signup form */}
        <View className="px-6 pt-8 pb-4 -mt-6 bg-white rounded-t-3xl flex-1">
          <Text className="text-2xl font-bold text-gray-800 mb-6">Sign Up</Text>
          
          <View className="space-y-4 mb-6">
            <Input
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              leftIcon="person-outline"
              autoCapitalize="none"
            />
            
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
            
            <Input
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
            />
          </View>
          
          <View className="mb-6">
            <Text className="text-gray-500 text-xs mb-2">
              By signing up, you agree to our{' '}
              <Text className="text-indigo-600">Terms of Service</Text> and{' '}
              <Text className="text-indigo-600">Privacy Policy</Text>.
            </Text>
          </View>
          
          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading || authLoading}
            className="mb-6"
          />
          
          <View className="flex-row justify-center mt-auto pb-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-indigo-600 font-semibold">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}