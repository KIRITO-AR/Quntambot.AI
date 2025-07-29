import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Upload } from 'lucide-react';
import './qun.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm your QUNTUMBOT AI. How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [currentFiles, setCurrentFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && currentFiles.length === 0) return;

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const webhookURL =
      currentFiles.length > 0
        ? 'https://arkapravad.app.n8n.cloud/form/82848bc4-5ea2-4e5a-8bb6-3c09b94a8c5d'
        : 'https://arkapravad.app.n8n.cloud/webhook/04132c32-e2ae-48dd-b0a8-a852611c8211';

    try {
      let response;
      if (currentFiles.length > 0) {
        const formData = new FormData();
        formData.append('prompt', input);
        currentFiles.forEach((file) => formData.append('file', file));

        response = await fetch(webhookURL, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(webhookURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input }),
        });
      }

      const data = await response.json();
      const botMessage = {
        sender: 'bot',
        text: data.reply || 'Sorry, I could not process that.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setCurrentFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Something went wrong. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setCurrentFiles((prev) => [...prev, ...files]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Bot className="icon" />
        <div>
          <h2>QUNTUMBOT AI</h2>
          <p>Online • Ready to help</p>
        </div>
      </div>

      <div className="chat-body" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">{msg.text}</div>
            <div className="message-time">{msg.timestamp}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="drop-zone" onClick={() => fileInputRef.current.click()}>
        <Upload size={16} style={{ marginRight: 6 }} />
        <span>Click or drag files here to upload</span>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => setCurrentFiles(Array.from(e.target.files))}
        />
      </div>

      {currentFiles.length > 0 && (
        <div className="file-preview">
          {currentFiles.map((file, idx) => (
            <div key={idx} className="file-item">
              📄 {file.name}
            </div>
          ))}
        </div>
      )}

      <div className="chat-footer">
        <textarea
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage}>
          <Send className="send-icon" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
