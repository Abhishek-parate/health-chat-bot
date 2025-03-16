// lib/chatService.ts
import { 
    MessageService, 
    ConversationService, 
    DoctorRequestService,
    Message, 
    Conversation,
    ProfileService
  } from './supabaseService';
  import { generateAIResponse } from './groq';
  
  export interface ChatMessage {
    id: string;
    role: 'user' | 'doctor' | 'assistant';
    content: string;
    timestamp: string;
    sender?: {
      id: string;
      name?: string;
      avatar?: string;
    };
    isRead: boolean;
  }
  
  // Convert database message to chat message format
  export function formatMessage(message: Message, senderName?: string, senderAvatar?: string): ChatMessage {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.created_at,
      sender: message.sender_id ? {
        id: message.sender_id,
        name: senderName,
        avatar: senderAvatar
      } : undefined,
      isRead: message.is_read
    };
  }
  
  // Create a new conversation
// Create a new conversation
export async function createConversation(userId: string, title?: string): Promise<Conversation | null> {
    try {
      const conversation = await ConversationService.createConversation(userId, title);
      
      if (!conversation) {
        throw new Error('Failed to create conversation');
      }
      
      // Get the user's profile to access their name
      const userProfile = await ProfileService.getProfile(userId);
      const userName = userProfile?.full_name?.split(' ')[0] || '';
      
      // Create a personalized greeting
      const greeting = userName 
        ? `Hello ${userName}! I'm your Health Sync AI. How can I help you today? You can ask me general health questions, or request to speak with a healthcare professional if you need more specific advice.`
        : `Hello! I'm your Health Sync AI. How can I help you today? You can ask me general health questions, or request to speak with a healthcare professional if you need more specific advice.`;
      
      // Send a welcome message from the assistant
      await MessageService.sendMessage(
        conversation.id,
        'assistant',
        greeting
      );
      
      return conversation;
    } catch (error) {
      console.error('Error in createConversation:', error);
      return null;
    }
  }
  
  // Get all messages for a conversation
  export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const messages = await MessageService.getMessages(conversationId);
      
      // Get sender information for each message with a sender_id
      const formattedMessages = await Promise.all(messages.map(async (msg) => {
        if (msg.sender_id) {
          const profile = await ProfileService.getProfile(msg.sender_id);
          return formatMessage(
            msg, 
            profile?.full_name || 'Unknown User', 
            profile?.avatar_url
          );
        }
        return formatMessage(msg);
      }));
      
      return formattedMessages;
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  }
  
  // Send a message and get AI response
  export async function sendMessageAndGetResponse(
    conversationId: string, 
    message: string,
    userId?: string
  ): Promise<{ userMessage?: ChatMessage; aiMessage?: ChatMessage }> {
    try {
      // Save user message
      const userMessage = await MessageService.sendMessage(
        conversationId,
        'user',
        message,
        userId
      );
      
      if (!userMessage) {
        throw new Error('Failed to save user message');
      }
      
      // Get conversation details to check if this is a doctor chat
      const conversation = await ConversationService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Get user profile for formatting message
      let userProfile = null;
      if (userId) {
        userProfile = await ProfileService.getProfile(userId);
      }
      
      // If this is a chat with a doctor, don't generate AI response
      if (conversation.is_doctor_chat && conversation.doctor_id) {
        return { 
          userMessage: formatMessage(
            userMessage, 
            userProfile?.full_name,
            userProfile?.avatar_url
          ) 
        };
      }
      
      // Get conversation history for context
      const messageHistory = await MessageService.getMessages(conversationId);
      
      // Format messages for the AI
      const formattedHistory = messageHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
      
      // Generate AI response
      const aiResponse = await generateAIResponse(formattedHistory);
      
      // Save AI response
      const aiMessage = await MessageService.sendMessage(
        conversationId,
        'assistant',
        aiResponse
      );
      
      if (!aiMessage) {
        throw new Error('Failed to save AI response');
      }
      
      return { 
        userMessage: formatMessage(
          userMessage,
          userProfile?.full_name,
          userProfile?.avatar_url
        ),
        aiMessage: formatMessage(aiMessage)
      };
    } catch (error) {
      console.error('Error in sendMessageAndGetResponse:', error);
      throw error;
    }
  }
  
  // Request a doctor consultation
  export async function requestDoctorConsultation(
    userId: string,
    reason: string
  ): Promise<{ success: boolean; conversationId?: string }> {
    try {
      const { request, conversation } = await DoctorRequestService.createDoctorRequest(
        userId,
        reason
      );
      
      if (!request || !conversation) {
        throw new Error('Failed to create doctor request');
      }
      
      // Add a system message about the request status
      await MessageService.sendMessage(
        conversation.id,
        'assistant',
        'Your request to speak with a healthcare professional has been submitted. ' +
        'A doctor will be with you as soon as possible. You can continue to chat with me ' +
        'in the meantime if you have general health questions.'
      );
      
      return { 
        success: true,
        conversationId: conversation.id
      };
    } catch (error) {
      console.error('Error in requestDoctorConsultation:', error);
      return { success: false };
    }
  }
  
  // Mark all messages in a conversation as read
  export async function markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      return await MessageService.markMessagesAsRead(conversationId, userId);
    } catch (error) {
      console.error('Error in markConversationAsRead:', error);
      return false;
    }
  }
  
  // Get all conversations for a user with additional metadata
  export async function getUserConversations(userId: string): Promise<any[]> {
    try {
      const conversations = await ConversationService.getUserConversations(userId);
      
      // Enhance conversations with additional data
      const enhancedConversations = await Promise.all(conversations.map(async (convo) => {
        // Get the last message for preview
        const messages = await MessageService.getMessages(convo.id);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        // Get unread message count
        const { count: unreadCount } = await MessageService.getUnreadMessagesForConversation(
          convo.id, 
          userId
        );
        
        // Get doctor info if this is a doctor chat
        let doctorInfo = null;
        if (convo.is_doctor_chat && convo.doctor_id) {
          doctorInfo = await ProfileService.getProfile(convo.doctor_id);
        }
        
        // Get user info if you're the doctor viewing this conversation
        let userInfo = null;
        if (convo.user_id !== userId) {
          userInfo = await ProfileService.getProfile(convo.user_id);
        }
        
        return {
          ...convo,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            role: lastMessage.role,
            timestamp: lastMessage.created_at
          } : null,
          unreadCount,
          doctorInfo: doctorInfo ? {
            name: doctorInfo.full_name,
            avatar: doctorInfo.avatar_url,
            specialty: doctorInfo.specialty
          } : null,
          userInfo: userInfo ? {
            name: userInfo.full_name,
            avatar: userInfo.avatar_url
          } : null
        };
      }));
      
      return enhancedConversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }
  
  // For admin and doctor: get all conversations
  export async function getAllConversations(): Promise<any[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user:user_id (id, full_name, avatar_url),
          doctor:doctor_id (id, full_name, avatar_url, specialty)
        `)
        .order('updated_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Enhance conversations with message counts
      const enhancedConversations = await Promise.all(conversations.map(async (convo) => {
        const { count: messageCount } = await MessageService.getMessageCount(convo.id);
        
        // Get the last message
        const messages = await MessageService.getMessages(convo.id);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          ...convo,
          messageCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            role: lastMessage.role,
            timestamp: lastMessage.created_at
          } : null
        };
      }));
      
      return enhancedConversations;
    } catch (error) {
      console.error('Error in getAllConversations:', error);
      return [];
    }
  }