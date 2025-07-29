// ChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, X, FileText, FileSpreadsheet, File, Image } from 'lucide-react';
import { marked } from 'marked';
import './qun.css';
import './chatbot-files.css';

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  breaks: true,
});

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
      text: "Hello! I'm your QUNTUMBOT AI. How can I help you today? You can also **drag and drop files** (PDF, CSV, Excel, Word, Images) or click the attachment button to upload documents for analysis!",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isValidFileType = (file) => {
    const validTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];
    return validTypes.includes(file.type);
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileText className="text-red-500" size={16} />;
    if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="text-green-500" size={16} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="text-blue-500" size={16} />;
    if (fileType.includes('image')) return <Image className="text-purple-500" size={16} />;
    return <File className="text-gray-500" size={16} />;
  };

  const handleFileSelect = (files) => {
    const newFiles = Array.from(files).filter(file => {
      if (!isValidFileType(file)) {
        alert(`File type not supported: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const renderMarkdown = (markdownText) => {
    const htmlContent = marked.parse(markdownText);
    return { __html: htmlContent };
  };

  const sendMessage = async () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      id: Date.now(),
      text: inputText || "📎 Sent files for analysis",
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      files: attachedFiles.length > 0 ? [...attachedFiles] : null
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInputText = inputText;
    const currentFiles = [...attachedFiles];
    setInputText('');
    setAttachedFiles([]);
    setIsTyping(true);

    const simulateAIResponse = () => {
      const responses = [
        "Thank you for your message! I'm currently experiencing some technical difficulties, but I understand you're asking about: **" + currentInputText + "**",
        "I appreciate your question about *" + currentInputText + "*. While I'm working on resolving some connectivity issues, I'd be happy to help once they're fixed.",
        "Your message regarding '" + currentInputText + "' has been received. I'm having some server issues right now, but I'll get back to you shortly!",
        "I see you're interested in " + currentInputText + ". Unfortunately, I'm experiencing some technical problems at the moment, but I'm working on it!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const requestData = {
        question: currentInputText,
        input: currentInputText,
        query: currentInputText
      };

      if (currentFiles.length > 0) {
        requestData.files = [];
        for (const file of currentFiles) {
          const base64Data = await fileToBase64(file);
          requestData.files.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data
          });
        }
        requestData.hasFiles = true;
        requestData.fileCount = currentFiles.length;
      }

      const webhookURL = 'https://arkapravad.app.n8n.cloud/form/82848bc4-5ea2-4e5a-8bb6-3c09b94a8c5d';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(webhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const contentType = response.headers.get('content-type');
      let data = contentType.includes('application/json') ? await response.json() : { text: await response.text() };

      let botResponseText = simulateAIResponse();
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          botResponseText = data[0]?.output || data[0]?.message || data[0]?.text || simulateAIResponse();
        } else if (typeof data === 'object') {
          botResponseText = data.output || data.message || data.text || simulateAIResponse();
        } else if (typeof data === 'string') {
          botResponseText = data;
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorText = error.name === 'AbortError'
        ? "⏱️ The request timed out. Try again with smaller files or check your connection."
        : "🔧 I'm experiencing technical difficulties. Please try again later.";

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`chat-container ${isDragOver ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-message">
            <FileText size={48} />
            <h3>Drop your files here</h3>
            <p>PDF, CSV, Excel, Word, Images supported</p>
          </div>
        </div>
      )}

      <div className="chat-header">
        <div className="header-content">
          <div className="bot-avatar"><Bot size={24} /></div>
          <div className="header-info">
            <h1 className="header-title">QUNTUMBOT AI</h1>
            <p className="header-status">Online • Ready to help • File Upload Enabled</p>
          </div>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-wrapper">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
              <div className="message-avatar">{message.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}</div>
              <div className="message-content">
                <div className="message-bubble">
                  <div className="message-text" dangerouslySetInnerHTML={renderMarkdown(message.text)} />
                  {message.files?.length > 0 && (
                    <div className="attached-files-display">
                      <p><strong>Attached files:</strong></p>
                      {message.files.map((file, index) => (
                        <div key={index} className="file-display-item">
                          {getFileIcon(file.type)} <span>{file.name}</span>
                          <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="message-timestamp">{message.timestamp}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message bot">
              <div className="message-avatar"><Bot size={20} /></div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-container">
        {attachedFiles.length > 0 && (
          <div className="attached-files">
            <h4>Attached Files ({attachedFiles.length})</h4>
            <div className="file-list">
              {attachedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  {getFileIcon(file.type)}
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button onClick={() => removeFile(index)} className="remove-file-btn" type="button"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="input-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files)}
            multiple
            accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current?.click()} className="attach-button" type="button" title="Attach files">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or drag & drop files..."
            className="message-input"
            disabled={isTyping}
          />
          <button onClick={sendMessage} disabled={(!inputText.trim() && attachedFiles.length === 0) || isTyping} className="send-button">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
