import React, { useState, useRef, useEffect } from 'react'
import { askStoreAssistant } from '../services/GoogleAiBackend'
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react'
import '../css/ChatWidget.css'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: 'Hi! 👋 I’m the StudentMart assistant. Ask me about products, orders, or how to shop on campus.',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const messageIdRef = useRef(2)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    const userMessage = {
      id: messageIdRef.current++,
      type: 'user',
      text: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setError(null)
    setIsLoading(true)

    try {
      const assistantText = await askStoreAssistant(trimmed)
      const assistantMessage = {
        id: messageIdRef.current++,
        type: 'assistant',
        text: assistantText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Unable to connect to the assistant.')
      const errorMessage = {
        id: messageIdRef.current++,
        type: 'assistant',
        text: 'Sorry, I’m having trouble answering right now. Please try again in a moment.',
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        className={`chat-toggle-btn ${isOpen ? 'is-open' : ''}`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={22} strokeWidth={2} /> : <MessageSquare size={22} strokeWidth={2} />}
      </button>

      {isOpen && (
        <div className="chat-widget">
          <header className="chat-header">
            <div className="chat-header-id">
              <div className="chat-avatar">
                <Bot size={20} strokeWidth={2} />
              </div>
              <div>
                <h3>StudentMart Assistant</h3>
                <p>
                  <Sparkles size={12} strokeWidth={2.2} />
                  Online · powered by AI
                </p>
              </div>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </header>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message chat-message-${msg.type} ${msg.isError ? 'chat-message-error' : ''}`}
              >
                {msg.type === 'assistant' && (
                  <div className="chat-msg-avatar" aria-hidden="true">
                    <Bot size={16} strokeWidth={2} />
                  </div>
                )}
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                  <span className="chat-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message chat-message-assistant">
                <div className="chat-msg-avatar" aria-hidden="true">
                  <Bot size={16} strokeWidth={2} />
                </div>
                <div className="chat-bubble chat-loading-bubble">
                  <div className="loading-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-form" onSubmit={handleSendMessage}>
            <input
              className="chat-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about products or orders…"
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
