import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    Image, 
    Platform,
    SafeAreaView, 
    ScrollView,
    StatusBar,
    KeyboardAvoidingView,
    Alert,
    TextInput,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import icons from '@/constants/icons';
import { supabase } from "@/utils/supabase";
import * as WebBrowser from 'expo-web-browser';

// Preload browser for authentication
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Sample illustrations - replace with your actual assets
const illustrationCreate = require('@/assets/images/loginscreen.png');
const mailConfirmation = require('@/assets/images/avatar.png');

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
    useWarmUpBrowser();
    
    // Use expo-router for navigation
    const router = useRouter();
    
    // Core state management
    const [currentScreen, setCurrentScreen] = useState('register');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form states
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    // Scroll ref for keyboard handling
    const scrollViewRef = useRef(null);

    // Form validation states
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [nameError, setNameError] = useState('');

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (password) => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const validateName = (name) => {
        if (!name) {
            setNameError('Name is required');
            return false;
        }
        setNameError('');
        return true;
    };

    // Form submission handlers with validation
    const handleRegister = async () => {
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      const isNameValid = validateName(name);
    
      if (isEmailValid && isPasswordValid && isNameValid) {
        setLoading(true);
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            console.log('Starting signup attempt', retryCount + 1, 'with:', { email, name });
            
            const { data, error } = await supabase.auth.signUp({
              email: email.trim().toLowerCase(),
              password: password,
              options: {
                data: {
                  full_name: name.trim(),
                }
              }
            });
            
            console.log('Signup response status:', data ? 'success' : 'failed');
            
            if (error) {
              console.error('Detailed error:', error);
              throw error;
            }
    
            if (!data?.session) {
              setCurrentScreen('confirmation');
            } else {
              router.replace('/home');
            }
            
            break; // Success - exit the retry loop
            
          } catch (error) {
            console.error('Signup error on attempt', retryCount + 1, ':', error);
            
            if (retryCount === maxRetries - 1) {
              // This was our last attempt
              Alert.alert(
                'Registration Error',
                `Error: ${error.message || 'Network request failed'}\nPlease check your connection and try again.`
              );
            } else {
              // Wait before retrying (increasing delay with each retry)
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              retryCount++;
            }
          }
        }
        
        setLoading(false);
      }
    };

    const handleResendEmail = async () => {
        setLoading(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        setLoading(false);
        
        if (error) {
            Alert.alert('Resend Error', error.message);
        } else {
            Alert.alert('Email Sent', 'Verification email has been resent.');
        }
    };

    // Input styles based on validation state
    const getInputBorderClass = (error) => {
        return error ? "border-red-500" : "border-gray-300";
    };

    const renderRegisterScreen = () => (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView 
                    ref={scrollViewRef}
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {/* Gradient header with illustration */}
                    <LinearGradient
                                           colors={['#4f46e5', '#7c3aed']}
                                           start={{ x: 0, y: 0 }}
                                           end={{ x: 1, y: 1 }}
                                           style={{ 
                                             paddingTop: 48, 
                                             paddingBottom: 24, 
                                             paddingHorizontal: 20,
                                             borderBottomLeftRadius: 24, 
                                             borderBottomRightRadius: 24
                                         }}
                                       >
                        <View className="items-center justify-center">
                            <Image
                                source={illustrationCreate} 
                                className="w-40 h-40"
                                resizeMode="contain"
                                accessibilityLabel="Registration illustration" 
                            />
                        </View>
                        
                        {/* App name and tagline */}
                        <View className="mt-2">
                                                   <Text className="text-white text-3xl font-bold text-center">
                                                       Health Sync
                                                   </Text>
                                                   <Text className="text-white text-base text-center opacity-90 mt-1">
                                                       Your health, our priority
                                                   </Text>
                                               </View>
                        
                        {/* Decorative elements */}
                        <View className="absolute -bottom-4 -left-10 w-24 h-24 rounded-full bg-white opacity-10" />
                        <View className="absolute top-10 right-0 w-16 h-16 rounded-full bg-white opacity-10" />
                    </LinearGradient>
                    
                    {/* Form container */}
                    <View className="px-5 flex-1">
                       {/* App logo */}
                                             <View className="items-center ">
                                                  <Image
                                                      source={icons.logo}
                                                      className="w-32 h-32"
                                                      resizeMode="contain"
                                                      accessibilityLabel="App logo"
                                                  />
                                              </View>
                        <View className="bg-white  ">
                            <Text className="text-gray-800 text-2xl font-semibold  text-center">
                                Create Account
                            </Text>
                            
                            {/* Email input with validation */}
                            <View className="mb-4">
                                <Text className="text-gray-600 text-sm mb-1">Email</Text>
                                <View className={`flex-row items-center border ${getInputBorderClass(emailError)} rounded-xl px-4 py-2 bg-gray-50`}>
                                    <Ionicons name="mail-outline" size={18} color="#6B7280" />
                                    <TextInput
                                        placeholder="Email address"
                                        className="flex-1 h-12 ml-2 text-gray-800"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (emailError) validateEmail(text);
                                        }}
                                        onBlur={() => validateEmail(email)}
                                        autoCapitalize="none"
                                    />
                                </View>
                                {emailError ? <Text className="text-red-500 text-xs mt-1">{emailError}</Text> : null}
                            </View>
                            
                            {/* Name input with validation */}
                            <View className="mb-4">
                                <Text className="text-gray-600 text-sm mb-1">Full Name</Text>
                                <View className={`flex-row items-center border ${getInputBorderClass(nameError)} rounded-xl px-4 py-2 bg-gray-50`}>
                                    <Ionicons name="person-outline" size={18} color="#6B7280" />
                                    <TextInput
                                        placeholder="Your full name"
                                        className="flex-1 h-12 ml-2 text-gray-800"
                                        value={name}
                                        onChangeText={(text) => {
                                            setName(text);
                                            if (nameError) validateName(text);
                                        }}
                                        onBlur={() => validateName(name)}
                                    />
                                </View>
                                {nameError ? <Text className="text-red-500 text-xs mt-1">{nameError}</Text> : null}
                            </View>
                            
                            {/* Password input with show/hide toggle */}
                            <View className="mb-6">
                                <Text className="text-gray-600 text-sm mb-1">Password</Text>
                                <View className={`flex-row items-center border ${getInputBorderClass(passwordError)} rounded-xl px-4 py-2 bg-gray-50`}>
                                    <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                                    <TextInput
                                        placeholder="Enter password"
                                        className="flex-1 h-12 ml-2 text-gray-800"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (passwordError) validatePassword(text);
                                        }}
                                        onBlur={() => validatePassword(password)}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {passwordError ? <Text className="text-red-500 text-xs mt-1">{passwordError}</Text> : null}
                            </View>
                            
                            {/* Register button */}
                            <TouchableOpacity
                                className={`bg-indigo-600 py-3.5 rounded-xl items-center justify-center mt-2 mb-4 ${loading ? "opacity-70" : ""}`}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text className="text-white text-base font-semibold">
                                        Create Account
                                    </Text>
                                )}
                            </TouchableOpacity>
                            
                            {/* Login link */}
                            <View className="flex-row justify-center mt-2">
                                <Text className="text-gray-600">Already have an account? </Text>
                                <Link href="/login" replace>
                                    <Text className="text-indigo-600 font-medium">Sign In</Text>
                                </Link>
                            </View>
                        </View>
                        
                        {/* Optional: App logo */}
                       
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

    const renderConfirmationScreen = () => (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView 
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {/* Gradient header */}
                    <LinearGradient
                        colors={['#4f46e5', '#7c3aed']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="pt-12 pb-14 px-5 rounded-b-3xl shadow-lg"
                    >
                        <View className="flex-row items-center">
                            <TouchableOpacity 
                                className="p-2"
                                onPress={() => setCurrentScreen('register')}
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        <View className="items-center mt-4">
                            <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4">
                                <Image 
                                    source={mailConfirmation} 
                                    className="w-16 h-16"
                                    resizeMode="contain"
                                    accessibilityLabel="Email confirmation icon" 
                                />
                            </View>
                            
                            <Text className="text-white text-2xl font-bold text-center mb-2">
                                Email Verification
                            </Text>
                            <Text className="text-white/90 text-center">
                                We've sent a verification email to
                            </Text>
                            <Text className="text-white font-medium text-center mt-1">
                                {email}
                            </Text>
                        </View>
                    </LinearGradient>
                    
                    {/* Confirmation content */}
                    <View className="px-5 -mt-8">
                        <View className="bg-white rounded-xl p-6 shadow-lg">
                            <Text className="text-xl font-semibold text-center mb-4 text-gray-800">
                                Thank you for registering!
                            </Text>
                            
                            <Text className="text-gray-600 text-center mb-6 leading-5">
                                Please check your email and follow the link to verify your account. If you don't see it, check your spam folder.
                            </Text>
                            
                            <TouchableOpacity
                                className={`bg-white border border-indigo-600 py-3.5 rounded-xl items-center justify-center flex-row mb-4 ${loading ? "opacity-70" : ""}`}
                                onPress={handleResendEmail}
                                disabled={loading}
                            >
                                <Ionicons name="mail-outline" size={18} color="#4F46E5" className="mr-2" />
                                <Text className="text-indigo-600 text-base font-medium ml-2">
                                    {loading ? "Sending..." : "Resend Verification Email"}
                                </Text>
                            </TouchableOpacity>
                            
                            <Link href="/login" replace asChild>
                                <TouchableOpacity
                                    className="bg-indigo-600 py-3.5 rounded-xl items-center justify-center"
                                >
                                    <Text className="text-white text-base font-semibold">
                                        Go to Login
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                        
                        {/* Help text */}
                        <View className="flex-row justify-center mt-6 mb-10">
                            <Text className="text-gray-600">Need help? </Text>
                            <Link href="/support">
                                <Text className="text-indigo-600 font-medium">Contact support</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

    // Render the appropriate screen based on state
    return currentScreen === 'register' ? renderRegisterScreen() : renderConfirmationScreen();
}