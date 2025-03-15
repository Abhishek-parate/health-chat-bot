// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

import AuthProvider from '@/contexts/AuthProvider';
import { initSounds } from '@/utils/notificationService';
import '../global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Loading component definition
function LoadingScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">🩺</Text>
      </View>
      <Text className="text-indigo-600 text-xl font-bold mb-2 font-rubik-bold">HealthAssist</Text>
      <Text className="text-gray-600 mb-8 font-rubik">{message}</Text>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

// Error screen component
function ErrorScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">⚠️</Text>
      </View>
      <Text className="text-red-500 text-xl font-bold text-center mb-2 font-rubik-bold">
        Something went wrong
      </Text>
      <Text className="text-gray-600 text-center mb-6 font-rubik">
        {message}
      </Text>
      <Text className="text-gray-500 text-center font-rubik">
        Please check your connection and restart the app.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (!fontsLoaded) {
          return;
        }
        
        // Initialize sound notifications
        await initSounds();
        
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Hide the splash screen
        await SplashScreen.hideAsync();
      } catch (err: any) {
        console.error('Failed to initialize app:', err);
        setError(err.message || 'Failed to initialize application.');
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return <LoadingScreen message="Preparing your health assistant..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  // Wrap the app with the Supabase Auth Provider
  return (
    <>
      <StatusBar style="auto" />
      <AuthProvider>
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f8fafc' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'modal'
            }} 
          />
          <Stack.Screen name="(doctor)" options={{ animation: 'fade' }} />
        </Stack>
      </AuthProvider>
    </>
  );
}