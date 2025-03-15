// lib/chatService.ts
import { supabase } from './supabase';
import { generateAIResponse } from './groq';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a new conversation
export async function createConversation(userId: string, title: string = 'New Chat'): Promise<Conversation | null> {
  try {
    const conversationId = uuidv4();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('health_conversations')
      .insert([
        {
          id: conversationId,
          user_id: userId,
          title,
          created_at: now,
          updated_at: now
        }
      ])
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    // Add system message to initialize conversation
    await addMessage({
      conversationId,
      content: 'You are a helpful healthcare assistant providing general health information. Always remind users to consult with healthcare professionals for medical advice. Avoid diagnosing conditions or prescribing treatments.',
      role: 'system',
    });
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error in createConversation:', error);
    return null;
  }
}

// Get user conversations
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('health_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    return [];
  }
}

// Add a message to a conversation
export async function addMessage({
  conversationId,
  content,
  role,
  id = uuidv4(),
  createdAt = new Date()
}: {
  conversationId: string,
  content: string,
  role: 'user' | 'assistant' | 'system',
  id?: string,
  createdAt?: Date
}): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('health_messages')
      .insert([
        {
          id,
          conversation_id: conversationId,
          content,
          role,
          created_at: createdAt.toISOString()
        }
      ])
      .select('*')
      .single();
    
    if (error) {
      console.error('Error adding message:', error);
      return null;
    }
    
    // Update conversation's updated_at timestamp
    await supabase
      .from('health_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    return {
      id: data.id,
      conversationId: data.conversation_id,
      content: data.content,
      role: data.role,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error in addMessage:', error);
    return null;
  }
}

// Get messages for a conversation
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('health_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      conversationId: item.conversation_id,
      content: item.content,
      role: item.role,
      createdAt: new Date(item.created_at)
    }));
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return [];
  }
}

// Delete a conversation and its messages
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    // First delete all messages
    const { error: messagesError } = await supabase
      .from('health_messages')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return false;
    }
    
    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('health_conversations')
      .delete()
      .eq('id', conversationId);
    
    if (conversationError) {
      console.error('Error deleting conversation:', conversationError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return false;
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('health_conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    if (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateConversationTitle:', error);
    return false;
  }
}

// Send a message and get AI response
export async function sendMessageAndGetResponse(
  conversationId: string,
  message: string
): Promise<{userMessage: ChatMessage | null, aiMessage: ChatMessage | null}> {
  try {
    // Add user message to database
    const userMessage = await addMessage({
      conversationId,
      content: message,
      role: 'user',
    });
    
    if (!userMessage) {
      throw new Error('Failed to save user message');
    }
    
    // Get conversation history to provide context
    const messages = await getConversationMessages(conversationId);
    
    // Format messages for AI
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Get AI response
    const aiResponse = await generateAIResponse(formattedMessages);
    
    // Add AI response to database
    const aiMessage = await addMessage({
      conversationId,
      content: aiResponse,
      role: 'assistant',
    });
    
    return { userMessage, aiMessage };
  } catch (error) {
    console.error('Error in sendMessageAndGetResponse:', error);
    return { userMessage: null, aiMessage: null };
  }
}