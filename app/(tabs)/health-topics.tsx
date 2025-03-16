import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthProvider';
import { HealthTopicService, HealthTopic } from '@/lib/supabaseService';

// Featured topics (could be moved to database in future)
const featuredTopics = [
  {
    id: 'ft1',
    title: 'Balanced Diet',
    category: 'Nutrition',
    description: 'Learn about maintaining a balanced diet for optimal health',
    gradient: ['#10b981', '#059669'],
    icon: 'nutrition',
    iconType: 'material',
    rating: 4.8,
    reviews: 128
  },
  {
    id: 'ft2',
    title: 'Mindfulness Practice',
    category: 'Mental Health',
    description: 'Discover techniques for daily mindfulness',
    gradient: ['#8b5cf6', '#7c3aed'],
    icon: 'brain',
    iconType: 'fontawesome',
    rating: 4.7,
    reviews: 95
  },
  {
    id: 'ft3',
    title: 'Quality Sleep',
    category: 'Sleep',
    description: 'Improve your sleep quality with these tips',
    gradient: ['#3b82f6', '#2563eb'],
    icon: 'moon',
    iconType: 'ionicons',
    rating: 4.9,
    reviews: 147
  }
];

// Categories for filter - now dynamically built from health topics
const defaultCategories = ['All'];

