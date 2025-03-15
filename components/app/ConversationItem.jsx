// components/app/ConversationItem.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UnreadBadge } from '@/components/common/UnreadBadge';
import { getUnreadMessageCount } from '@/utils/notificationService';

export function ConversationItem({ 
  conversation, 
  lastMessage, 
  isDoctor = false, 
  userInfo 
}) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Check for unread messages on mount and when conversation changes
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (conversation?.id) {
        const count = await getUnreadMessageCount(conversation.id);
        setUnreadCount(count);
      }
    };
    
    loadUnreadCount();
  }, [conversation?.id]);
  
  // Handle navigation to conversation
  const handlePress = () => {
    if (isDoctor) {
      router.push(`/(doctor)/chat?conversationId=${conversation.id}`);
    } else {
      router.push(`/(tabs)/chat/index?conversationId=${conversation.id}`);
    }
  };
  
  // Format timestamp
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Get the name to display
  const displayName = isDoctor ? 
    (userInfo?.full_name || 'Patient') : 
    (conversation.is_doctor_chat ? `Dr. ${userInfo?.full_name || 'Doctor'}` : 'Health Chat');
  
  // Get the avatar initial
  const initial = isDoctor ? 
    (userInfo?.full_name?.charAt(0) || 'P') : 
    (conversation.is_doctor_chat ? (userInfo?.full_name?.charAt(0) || 'D') : 'A');
    
  // Get the avatar bg color
  const avatarBgColor = isDoctor ? 
    'bg-blue-100' : 
    (conversation.is_doctor_chat ? 'bg-emerald-100' : 'bg-blue-100');
    
  // Get the avatar text color
  const avatarTextColor = isDoctor ? 
    'text-blue-600' : 
    (conversation.is_doctor_chat ? 'text-emerald-600' : 'text-blue-600');
    
  return (
    <TouchableOpacity 
      className="flex-row items-center p-4 border-b border-gray-100"
      onPress={handlePress}
    >
      {/* Avatar */}
      <View className={`h-12 w-12 rounded-full ${avatarBgColor} items-center justify-center mr-3`}>
        {userInfo?.avatar_url ? (
          <Image 
            source={{ uri: userInfo.avatar_url }} 
            className="h-12 w-12 rounded-full" 
          />
        ) : (
          <Text className={`text-lg font-rubik-bold ${avatarTextColor}`}>
            {initial}
          </Text>
        )}
      </View>
      
      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="font-rubik-bold text-gray-800">
              {displayName}
            </Text>
            
            {conversation.status === 'closed' && (
              <View className="ml-2 bg-gray-200 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-gray-600 font-rubik">
                  Closed
                </Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 font-rubik mr-1">
              {formatTimeAgo(lastMessage?.timestamp || lastMessage?.created_at)}
            </Text>
            
            {unreadCount > 0 && (
              <UnreadBadge 
                count={unreadCount} 
                size="small" 
                color={isDoctor ? "green" : "blue"} 
              />
            )}
          </View>
        </View>
        
        <Text 
          className="text-sm text-gray-600 font-rubik mt-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}