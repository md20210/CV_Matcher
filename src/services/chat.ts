/**
 * Chat Service - API wrapper for RAG Chat
 */
import { api } from './api';

export interface DocumentSource {
  document_id: string;
  filename?: string;
  type: string;
  relevance_score: number;
}

export interface InMemoryDocument {
  filename: string;
  content: string;
  type: string;
}

export interface ChatMessageRequest {
  message: string;
  project_id?: string;
  system_context?: string;
  documents?: InMemoryDocument[];  // NEW: For in-memory RAG
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  context_limit?: number;
}

export interface ChatMessageResponse {
  message: string;
  sources: DocumentSource[];
  model: string;
  provider: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  timestamp: Date;
}

class ChatService {
  /**
   * Send a chat message with RAG (Retrieval-Augmented Generation)
   */
  async sendMessage(
    message: string,
    llmType: 'local' | 'grok',
    systemContext?: string,
    projectId?: string,
    documents?: InMemoryDocument[]  // NEW: Optional in-memory documents
  ): Promise<ChatMessageResponse> {
    const request: ChatMessageRequest = {
      message,
      provider: llmType === 'grok' ? 'grok' : 'ollama',
      model: llmType === 'grok' ? 'grok-3' : 'qwen2.5:3b',
      temperature: 0.7,
      max_tokens: 500,
      context_limit: 3,
      ...(systemContext && { system_context: systemContext }),
      ...(projectId && { project_id: projectId }),
      ...(documents && { documents }),  // NEW: Pass documents if provided
    };

    try {
      const response = await api.post<ChatMessageResponse>('/chat/message', request);
      return response.data;
    } catch (error: any) {
      console.error('❌ Chat request failed:', error);
      throw new Error(
        error.response?.data?.detail || error.message || 'Chat request failed'
      );
    }
  }
}

export const chatService = new ChatService();
