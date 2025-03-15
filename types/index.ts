// types/index.ts

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  messages?: ChatMessage[];
  // For UI display
  preview?: string;
  lastMessageDate?: Date;
  category?: string;
}

export interface HealthAdvice {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types for message formatting
export interface FormattedMessage {
  role: string;
  content: string;
}