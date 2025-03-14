// components/ui/Input.tsx
import React from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  leftIcon?: string;
  rightIcon?: string;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  error?: string;
}

export function Input({
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  error,
  style,
  ...props
}: InputProps) {
  return (
    <View className="mb-2">
      <View className={`flex-row items-center bg-gray-50 border rounded-xl px-3 py-2 ${
        error ? 'border-red-500' : 'border-gray-200'
      }`}>
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
            className="mr-2"
          >
            <Ionicons name={leftIcon as any} size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
        
        <TextInput
          className="flex-1 text-gray-800 min-h-[24px]"
          placeholderTextColor="#9ca3af"
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            className="ml-2"
          >
            <Ionicons name={rightIcon as any} size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
