
// components/ui/LoadingSpinner.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({
  text = 'Loading...',
  size = 'large',
  color = '#0ea5e9',
}: LoadingSpinnerProps) {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size={size} color={color} />
      {text && <Text className="text-gray-600 mt-2">{text}</Text>}
    </View>
  );
}
