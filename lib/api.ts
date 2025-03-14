// lib/api.ts
import { v4 as uuidv4 } from 'uuid';
import * as db from './db';
import { generateAIResponse } from './groq';
import { ApiResponse, Conversation, ChatMessage, User, UserRole } from '@/types';

// User-related API functions
export async function registerUser(email: string, name: string): Promise<ApiResponse<User>> {
  try {
    const userId = uuidv4();
    const user = await db.createUser(userId, email, name);
    return { success: true, data: user };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: 'Failed to register user' };
  }
}

export async function getUserProfile(userId: string): Promise<ApiResponse<User>> {
  try {
    const user = await db.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: 'Failed to get user profile' };
  }
}

export async function getAllUserAccounts(): Promise<ApiResponse<User[]>> {
  try {
    const users = await db.getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { success: false, error: 'Failed to get all users' };
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ApiResponse<User>> {
  try {
    const user = await db.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const updatedUser = await db.createUser(user.id, user.email, user.name, role);
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

// Conversation-related API functions
export async function createNewConversation(userId: string, title: string): Promise<ApiResponse<Conversation>> {
  try {
    const conversationId = uuidv4();
    const conversation = await db.createConversation(conversationId, title, userId);
    return { success: true, data: conversation };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: 'Failed to create conversation' };
  }
}

export async function getUserConversations(userId: string): Promise<ApiResponse<Conversation[]>> {
  try {
    const conversations = await db.getConversationsByUserId(userId);
    return { success: true, data: conversations };
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return { success: false, error: 'Failed to get user conversations' };
  }
}

export async function getConversationDetails(conversationId: string): Promise<ApiResponse<Conversation>> {
  try {
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      return { success: false, error: 'Conversation not found' };
    }
    
    const messages = await db.getMessagesByConversationId(conversationId);
    return { 
      success: true, 
      data: { ...conversation, messages } 
    };
  } catch (error) {
    console.error('Error getting conversation details:', error);
    return { success: false, error: 'Failed to get conversation details' };
  }
}

export async function sendMessage(conversationId: string, content: string): Promise<ApiResponse<ChatMessage>> {
  try {
    // Get existing messages for context
    const messages = await db.getMessagesByConversationId(conversationId);
    
    // Create user message
    const userMessageId = uuidv4();
    const userMessage = await db.createMessage(userMessageId, content, 'user', conversationId);
    
    // Format messages for AI
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add current user message
    formattedMessages.push({
      role: 'user',
      content
    });
    
    // Generate AI response
    const aiResponse = await generateAIResponse(formattedMessages);
    
    // Store AI response
    const aiMessageId = uuidv4();
    const aiMessage = await db.createMessage(aiMessageId, aiResponse, 'assistant', conversationId);
    
    // Update conversation timestamp
    await db.updateConversationTitle(conversationId, content.substring(0, 50) + (content.length > 50 ? '...' : ''));
    
    return { success: true, data: aiMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function deleteUserConversation(conversationId: string): Promise<ApiResponse<void>> {
  try {
    await db.deleteConversation(conversationId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: 'Failed to delete conversation' };
  }
}