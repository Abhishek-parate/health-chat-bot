// app/(auth)/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from "@/contexts/AuthProvider";


export default function AuthRoutesLayout() {
  const { isAuthenticated } = useAuth();

  
  // If signed in, redirect to home
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise show auth screens
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8fafc' },
        animation: 'slide_from_right',
      }}
    >             
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />

    </Stack>
  );
}