// app/(auth)/login.tsx
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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createUserRecord } from '@/lib/db';

export default function Login() {
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      // Call the Clerk auth provider's signIn method
      const success = await signIn({ 
        emailAddress: email.trim(), 
        password: password.trim() 
      });
      
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpPress = () => {
    router.push("/(auth)/signup");
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
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
          className="h-1/3 w-full rounded-b-3xl"
        >
          <View className="flex-1 items-center justify-center pt-12">
            <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4 backdrop-blur-lg">
              <Text className="text-white text-4xl">🩺</Text>
            </View>
            <Text className="text-white text-3xl font-bold">HealthAssist</Text>
            <Text className="text-white/80 font-medium mt-1">Your AI Health Assistant</Text>
          </View>
        </LinearGradient>
        
        {/* Login form */}
        <View className="px-6 pt-8 pb-4 -mt-6 bg-white rounded-t-3xl flex-1">
          <Text className="text-2xl font-bold text-gray-800 mb-6">Welcome back</Text>
          
          <View className="space-y-4 mb-6">
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
            
            <TouchableOpacity 
              onPress={handleForgotPassword}
              className="self-end"
            >
              <Text className="text-indigo-600 text-sm font-medium">Forgot password?</Text>
            </TouchableOpacity>
          </View>
          
          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading || authLoading}
            className="mb-6"
          />
          
          <View className="flex-row justify-center mt-auto pb-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUpPress}>
              <Text className="text-indigo-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}