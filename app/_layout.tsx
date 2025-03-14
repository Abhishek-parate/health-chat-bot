// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase } from '../lib/db';
import { ClerkAuthProvider } from '../lib/clerk';
import "../global.css";

// Loading component definition
function LoadingScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">🩺</Text>
      </View>
      <Text className="text-indigo-600 text-xl font-bold mb-2">HealthAssist</Text>
      <Text className="text-gray-600 mb-8">{message}</Text>
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
      <Text className="text-red-500 text-xl font-bold text-center mb-2">
        Something went wrong
      </Text>
      <Text className="text-gray-600 text-center mb-6">
        {message}
      </Text>
      <Text className="text-gray-500 text-center">
        Please check your connection and restart the app.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
          throw new Error('Database initialization failed');
        }
        
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err: any) {
        console.error('Failed to initialize app:', err);
        setError(err.message || 'Failed to initialize application.');
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return <LoadingScreen message="Preparing your health assistant..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  // Wrap the app with the Clerk Auth Provider
  return (
    <ClerkAuthProvider>
      <RootLayoutNav />
    </ClerkAuthProvider>
  );
}

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="auto" />
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
      </Stack>
    </>
  );
}