// lib/chatStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Conversation } from '@/types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'health_assistant_conversations',
  CHAT_MESSAGES_PREFIX: 'health_assistant_chat_messages_'
};

// Get all conversations
export async function getConversations(): Promise<Conversation[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error retrieving conversations:', error);
    return [];
  }
}

// Get chat history for a specific conversation
export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(
      `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${conversationId}`
    );
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error(`Error retrieving chat history for conversation ${conversationId}:`, error);
    return [];
  }
}

// Create a new conversation
export async function createConversation(
  title: string,
  category: string = 'General',
  initialMessage?: string
): Promise<Conversation> {
  try {
    const conversations = await getConversations();
    
    const newConversation: Conversation = {
      id: uuidv4(),
      title: title || 'New Conversation',
      preview: initialMessage || 'Start a new conversation',
      lastMessageDate: new Date(),
      category: category
    };
    
    // Add to conversations list
    const updatedConversations = [newConversation, ...conversations];
    await AsyncStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS, 
      JSON.stringify(updatedConversations)
    );
    
    // If there's an initial message, save it
    if (initialMessage) {
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: `Hello! How can I help you with ${title.toLowerCase()}?`,
        role: 'assistant',
        createdAt: new Date()
      };
      
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content: initialMessage,
        role: 'user',
        createdAt: new Date(Date.now() + 1000) // 1 second after welcome message
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${newConversation.id}`, 
        JSON.stringify([welcomeMessage, userMessage])
      );
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Hello! I'm your health assistant. How can I help you today?",
        role: 'assistant',
        createdAt: new Date()
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${newConversation.id}`, 
        JSON.stringify([welcomeMessage])
      );
    }
    
    return newConversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Add a new message to a conversation
export async function addMessage(
  conversationId: string,
  message: string,
  role: 'user' | 'assistant'
): Promise<ChatMessage> {
  try {
    // Get existing messages
    const messages = await getChatHistory(conversationId);
    
    // Create new message
    const newMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      role: role,
      createdAt: new Date()
    };
    
    // Add to messages list
    const updatedMessages = [...messages, newMessage];
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${conversationId}`, 
      JSON.stringify(updatedMessages)
    );
    
    // Update conversation preview and last message date
    const conversations = await getConversations();
    const updatedConversations = conversations.map(convo => {
      if (convo.id === conversationId) {
        return {
          ...convo,
          preview: message.length > 50 ? message.substring(0, 47) + '...' : message,
          lastMessageDate: new Date()
        };
      }
      return convo;
    });
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS, 
      JSON.stringify(updatedConversations)
    );
    
    return newMessage;
  } catch (error) {
    console.error(`Error adding message to conversation ${conversationId}:`, error);
    throw error;
  }
}

// Update conversation title
export async function updateConversationTitle(
  conversationId: string,
  newTitle: string
): Promise<void> {
  try {
    const conversations = await getConversations();
    const updatedConversations = conversations.map(convo => {
      if (convo.id === conversationId) {
        return {
          ...convo,
          title: newTitle
        };
      }
      return convo;
    });
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS, 
      JSON.stringify(updatedConversations)
    );
  } catch (error) {
    console.error(`Error updating title for conversation ${conversationId}:`, error);
    throw error;
  }
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    // Remove from conversations list
    const conversations = await getConversations();
    const updatedConversations = conversations.filter(
      convo => convo.id !== conversationId
    );
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS, 
      JSON.stringify(updatedConversations)
    );
    
    // Remove messages
    await AsyncStorage.removeItem(
      `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${conversationId}`
    );
  } catch (error) {
    console.error(`Error deleting conversation ${conversationId}:`, error);
    throw error;
  }
}

// Clear all conversations and messages (useful for testing or reset)
export async function clearAllChats(): Promise<void> {
  try {
    // Get all conversations to find their IDs
    const conversations = await getConversations();
    
    // Remove all message collections
    for (const convo of conversations) {
      await AsyncStorage.removeItem(
        `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${convo.id}`
      );
    }
    
    // Clear conversations list
    await AsyncStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
  } catch (error) {
    console.error('Error clearing all chats:', error);
    throw error;
  }
}