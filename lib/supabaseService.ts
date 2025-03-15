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

// Helper function to create user profile when they sign up
export async function createUserProfile(userId: string, userData: Partial<Profile>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                full_name: userData.full_name || '',
                avatar_url: userData.avatar_url || '',
                role: userData.role || 'user',
                phone_number: userData.phone_number || '',
                phone_verified: userData.phone_verified || false,
                status: 'offline'
            }]);

        if (error) {
            console.error('Error creating user profile:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Exception creating user profile:', error);
        return false;
    }
}



// User Profile Service
export const ProfileService = {
    async getProfile(userId: string): Promise<Profile | null> {
      try {
        console.log(`Fetching profile for user ID: ${userId}`);
        
        if (!userId) {
          console.error('Error: No userId provided to getProfile');
          return null;
        }
        
        // Query the profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows returned
        
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        
        if (!data) {
          console.log(`No profile found for user ID: ${userId}`);
          return null;
        }
        
        console.log('Profile retrieved successfully');
        return data as Profile;
      } catch (error) {
        console.error('Exception in getProfile:', error);
        return null;
      }
    },


    async getAvailableDoctors(): Promise<Profile[]> {
        try {
          console.log('Fetching available doctors');
          
          // Get doctors who are online or busy, but not offline
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'doctor')
            .neq('status', 'offline');
      
          if (error) {
            console.error('Error fetching available doctors:', error);
            return [];
          }
      
          console.log(`Retrieved ${data?.length || 0} available doctors`);
          return data as Profile[] || [];
        } catch (error) {
          console.error('Exception in getAvailableDoctors:', error);
          return [];
        }
      }
}





  
// Conversation Service
export const ConversationService = {
    async createConversation(userId: string, title?: string): Promise<Conversation | null> {
        const { data, error } = await supabase
            .from('conversations')
            .insert([{
                user_id: userId,
                title: title || `Conversation ${new Date().toLocaleString()}`,
                status: 'active',
                is_doctor_chat: false
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
    },

    async closeConversation(conversationId: string): Promise<boolean> {
        const { error } = await supabase
            .from('conversations')
            .update({
                status: 'closed',
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId);

        if (error) {
            console.error('Error closing conversation:', error);
            return false;
        }

        return true;
    },

    async deleteConversation(conversationId: string): Promise<boolean> {
        // Delete all messages first (due to foreign key constraint)
        const messagesDeleted = await MessageService.deleteMessagesForConversation(conversationId);

        if (!messagesDeleted) {
            console.error('Failed to delete messages for conversation');
            return false;
        }

        // Now delete the conversation
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId);

        if (error) {
            console.error('Error deleting conversation:', error);
            return false;
        }

        return true;
    },

    async getDoctorConversations(doctorId: string): Promise<Conversation[]> {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
            .eq('doctor_id', doctorId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching doctor conversations:', error);
            return [];
        }

        return data as any[];
    },

    async getAllConversations(): Promise<any[]> {
        // This should only be callable by admins due to RLS policies
        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        user:user_id (id, full_name, avatar_url),
        doctor:doctor_id (id, full_name, avatar_url, specialty)
      `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching all conversations:', error);
            return [];
        }

        return data;
    },
    
    
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
    },

    async getMessageCount(conversationId: string): Promise<{ count: number }> {
        const { count, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conversationId);

        if (error) {
            console.error('Error counting messages:', error);
            return { count: 0 };
        }

        return { count: count || 0 };
    },

    async getUnreadMessagesForConversation(
        conversationId: string,
        userId: string
    ): Promise<{ count: number, messages: Message[] }> {
        // Get unread messages in this conversation not sent by the current user
        const { data, count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread messages:', error);
            return { count: 0, messages: [] };
        }

        return {
            count: count || 0,
            messages: data as Message[]
        };
    },

    async deleteMessagesForConversation(conversationId: string): Promise<boolean> {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId);

        if (error) {
            console.error('Error deleting messages:', error);
            return false;
        }

        return true;
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

    // Fix for DoctorRequestService getAllRequests method
async getAllRequests(): Promise<any[]> { // Removed the stray 'f' character
    try {
        console.log('Fetching all doctor requests');
        // This should only be callable by admins and doctors due to RLS policies
        const { data, error } = await supabase
            .from('doctor_requests')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    avatar_url
                ),
                conversation:conversation_id (
                    title,
                    created_at,
                    doctor_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all doctor requests:', error);
            return [];
        }

        console.log(`Retrieved ${data?.length || 0} doctor requests`);
        return data || [];
    } catch (error) {
        console.error('Exception in getAllRequests:', error);
        return [];
    }
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

    async getRequest(requestId: string): Promise<DoctorRequest | null> {
        try {
          console.log(`Fetching request with ID: ${requestId}`);
          const { data, error } = await supabase
            .from('doctor_requests')
            .select('*')
            .eq('id', requestId)
            .single();
    
          if (error) {
            console.error('Error fetching doctor request:', error);
            return null;
          }
    
          console.log('Retrieved request:', data);
          return data as DoctorRequest;
        } catch (error) {
          console.error('Exception in getRequest:', error);
          return null;
        }
      },


    async getPendingRequests(): Promise<any[]> {
        try {
          // This should only be callable by doctors and admins due to RLS policies
          const { data, error } = await supabase
            .from('doctor_requests')
            .select(`
              *,
              profiles:user_id (
                full_name,
                avatar_url
              ),
              conversation:conversation_id (
                title,
                created_at
              )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
    
          if (error) {
            console.error('Error fetching pending doctor requests:', error);
            return [];
          }
    
          return data || [];
        } catch (error) {
          console.error('Exception in getPendingRequests:', error);
          return [];
        }
      },
    
      async updateRequestStatus(
        requestId: string,
        status: 'approved' | 'rejected' | 'cancelled',
        doctorId?: string
      ): Promise<boolean> {
        try {
          console.log(`Starting updateRequestStatus for request ${requestId} with status ${status}`);
          
          // First get the request to check if it exists and is still pending
          const { data: requestData, error: fetchError } = await supabase
            .from('doctor_requests')
            .select('*')
            .eq('id', requestId)
            .single();
    
          if (fetchError || !requestData) {
            console.error('Error fetching doctor request:', fetchError);
            return false;
          }
    
          console.log('Current request data:', requestData);
    
          // Check if request is already processed
          if (requestData.status !== 'pending') {
            console.error(`Request ${requestId} already processed with status: ${requestData.status}`);
            return false;
          }
    
          // Now update the request status
          console.log(`Updating request ${requestId} status to ${status}`);
          const { data: updateData, error: updateError } = await supabase
            .from('doctor_requests')
            .update({
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .select();
    
          if (updateError) {
            console.error('Error updating doctor request status:', updateError);
            return false;
          }
    
          console.log('Update result:', updateData);
          
          // If approved and we have a doctorId, assign the doctor to the conversation
          if (status === 'approved' && doctorId && requestData.conversation_id) {
            console.log(`Assigning doctor ${doctorId} to conversation ${requestData.conversation_id}`);
            
            // Update the conversation separately
            const { error: convoError } = await supabase
              .from('conversations')
              .update({
                doctor_id: doctorId,
                is_doctor_chat: true,
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', requestData.conversation_id);
    
            if (convoError) {
              console.error('Error assigning doctor to conversation:', convoError);
              
              // If conversation update fails, revert the request status change
              console.log('Reverting request status change due to conversation update failure');
              await supabase
                .from('doctor_requests')
                .update({
                  status: 'pending',
                  updated_at: new Date().toISOString()
                })
                .eq('id', requestId);
                
              return false;
            }
            
            console.log('Doctor successfully assigned to conversation');
          }
    
          return true;
        } catch (error) {
          console.error('Exception in updateRequestStatus:', error);
          return false;
        }
      },
      
    async getAllRequests(): Promise<any[]> {f
        // This should only be callable by admins due to RLS policies
        const { data, error } = await supabase
            .from('doctor_requests')
            .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        conversation:conversation_id (
          title,
          created_at,
          doctor_id
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all doctor requests:', error);
            return [];
        }

        return data;
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
    },

    async createHealthTopic(topic: Omit<HealthTopic, 'id' | 'created_at' | 'updated_at'>): Promise<HealthTopic | null> {
        const { data, error } = await supabase
            .from('health_topics')
            .insert([topic])
            .select()
            .single();

        if (error) {
            console.error('Error creating health topic:', error);
            return null;
        }

        return data as HealthTopic;
    },

    async updateHealthTopic(topicId: string, updates: Partial<HealthTopic>): Promise<boolean> {
        const { error } = await supabase
            .from('health_topics')
            .update(updates)
            .eq('id', topicId);

        if (error) {
            console.error('Error updating health topic:', error);
            return false;
        }

        return true;
    },

    async deleteHealthTopic(topicId: string): Promise<boolean> {
        const { error } = await supabase
            .from('health_topics')
            .delete()
            .eq('id', topicId);

        if (error) {
            console.error('Error deleting health topic:', error);
            return false;
        }

        return true;
    }
};

// Set up realtime subscriptions
export function setupRealtimeSubscriptions(userId: string, callback: (payload: any) => void) {
    // Get all conversations where the user is involved
    ConversationService.getUserConversations(userId).then(conversations => {
        const conversationIds = conversations.map(c => c.id);

        // Subscribe to changes in these conversations
        const conversationsSubscription = supabase
            .channel('public:conversations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `user_id=eq.${userId}`
                },
                payload => {
                    callback({
                        type: 'conversation',
                        event: payload.eventType,
                        data: payload.new
                    });
                }
            )
            .subscribe();

        // Subscribe to messages in these conversations
        if (conversationIds.length > 0) {
            const messagesSubscription = supabase
                .channel('public:messages')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=in.(${conversationIds.join(',')})`
                    },
                    payload => {
                        callback({
                            type: 'message',
                            event: 'INSERT',
                            data: payload.new
                        });
                    }
                )
                .subscribe();
        }

        // Subscribe to doctor requests
        const requestsSubscription = supabase
            .channel('public:doctor_requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'doctor_requests',
                    filter: `user_id=eq.${userId}`
                },
                payload => {
                    callback({
                        type: 'doctor_request',
                        event: payload.eventType,
                        data: payload.new
                    });
                }
            )
            .subscribe();

        // For doctors, subscribe to pending requests
        ProfileService.getProfile(userId).then(profile => {
            if (profile?.role === 'doctor') {
                const pendingRequestsSubscription = supabase
                    .channel('public:pending_requests')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'doctor_requests',
                            filter: 'status=eq.pending'
                        },
                        payload => {
                            callback({
                                type: 'pending_request',
                                event: 'INSERT',
                                data: payload.new
                            });
                        }
                    )
                    .subscribe();
            }
        });
    });
}

// Remove subscriptions
export function removeRealtimeSubscriptions() {
    supabase.removeAllChannels();
}