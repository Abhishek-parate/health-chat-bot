// lib/supabaseService.ts
import { supabase } from '@/utils/supabase';

// Types for database tables
export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'user' | 'doctor' | 'admin';
  phone_number?: string;
  phone_verified: boolean;
  specialty?: string;
  years_experience?: number;
  bio?: string;
  website?: string;
  status: 'online' | 'offline' | 'busy';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title?: string;
  user_id: string;
  doctor_id?: string;
  is_doctor_chat: boolean;
  status: 'pending' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  role: 'user' | 'doctor' | 'assistant';
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DoctorRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  conversation_id?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthTopic {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  gradient?: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

// User Profile Service
export const ProfileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as Profile;
  },
  
  async updateProfile(userId: string, profileData: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    
    return true;
  },
  
  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'busy'): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating user status:', error);
      return false;
    }
    
    return true;
  },
  
  async getDoctors(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor');
      
    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
    
    return data as Profile[];
  },
  
  async getAllUsers(): Promise<Profile[]> {
    // This should only be callable by admins due to RLS policies
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
    
    return data as Profile[];
  }
};

// Conversation Service
export const ConversationService = {
  async createConversation(userId: string, title?: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ 
        user_id: userId,
        title: title || `Conversation ${new Date().toLocaleString()}`,
        status: 'active'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    return data as Conversation;
  },
  
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
      
    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
    
    return data as Conversation;
  },
  
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_id.eq.${userId},doctor_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }
    
    return data as Conversation[];
  },
  
  async updateConversation(
    conversationId: string, 
    updates: Partial<Conversation>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
      
    if (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
    
    return true;
  },
  
  async assignDoctorToConversation(
    conversationId: string, 
    doctorId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        doctor_id: doctorId, 
        is_doctor_chat: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
      
    if (error) {
      console.error('Error assigning doctor to conversation:', error);
      return false;
    }
    
    return true;
  }
};

// Message Service
export const MessageService = {
  async sendMessage(
    conversationId: string, 
    role: 'user' | 'doctor' | 'assistant', 
    content: string,
    senderId?: string
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        role,
        content,
        is_read: false
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    
    // Update conversation's updated_at time
    await ConversationService.updateConversation(conversationId, {});
    
    return data as Message;
  },
  
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data as Message[];
  },
  
  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    // Mark all messages not sent by the current user as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
      
    if (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
    
    return true;
  },
  
  async getUnreadMessageCount(userId: string): Promise<number> {
    // Get all conversations where the user is involved
    const { data: conversations, error: convoError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_id.eq.${userId},doctor_id.eq.${userId}`);
      
    if (convoError || !conversations) {
      console.error('Error fetching conversations for unread count:', convoError);
      return 0;
    }
    
    const conversationIds = conversations.map(c => c.id);
    
    if (conversationIds.length === 0) return 0;
    
    // Count unread messages across all user's conversations
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);
      
    if (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
    
    return count || 0;
  }
};

// Doctor Request Service
export const DoctorRequestService = {
  async createDoctorRequest(
    userId: string, 
    reason?: string
  ): Promise<{ request: DoctorRequest | null, conversation: Conversation | null }> {
    // Create a new conversation first
    const conversation = await ConversationService.createConversation(
      userId,
      'Doctor Consultation'
    );
    
    if (!conversation) {
      return { request: null, conversation: null };
    }
    
    // Create the doctor request
    const { data, error } = await supabase
      .from('doctor_requests')
      .insert([{
        user_id: userId,
        conversation_id: conversation.id,
        reason,
        status: 'pending'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating doctor request:', error);
      return { request: null, conversation };
    }
    
    return { 
      request: data as DoctorRequest, 
      conversation 
    };
  },
  
  async getPendingRequests(): Promise<DoctorRequest[]> {
    // This should only be callable by doctors and admins due to RLS policies
    const { data, error } = await supabase
      .from('doctor_requests')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching pending doctor requests:', error);
      return [];
    }
    
    return data as any[];
  },
  
  async getUserRequests(userId: string): Promise<DoctorRequest[]> {
    const { data, error } = await supabase
      .from('doctor_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching user doctor requests:', error);
      return [];
    }
    
    return data as DoctorRequest[];
  },
  
  async updateRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected' | 'cancelled',
    doctorId?: string
  ): Promise<boolean> {
    // Update the request status
    const { data, error } = await supabase
      .from('doctor_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();
      
    if (error || !data) {
      console.error('Error updating doctor request status:', error);
      return false;
    }
    
    // If approved and we have a doctorId, assign the doctor to the conversation
    if (status === 'approved' && doctorId && data.conversation_id) {
      const success = await ConversationService.assignDoctorToConversation(
        data.conversation_id,
        doctorId
      );
      
      if (!success) {
        console.error('Failed to assign doctor to conversation');
        return false;
      }
    }
    
    return true;
  }
};

// Health Topics Service
export const HealthTopicService = {
  async getHealthTopics(): Promise<HealthTopic[]> {
    const { data, error } = await supabase
      .from('health_topics')
      .select('*')
      .order('title', { ascending: true });
      
    if (error) {
      console.error('Error fetching health topics:', error);
      return [];
    }
    
    return data as HealthTopic[];
  },
  
  async getHealthTopic(topicId: string): Promise<HealthTopic | null> {
    const { data, error } = await supabase
      .from('health_topics')
      .select('*')
      .eq('id', topicId)
      .single();
      
    if (error) {
      console.error('Error fetching health topic:', error);
      return null;
    }
    
    return data as HealthTopic;
  }
}