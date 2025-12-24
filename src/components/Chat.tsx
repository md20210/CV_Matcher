/**
 * Chat Component - Interactive Q&A with RAG
 */
import React, { useState, useRef, useEffect } from 'react';
import { chatService, ChatMessage, InMemoryDocument } from '../services/chat';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatProps {
  llmType: 'local' | 'grok';
  systemContext?: string;
  projectId?: string;
  documents?: InMemoryDocument[];  // NEW: Optional in-memory documents for RAG
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export const Chat: React.FC<ChatProps> = ({ llmType, systemContext, projectId, documents, onMessagesChange }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent of message changes
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('cv_matcher_');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(
        userMessage.content,
        llmType,
        systemContext,
        projectId,
        documents  // NEW: Pass documents for in-memory RAG
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: t('error_chat_failed', { error: error.message }),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{t('cv_matcher_chat_title')}</h3>
        <button onClick={handleClear} className="btn-clear" disabled={messages.length === 0}>
          {t('cv_matcher_chat_clear_button')}
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>{t('cv_matcher_chat_empty_message')}</p>
            <p className="chat-examples">
              {t('cv_matcher_chat_examples')}
              <br />• "{t('chat_example_1')}"
              <br />• "{t('chat_example_2')}"
              <br />• "{t('chat_example_3')}"
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="message-header">
              <span className="message-role">
                {msg.role === 'user' ? `👤 ${t('cv_matcher_chat_user_label')}` : `🤖 ${t('cv_matcher_chat_assistant_label')}`}
              </span>
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="message-sources">
                <span className="sources-label">📚 {t('cv_matcher_chat_sources_label')}</span>
                {msg.sources.map((source, sidx) => (
                  <span key={sidx} className="source-tag">
                    {source.filename || source.type} ({Math.round(source.relevance_score * 100)}%)
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant loading">
            <div className="message-header">
              <span className="message-role">{`🤖 ${t('cv_matcher_chat_assistant_label')}`}</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('cv_matcher_chat_input_placeholder')}
          className="chat-input"
          disabled={loading}
        />
        <button type="submit" className="btn-send" disabled={!input.trim() || loading}>
          {loading ? '⏳' : '📤'} {t('cv_matcher_chat_send_button')}
        </button>
      </form>
    </div>
  );
};
