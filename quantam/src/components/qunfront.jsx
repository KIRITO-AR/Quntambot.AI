import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import './qun.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  // Fixed: Added proper variable names
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInputText = inputText;
    setInputText('');
    setIsTyping(true);

    // Simulate AI response as fallback
    const simulateAIResponse = () => {
      const responses = [
        "Thank you for your message! I'm currently experiencing some technical difficulties, but I understand you're asking about: " + currentInputText,
        "I appreciate your question about " + currentInputText + ". While I'm working on resolving some connectivity issues, I'd be happy to help once they're fixed.",
        "Your message regarding '" + currentInputText + "' has been received. I'm having some server issues right now, but I'll get back to you shortly!",
        "I see you're interested in " + currentInputText + ". Unfortunately, I'm experiencing some technical problems at the moment, but I'm working on it!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    };

    try {
      // Add delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          question: currentInputText,
          message: currentInputText,
          input: currentInputText,
          query: currentInputText
        }),
        mode: 'cors'
      };

      console.log('Sending request to n8n webhook...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://arkapravad.app.n8n.cloud/webhook/f1bf8a65-bb6f-4508-83cd-eec595dc08d5', {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (response.status === 500) {
        throw new Error('Server is currently experiencing issues (500 error)');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        data = { text: textResponse };
      }

      console.log('API Response received:', data);
      
      // Parse response with multiple fallback options
      let botResponseText = simulateAIResponse(); // Default fallback
      
      if (data) {
        botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                         data?.candidates?.content?.parts?.text ||
                         data?.response?.text ||
                         data?.response ||
                         data?.message ||
                         data?.text ||
                         data?.output ||
                         data?.result ||
                         data?.answer ||
                         (typeof data === 'string' ? data : simulateAIResponse());
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Detailed error:", error);
      
      let errorText = simulateAIResponse(); // Use AI-like response as fallback
      let isServerError = false;
      
      if (error.name === 'AbortError') {
        errorText = "The request timed out. Let me try to help you with what I know about: " + currentInputText;
      } else if (error.message.includes('500')) {
        isServerError = true;
        errorText = "🔧 I'm experiencing some technical difficulties right now, but I'd still like to help! " +
                   "Your question about '" + currentInputText + "' is interesting. " +
                   "While I work on fixing my connection, is there anything specific you'd like to know?";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorText = "🌐 There seems to be a network issue. However, I can still try to assist you with: " + currentInputText + 
                   ". What would you like to know more about?";
      } else if (error.message.includes('CORS')) {
        errorText = "There's a configuration issue, but I'm here to help! Regarding '" + currentInputText + 
                   "', what specific information are you looking for?";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: isServerError
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // If it's a server error, add a helpful follow-up message
      if (isServerError) {
        setTimeout(() => {
          const followUpMessage = {
            id: Date.now() + 2,
            text: "💡 While I'm getting my systems back online, feel free to ask me anything else! " +
                  "I can help with general questions, provide information, or just have a conversation.",
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 2000);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="bot-avatar">
            <Bot size={24} />
          </div>
          <div className="header-info">
            <h1 className="header-title">AI Assistant</h1>
            <p className="header-status">Online • Ready to help</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        <div className="messages-wrapper">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
              <div className="message-avatar">
                {message.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <p className="message-text">{message.text}</p>
                </div>
                <span className="message-timestamp">{message.timestamp}</span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message bot">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="message-input"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isTyping}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;