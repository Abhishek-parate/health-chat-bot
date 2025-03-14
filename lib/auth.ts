// lib/auth.js
import * as SecureStore from 'expo-secure-store';

// Demo user credentials
const DEMO_USER = {
  email: 'demo@example.com',
  password: 'password123',
  name: 'Demo User',
  id: 'demo-user-123'
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    // Make sure to return false if no token exists
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  // For demo purposes, check against hardcoded credentials
  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    // Save auth token
    await SecureStore.setItemAsync('auth_token', 'demo-token-123');
    await SecureStore.setItemAsync('user_info', JSON.stringify(DEMO_USER));
    return DEMO_USER;
  }
  
  // Return null for invalid credentials
  return null;
};

// Sign in with Google (mock implementation)
export const signInWithGoogle = async () => {
  try {
    // For demo purposes, just sign in as the demo user
    await SecureStore.setItemAsync('auth_token', 'demo-google-token-123');
    await SecureStore.setItemAsync('user_info', JSON.stringify(DEMO_USER));
    return DEMO_USER;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Sign up with email and password
export const signUp = async (name, email, password) => {
  try {
    // For demo purposes, just create and sign in as a new user
    const newUser = {
      email,
      name,
      id: `user-${Date.now()}`
    };
    
    await SecureStore.setItemAsync('auth_token', `token-${Date.now()}`);
    await SecureStore.setItemAsync('user_info', JSON.stringify(newUser));
    return newUser;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_info');
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const userInfo = await SecureStore.getItemAsync('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};