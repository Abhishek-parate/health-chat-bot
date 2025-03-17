// app/(doctor)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthProvider';
import { Redirect } from 'expo-router';
import { Image, Text, View } from 'react-native';
import icons from "@/constants/icons";

type TabIconProps = {
  focused: boolean;
  title: string;
};

type ImageTabIconProps = TabIconProps & {
  icon: any;
};

type IonTabIconProps = TabIconProps & {
  name: any;
};

const TabIcon = ({ focused, icon, title }: ImageTabIconProps) => (
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

const IonTabIcon = ({ focused, name, title }: IonTabIconProps) => (
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

export default function DoctorLayout() {
  const { isAuthenticated, user } = useAuth();

  // Check if authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

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
      {/* Main tabs */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.home} title="Dashboard" />,
        }}
      />
      
      <Tabs.Screen
        name="conversations"
        options={{
          title: "Chats",
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="chatbubbles-outline" title="Chats" />,
        }}
      />
      
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="notifications-outline" title="Requests" />,
        }}
      />
      
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="people-outline" title="Patients" />,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <IonTabIcon focused={focused} name="person-outline" title="Profile" />,
        }}
      />
      
      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="schedule"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="guidelines"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="request-details"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="patient-details"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="users"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}