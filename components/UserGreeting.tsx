// components/UserGreeting.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileService } from '@/lib/supabaseService';

interface UserGreetingProps {
  showFullName?: boolean;
  textColor?: string;
  fontSize?: {
    greeting?: string;
    name?: string;
  };
}

export default function UserGreeting({ 
  showFullName = false, 
  textColor = 'text-white',
  fontSize = { greeting: 'text-lg', name: 'text-2xl' }
}: UserGreetingProps) {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setTimeBasedGreeting();
    
    if (user) {
      loadUserProfile();
    }
    
    // Set greeting again every hour in case user keeps app open across time periods
    const intervalId = setInterval(setTimeBasedGreeting, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  };
  
  const loadUserProfile = async () => {
    setIsLoading(true);
    
    try {
      // Try to get user profile from database
      const profile = await ProfileService.getProfile(user.id);
      
      let name = '';
      
      if (profile && profile.full_name) {
        name = showFullName ? profile.full_name : profile.full_name.split(' ')[0];
      } else if (user.user_metadata && user.user_metadata.full_name) {
        // Fallback to user metadata if profile doesn't have name
        name = showFullName 
          ? user.user_metadata.full_name 
          : user.user_metadata.full_name.split(' ')[0];
      } else if (user.email) {
        // Fallback to email username if no name found
        name = user.email.split('@')[0];
        // Capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
      } else {
        name = 'there';
      }
      
      setUserName(name);
    } catch (error) {
      console.error('Error loading user profile for greeting:', error);
      setUserName('there');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View>
        <Text className={`font-rubik-medium ${textColor} ${fontSize.greeting}`}>
          {greeting},
        </Text>
        <Text className={`font-rubik-bold ${textColor} ${fontSize.name}`}>
          there
        </Text>
      </View>
    );
  }
  
  return (
    <View>
      <Text className={`font-rubik-medium ${textColor} ${fontSize.greeting}`}>
        {greeting},
      </Text>
      <Text className={`font-rubik-bold ${textColor} ${fontSize.name}`}>
        {userName}
      </Text>
    </View>
  );
}