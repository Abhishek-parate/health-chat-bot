import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// This is a simplified version without the actual API calls
// since we're still setting up the dependencies

export default function UsersAdminScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading users
    setTimeout(() => {
      // Mock data
      setUsers([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          createdAt: new Date().toISOString()
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const handleRoleToggle = (user) => {
    Alert.alert(
      'Change User Role',
      `This would change ${user.name}'s role (API not connected yet)`
    );
  };
  
  const renderUserItem = ({ item }) => (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{item.name}</Text>
          <Text className="text-gray-500 text-sm">{item.email}</Text>
          <View className="flex-row items-center mt-1">
            <View className={`px-2 py-0.5 rounded-full ${
              item.role === 'admin' ? 'bg-purple-200' : 'bg-gray-200'
            }`}>
              <Text className={`text-xs font-medium ${
                item.role === 'admin' ? 'text-purple-700' : 'text-gray-700'
              }`}>
                {item.role}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => handleRoleToggle(item)}
          className="p-2"
        >
          <Ionicons
            name={item.role === 'admin' ? 'remove-circle-outline' : 'add-circle-outline'}
            size={22}
            color={item.role === 'admin' ? '#ef4444' : '#10b981'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center justify-between h-16 px-4 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Manage Users</Text>
        </View>
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text>Loading users...</Text>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <Text className="text-lg font-semibold mb-4">All Users ({users.length})</Text>
          
          {users.length > 0 ? (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">No users found</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}