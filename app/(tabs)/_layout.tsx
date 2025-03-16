// app/(tabs)/_layout.tsx
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/contexts/AuthProvider";
import { Redirect } from 'expo-router';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import icons from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col items-center">
    <Image
      source={icon}
      style={{ tintColor: focused ? "#0061FF" : "#666876" }}
      resizeMode="contain"
      className="size-6"
    />
    <Text
      className={`${
        focused ? "text-primary-400 font-rubik-medium" : "text-black-200 font-rubik"
      } text-xs w-full text-center mt-1`}
    >
      {title}
    </Text>
  </View>
);

// Custom icon component for Ionicons
const IonTabIcon = ({
  focused,
  name,
  title,
}: {
  focused: boolean;
  name: any;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col items-center">
    <Ionicons
      name={name}
      size={24}
      color={focused ? "#0061FF" : "#666876"}
    />
    <Text
      className={`${
        focused ? "text-primary-400 font-rubik-medium" : "text-black-200 font-rubik"
      } text-xs w-full text-center mt-1`}
    >
      {title}
    </Text>
  </View>
);

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // If user is signed in, show tabs
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0061FF',
        tabBarInactiveTintColor: '#666876',
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#0061FF1A',
          elevation: 0,
          backgroundColor: "white",
          position: "absolute",
          minHeight: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.home} title="Home" />,
        }}
      />

      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="chatbubble-outline" title="Chat" />,
        }}
      />
      
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="information-circle-outline" title="About" />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="person-outline" title="Profile" />,
        }}
      />

      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen
        name="chat/detail"
        options={{
          href: null, 
        }}
      />
      
      <Tabs.Screen
        name="chat/index"
        options={{
          href: null, 
        }}
      />
      
      <Tabs.Screen
        name="request-doctor"
        options={{
          href: null, 
        }}
      />
      
      {/* Add edit-profile as a hidden screen */}
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      
      {/* Add doctor-request as a hidden screen */}
      <Tabs.Screen
        name="doctor-request"
        options={{
          href: null,
        }}
      />
      
      {/* Add health-topics as a hidden screen */}
      <Tabs.Screen
        name="health-topics"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}