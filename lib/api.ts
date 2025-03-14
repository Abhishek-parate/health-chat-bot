import { v4 as uuidv4 } from './uuid-helper';
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
    
    // Convert to ChatMessage format
    const chatMessage: ChatMessage = {
      id: aiMessage.id,
      content: aiMessage.content,
      role: aiMessage.role,
      createdAt: aiMessage.createdAt
    };
    
    return { success: true, data: chatMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}