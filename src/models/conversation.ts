// src/models/conversation.ts

export interface Conversation {
  id: string;                           // uuid
  companyId: string;                    // uuid - foreign key to companies
  title?: string | null;                // Human-readable conversation title
  context?: ConversationContext | null; // Additional context
  messages?: Message[] | null;          // Array of message objects
  summary?: string | null;              // AI-generated summary
  status: string;                       // 'active' | 'archived' | 'completed'
  lastMessageAt?: Date | null;          // Timestamp of most recent message
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;                    // ISO 8601 format
  metadata?: {
    [key: string]: any;
  };
}

export interface ConversationContext {
  productIds?: string[];                // UUIDs of products discussed
  preferences?: {
    regions?: string[];
    storeSize?: string;
    priceTier?: string;
    [key: string]: any;
  };
  [key: string]: any;                   // Allow additional properties
}

export interface CreateConversationInput {
  companyId: string;
  title?: string;
  context?: ConversationContext;
  messages?: Message[];
  status?: string;
}

export interface UpdateConversationInput {
  title?: string;
  context?: ConversationContext;
  messages?: Message[];
  summary?: string;
  status?: string;
  lastMessageAt?: Date;
}

export interface AddMessageInput {
  role: 'user' | 'assistant';
  content: string;
}