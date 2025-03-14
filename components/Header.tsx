
// components/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function Header({ title, showBackButton = false, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between h-16 px-4 bg-white">
      <View className="flex-row items-center">
        {showBackButton && (
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
      </View>
      
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Ionicons name={rightAction.icon} size={24} color="#0f172a" />
        </TouchableOpacity>
      )}
    </View>
  );
}