export default function HealthTopicsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [healthTopics, setHealthTopics] = useState<HealthTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<HealthTopic[]>([]);
  const [categories, setCategories] = useState(defaultCategories);
  
  // Function to render icons based on type or fallback to emoji
  const renderIcon = (topic, size = 24, color = "white") => {
    // First try to use predefined icon if available
    const iconMapping = {
      'Nutrition': { name: 'nutrition', type: 'material' },
      'Exercise': { name: 'run', type: 'material' },
      'Mental Health': { name: 'brain', type: 'fontawesome' },
      'Sleep': { name: 'moon', type: 'ionicons' },
      'Heart Health': { name: 'heart', type: 'ionicons' },
      'Hydration': { name: 'water', type: 'material' },
      'Digestive Health': { name: 'food-apple', type: 'material' },
      'Immune System': { name: 'shield', type: 'ionicons' },
      'Stress Management': { name: 'spa', type: 'ionicons' },
      'Women\'s Health': { name: 'female', type: 'fontawesome' },
      'Men\'s Health': { name: 'male', type: 'fontawesome' },
      'Aging Well': { name: 'hourglass', type: 'ionicons' }
    };
    
    const iconInfo = iconMapping[topic.title];
    
    if (iconInfo) {
      switch (iconInfo.type) {
        case 'ionicons':
          return <Ionicons name={iconInfo.name} size={size} color={color} />;
        case 'material':
          return <MaterialCommunityIcons name={iconInfo.name} size={size} color={color} />;
        case 'fontawesome':
          return <FontAwesome5 name={iconInfo.name} size={size} color={color} solid />;
      }
    }
    
    // If no matching icon or if topic has emoji icon, render the emoji
    if (topic.icon) {
      return <Text style={{ fontSize: size, color: color }}>{topic.icon}</Text>;
    }
    
    // Default fallback
    return <Ionicons name="help-circle" size={size} color={color} />;
  };
  
  useEffect(() => {
    loadHealthTopics();
  }, []);
  
  useEffect(() => {
    filterTopics();
  }, [searchQuery, selectedCategory, healthTopics]);
  
  const loadHealthTopics = async () => {
    setIsLoading(true);
    try {
      // Fetch health topics from the database
      const topics = await HealthTopicService.getHealthTopics();
      
      if (!topics || topics.length === 0) {
        console.log('No health topics found in database, showing empty state');
        setHealthTopics([]);
      } else {
        console.log(`Loaded ${topics.length} health topics from database`);
        setHealthTopics(topics);
        
        // Extract unique categories from topics for the filter
        const uniqueCategories = [...new Set(topics.map(topic => topic.title))];
        setCategories([...defaultCategories, ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Error loading health topics:', error);
      setHealthTopics([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterTopics = () => {
    if (healthTopics.length === 0) {
      setFilteredTopics([]);
      return;
    }
    
    let filtered = [...healthTopics];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(topic => topic.title === selectedCategory);
    }
    
    setFilteredTopics(filtered);
  };
  
  const handleTopicPress = (topic: HealthTopic) => {
    // Start a chat about this topic instead of showing details
    router.push({
      pathname: '/(tabs)/chat',
      params: { topic: topic.title }
    });
  };
  
  // Render category item
  const renderCategoryItem = (category: string) => (
    <TouchableOpacity
      key={category}
      onPress={() => setSelectedCategory(category)}
      style={{
        marginRight: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 100,
        backgroundColor: selectedCategory === category ? '#4f46e5' : 'white',
        borderWidth: selectedCategory === category ? 0 : 1,
        borderColor: '#e5e7eb',
      }}
    >
      <Text 
        style={{
          color: selectedCategory === category ? 'white' : '#374151',
          fontWeight: '600',
          fontSize: 14,
        }}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  // Render featured topic
  const renderFeaturedTopic = (topic) => (
    <TouchableOpacity
      key={topic.id}
      onPress={() => router.push({
        pathname: '/(tabs)/chat',
        params: { topic: topic.title }
      })}
      style={{
        width: 250,
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <LinearGradient
        colors={topic.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 120,
          padding: 16,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 8, 
            padding: 8 
          }}>
            {renderIcon(topic, 22)}
          </View>
          <View style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 8, 
            paddingVertical: 4,
            paddingHorizontal: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="star" size={12} color="white" style={{ marginRight: 4 }} />
            <Text style={{ color: 'white', fontSize: 12 }}>{topic.rating}</Text>
          </View>
        </View>
        <View>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>
            {topic.title}
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
            {topic.category} • {topic.reviews} reviews
          </Text>
        </View>
      </LinearGradient>
      <View style={{ padding: 16 }}>
        <Text 
          style={{ color: '#4b5563', fontSize: 14, marginBottom: 12 }}
          numberOfLines={2}
        >
          {topic.description}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#4f46e5', fontWeight: '600', fontSize: 14, marginRight: 4 }}>
            Start a chat
          </Text>
          <Ionicons name="chatbubble" size={14} color="#4f46e5" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render health topic
  const renderTopicItem = (topic: HealthTopic) => {
    const gradientColors = topic.gradient || ['#4f46e5', '#7c3aed'];
    const topicMetrics = {
      topics: Math.floor(Math.random() * 20) + 5, // Random number between 5-25
      articles: Math.floor(Math.random() * 30) + 10 // Random number between 10-40
    };
    
    return (
      <TouchableOpacity
        key={topic.id}
        onPress={() => handleTopicPress(topic)}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: 80,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
          >
            {renderIcon(topic, 28)}
          </LinearGradient>
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 16 }}>
              {topic.title}
            </Text>
            <Text 
              style={{ color: '#6b7280', fontSize: 14, marginTop: 4, marginBottom: 12 }}
              numberOfLines={2}
            >
              {topic.description}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginRight: 12 }}>
                  {topicMetrics.topics} topics
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  {topicMetrics.articles} articles
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#4f46e5', fontWeight: '600', fontSize: 14, marginRight: 4 }}>
                  Ask about this topic
                </Text>
                <Ionicons name="chatbubble" size={14} color="#4f46e5" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Ionicons name="search" size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
      <Text style={{ color: '#374151', fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>
        No topics found
      </Text>
      <Text style={{ 
        color: '#6b7280', 
        fontSize: 14, 
        textAlign: 'center', 
        marginBottom: 16,
        maxWidth: '80%' 
      }}>
        Try adjusting your search or category filter
      </Text>
      <TouchableOpacity 
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('All');
        }}
        style={{
          backgroundColor: '#e0e7ff',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#4338ca', fontWeight: '600' }}>Show All Topics</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 16, color: '#6b7280', fontWeight: '500' }}>
          Loading health topics...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              Health Topics
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
              Discover and learn about health
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/chat')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 100,
              padding: 8,
            }}
          >
            <Ionicons name="chatbubbles" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search health topics..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ 
              flex: 1, 
              color: 'white',
              fontSize: 15,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginBottom: 24, marginTop: 4 }}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {categories.map(category => renderCategoryItem(category))}
        </ScrollView>
        
        {/* Featured Topics */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: 16 
          }}>
            Featured Topics
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {featuredTopics.map(topic => renderFeaturedTopic(topic))}
          </ScrollView>
        </View>
        
        {/* All Health Topics */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#111827', 
          marginBottom: 16 
        }}>
          {searchQuery 
            ? 'Search Results' 
            : selectedCategory !== 'All' 
              ? `${selectedCategory} Topics` 
              : 'All Health Topics'
          }
        </Text>
        
        {healthTopics.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
            <Text style={{ marginTop: 12, fontWeight: 'bold', color: '#374151', fontSize: 16 }}>
              No health topics available
            </Text>
            <Text style={{ marginTop: 4, textAlign: 'center', color: '#6b7280' }}>
              The database doesn't contain any health topics yet.
            </Text>
          </View>
        ) : filteredTopics.length > 0 ? (
          filteredTopics.map(topic => renderTopicItem(topic))
        ) : (
          renderEmptyState()
        )}
        
        {/* Suggest New Topic */}
        <View style={{
          backgroundColor: '#e0e7ff',
          borderRadius: 12,
          padding: 20,
          marginTop: 8,
          marginBottom: 24,
        }}>
          <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
            Don't see what you need?
          </Text>
          <Text style={{ color: '#4b5563', fontSize: 14, marginBottom: 16 }}>
            Chat with our health assistant about any health topic, even if it's not listed here.
          </Text>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/chat')}
            style={{
              backgroundColor: '#4f46e5',
              borderRadius: 8,
              padding: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chatbubbles" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
              Start a New Chat
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}