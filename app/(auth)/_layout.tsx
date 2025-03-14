// app/(auth)/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/clerk';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoading } = useAuth();
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // If signed in, redirect to home
  if (isSignedIn) {
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
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}