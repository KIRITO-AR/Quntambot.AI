import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { marked } from 'marked'; // Import marked library
import './qun.css';

// Configure marked to open links in a new tab and add security attributes
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true, // Use GitHub Flavored Markdown
  breaks: true, // Add <br> on a single newline
  // highlight: function(code, lang) { // Optional: for syntax highlighting
  //   const hljs = require('highlight.js');
  //   const language = hljs.getLanguage(lang) ? lang : 'plaintext';
  //   return hljs.highlight(code, { language }).value;
  // },
});

// Extend the default renderer to add target="_blank" and rel="noopener noreferrer" to links
const renderer = {
  link(href, title, text) {
    return `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
  }
};

marked.use({ renderer });


const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your QUNTUMBOT AI. How can I help you today? I can understand **bold text**, *italic text*, and even [links](https://www.example.com)! Here's a list:\n\n* Item 1\n* Item 2\n\nAnd some `inline code` or a longer code block:\n\n```javascript\nconsole.log('Hello, Markdown!');\n```",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to render Markdown to HTML
  const renderMarkdown = (markdownText) => {
    // Sanitize the HTML to prevent XSS attacks if the markdown source is untrusted.
    // For this example, we're directly using marked, but in a production app,
    // consider a DOMPurify-like library if user input is rendered as markdown.
    return { __html: marked.parse(markdownText) };
  };

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

    // Fallback response function
    const simulateAIResponse = () => {
      const responses = [
        "Thank you for your message! I'm currently experiencing some technical difficulties, but I understand you're asking about: **" + currentInputText + "**",
        "I appreciate your question about *" + currentInputText + "*. While I'm working on resolving some connectivity issues, I'd be happy to help once they're fixed. You can learn more [here](https://www.google.com).",
        "Your message regarding '" + currentInputText + "' has been received. I'm having some server issues right now, but I'll get back to you shortly!",
        "I see you're interested in " + currentInputText + ". Unfortunately, I'm experiencing some technical problems at the moment, but I'm working on it! Here's a quick tip: `console.log('debug');`"
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
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://arkapravad.app.n8n.cloud/webhook/04132c32-e2ae-48dd-b0a8-a852611c8211', {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

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
      console.log('Response type:', typeof data);
      console.log('Response structure:', JSON.stringify(data, null, 2));
      
      // Enhanced response parsing for n8n output structure
      let botResponseText = simulateAIResponse(); // Default fallback
      
      if (data) {
        // Handle different possible response structures from n8n
        if (Array.isArray(data) && data.length > 0) {
          // If response is an array (like from n8n), get the first item
          const firstItem = data[0];
          botResponseText = firstItem?.output || 
                           firstItem?.message || 
                           firstItem?.text || 
                           firstItem?.response || 
                           simulateAIResponse();
        } else if (typeof data === 'object') {
          // If response is an object, try different keys
          botResponseText = data?.output || 
                           data?.message || 
                           data?.text || 
                           data?.response || 
                           data?.result || 
                           data?.answer ||
                           data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                           data?.candidates?.content?.parts?.text ||
                           data?.response?.text ||
                           simulateAIResponse();
        } else if (typeof data === 'string') {
          // If response is a string, use it directly
          botResponseText = data;
        }
      }

      // Additional check if the response is still the fallback
      if (botResponseText === simulateAIResponse()) {
        console.warn('Using fallback response. Original data:', data);
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
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      let errorText = simulateAIResponse();
      let isServerError = false;
      
      if (error.name === 'AbortError') {
        errorText = "⏱️ The request took longer than expected. This sometimes happens with complex requests like '" + currentInputText + "'. Let me try to help with what I know!";
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
            <h1 className="header-title">QUNTUMBOT AI</h1>
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
                  {/* Render Markdown content here */}
                  <div className="message-text" dangerouslySetInnerHTML={renderMarkdown(message.text)} />
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
