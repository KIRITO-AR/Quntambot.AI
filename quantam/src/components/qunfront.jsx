import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, X, FileText, FileSpreadsheet, File, Image } from 'lucide-react';
import { marked } from 'marked';
import './qun.css';
import './chatbot-files.css';

// Configure marked
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // File type validation
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

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileText className="text-red-500" size={16} />;
    if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('spreadsheet')) 
      return <FileSpreadsheet className="text-green-500" size={16} />;
    if (fileType.includes('word') || fileType.includes('document')) 
      return <FileText className="text-blue-500" size={16} />;
    if (fileType.includes('image')) return <Image className="text-purple-500" size={16} />;
    return <File className="text-gray-500" size={16} />;
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    const newFiles = Array.from(files).filter(file => {
      if (!isValidFileType(file)) {
        alert(`File type not supported: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  // Drag and drop handlers
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
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // Remove attached file
  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Function to render Markdown to HTML
  const renderMarkdown = (markdownText) => {
    const htmlContent = marked.parse(markdownText);
    return { __html: htmlContent };
  };

  const sendMessage = async () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;

    // Create user message with files if any
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

    // Fallback response function
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
      // Add delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prepare request data with files
      const requestData = {
        question: currentInputText,
        message: currentInputText,
        input: currentInputText,
        query: currentInputText
      };

      // Add file data if files are attached
      if (currentFiles.length > 0) {
        requestData.files = [];
        for (const file of currentFiles) {
          try {
            const base64Data = await fileToBase64(file);
            requestData.files.push({
              name: file.name,
              type: file.type,
              size: file.size,
              data: base64Data
            });
          } catch (error) {
            console.error('Error converting file to base64:', error);
          }
        }
        requestData.hasFiles = true;
        requestData.fileCount = currentFiles.length;
      }

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
        mode: 'cors'
      };

      console.log('Sending request to n8n webhook with files:', requestData.files?.length || 0);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased timeout for file processing

      const response = await fetch('https://arkapravad.app.n8n.cloud/webhook/04132c32-e2ae-48dd-b0a8-a852611c8211', {
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
      
      // Enhanced response parsing for n8n output structure
      let botResponseText = simulateAIResponse();
      
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          const firstItem = data[0];
          botResponseText = firstItem?.output || 
                           firstItem?.message || 
                           firstItem?.text || 
                           firstItem?.response || 
                           simulateAIResponse();
        } else if (typeof data === 'object') {
          botResponseText = data?.output || 
                           data?.message || 
                           data?.text || 
                           data?.response || 
                           data?.result || 
                           data?.answer ||
                           simulateAIResponse();
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
      console.error("Detailed error:", error);
      
      let errorText = "I apologize, but I'm experiencing some technical difficulties at the moment. Please try again later.";
      let isServerError = false;
      
      if (error.name === 'AbortError') {
        errorText = "⏱️ The request took longer than expected. This sometimes happens when processing files. Please try again with smaller files or check your connection.";
      } else if (error.message.includes('500')) {
        isServerError = true;
        errorText = "🔧 I'm experiencing some technical difficulties right now. If you uploaded files, please try again with smaller files or a different format.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: isServerError
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
    <div 
      className={`chat-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-message">
            <FileText size={48} />
            <h3>Drop your files here</h3>
            <p>PDF, CSV, Excel, Word, Images supported</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="bot-avatar">
            <Bot size={24} />
          </div>
          <div className="header-info">
            <h1 className="header-title">QUNTUMBOT AI</h1>
            <p className="header-status">Online • Ready to help • File Upload Enabled</p>
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
                  <div className="message-text" dangerouslySetInnerHTML={renderMarkdown(message.text)} />
                  
                  {/* Display attached files */}
                  {message.files && message.files.length > 0 && (
                    <div className="attached-files-display">
                      <p><strong>Attached files:</strong></p>
                      {message.files.map((file, index) => (
                        <div key={index} className="file-display-item">
                          {getFileIcon(file.type)}
                          <span>{file.name}</span>
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
        {/* File Attachments Preview */}
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
                  <button 
                    onClick={() => removeFile(index)}
                    className="remove-file-btn"
                    type="button"
                  >
                    <X size={16} />
                  </button>
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
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="attach-button"
            type="button"
            title="Attach files"
          >
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
          
          <button
            onClick={sendMessage}
            disabled={(!inputText.trim() && attachedFiles.length === 0) || isTyping}
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