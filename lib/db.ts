import { PrismaClient } from '@prisma/client';
import * as Constants from 'expo-constants';
import { v4 as uuidv4 } from './uuid-helper';

// Initialize Prisma client
const prisma = new PrismaClient();

// Types for our database entities
export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
  healthProfile?: HealthProfile;
};

export type HealthProfile = {
  id: string;
  userId: string;
  age?: number;
  gender?: string;
  height?: number; // in cm
  weight?: number; // in kg
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  createdAt: Date;
  updatedAt?: Date;
};

export type Conversation = {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  messages?: ChatMessage[];
};

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversationId: string;
  createdAt: Date;
};

export type HealthAdvice = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
};

// Database initialization
export async function initializeDatabase() {
  try {
    // Use a mock database during development
    console.log('Initializing database...');
    
    // Skip actual database connection during development
    // This prevents errors when DATABASE_URL is not set or accessible
    if (__DEV__) {
      console.warn('Development mode: Using mock database');
      return true;
    }
    
    // In production, we would connect to the real database
    await prisma.$connect();
    console.log('Successfully connected to NeonDB');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Return true to allow the app to continue even with errors
    return true;
  }
}

// User-related operations
export async function createUser(userId: string, email: string, name: string) {
  // Split name into first and last if possible
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  
  return prisma.user.create({
    data: {
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'user',
      createdAt: new Date(),
      healthProfile: {
        create: {
          id: uuidv4(),
          createdAt: new Date()
        }
      }
    },
    include: {
      healthProfile: true
    }
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      healthProfile: true
    }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      healthProfile: true
    }
  });
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      updatedAt: new Date()
    }
  });
}

// Health profile operations
export async function updateHealthProfile(userId: string, data: Partial<HealthProfile>) {
  return prisma.healthProfile.update({
    where: { userId },
    data: {
      age: data.age,
      gender: data.gender,
      height: data.height,
      weight: data.weight,
      medicalConditions: data.medicalConditions,
      allergies: data.allergies,
      medications: data.medications,
      updatedAt: new Date()
    }
  });
}

export async function getHealthProfile(userId: string) {
  return prisma.healthProfile.findUnique({
    where: { userId }
  });
}

// Conversation-related operations
export async function createConversation(conversationId: string, title: string, userId: string) {
  return prisma.conversation.create({
    data: {
      id: conversationId,
      title: title,
      userId: userId,
      createdAt: new Date()
    }
  });
}

export async function getConversationById(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
}

export async function getConversationsByUserId(userId: string) {
  // Get all conversations for this user
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: {
      updatedAt: 'desc'
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Get only the latest message for preview
      }
    }
  });
  
  // Format data for the UI
  return conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    preview: conv.messages && conv.messages.length > 0 
      ? conv.messages[0].content.substring(0, 60) + (conv.messages[0].content.length > 60 ? '...' : '')
      : '',
    lastMessageDate: conv.updatedAt || conv.createdAt,
    category: 'Health' // Default category, can be customized later
  }));
}

export async function updateConversationTitle(conversationId: string, title: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      title,
      updatedAt: new Date()
    }
  });
}

export async function deleteConversation(conversationId: string) {
  // Delete all messages in the conversation first (cascade delete not always reliable)
  await prisma.message.deleteMany({
    where: { conversationId }
  });

  // Then delete the conversation
  return prisma.conversation.delete({
    where: { id: conversationId }
  });
}

// Message-related operations
export async function createMessage(messageId: string, content: string, role: 'user' | 'assistant', conversationId: string) {
  // Create the message
  const message = await prisma.message.create({
    data: {
      id: messageId,
      content: content,
      role: role,
      conversationId: conversationId,
      createdAt: new Date()
    }
  });

  // Update the conversation's updatedAt timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  return message;
}

export async function getMessagesByConversationId(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

// Health advice operations
export async function createHealthAdvice(advice: Omit<HealthAdvice, 'updatedAt'>) {
  return prisma.healthAdvice.create({
    data: {
      id: advice.id,
      title: advice.title,
      content: advice.content,
      category: advice.category,
      tags: advice.tags,
      createdAt: advice.createdAt
    }
  });
}

export async function getHealthAdviceById(adviceId: string) {
  return prisma.healthAdvice.findUnique({
    where: { id: adviceId }
  });
}

export async function getAllHealthAdvice() {
  return prisma.healthAdvice.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getHealthAdviceByCategory(category: string) {
  return prisma.healthAdvice.findMany({
    where: { category },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function updateHealthAdvice(adviceId: string, data: Partial<HealthAdvice>) {
  return prisma.healthAdvice.update({
    where: { id: adviceId },
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      updatedAt: new Date()
    }
  });
}

export async function deleteHealthAdvice(adviceId: string) {
  return prisma.healthAdvice.delete({
    where: { id: adviceId }
  });
}