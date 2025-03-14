
// components/ui/Card.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Card({ title, children, onPress, className = '' }: CardProps) {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      onPress={onPress}
      className={`bg-white rounded-xl p-4 shadow-sm ${className}`}
    >
      {title && (
        <Text className="text-lg font-semibold mb-2">{title}</Text>
      )}
      {children}
    </CardComponent>
  );
}
