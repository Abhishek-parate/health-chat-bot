
// components/ui/Button.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  TouchableOpacityProps,
  View
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-600';
      case 'outline':
        return 'bg-white border border-indigo-600';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-indigo-600';
    }
  };
  
  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return 'text-white';
      case 'outline':
        return 'text-indigo-600';
      case 'ghost':
        return 'text-indigo-600';
      default:
        return 'text-white';
    }
  };
  
  return (
    <TouchableOpacity
      disabled={loading || disabled}
      className={`rounded-xl py-3.5 items-center justify-center flex-row ${getButtonStyle()} ${
        (loading || disabled) ? 'opacity-70' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : '#4f46e5'} 
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`font-medium ${getTextStyle()}`}>{title}</Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}