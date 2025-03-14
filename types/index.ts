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

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversationId: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export interface HealthAdvice {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}// types/index.ts

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
  
  export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    conversationId: string;
    createdAt: Date;
  }
  
  export interface Conversation {
    id: string;
    title: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    messages?: Message[];
  }
  
  export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
  }
  
  export interface HealthAdvice {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }

  export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
  }
  
  export interface Conversation {
    id: string;
    title: string;
    preview: string;
    lastMessageDate: Date;
    category?: string;
  }