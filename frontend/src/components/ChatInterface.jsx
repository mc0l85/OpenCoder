import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatInterface = ({ currentRepo, currentFile, fileContent, selectedText }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const history = data.history || [];
        setMessages(history);
        setChatHistory(history);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Prepare context information
      const context = {
        message: userMessage,
        current_file: currentFile?.path,
        file_content: fileContent,
        selected_text: selectedText,
        file_tree: currentRepo ? await getFileTree() : null
      };

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(context)
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const error = await response.json();
        const errorMessage = { 
          role: 'assistant', 
          content: `Error: ${error.error || 'Failed to get response'}` 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: `Error: ${error.message}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const getFileTree = async () => {
    try {
      const response = await fetch('/api/files/tree', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.file_tree?.map(file => file.path) || [];
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
    }
    return null;
  };

  const clearChat = async () => {
    try {
      const response = await fetch('/api/chat/clear', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setMessages([]);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting for code blocks
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3).trim();
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto text-sm my-2">
            <code>{code}</code>
          </pre>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        // Inline code
        const code = part.slice(1, -1);
        return (
          <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">
            {code}
          </code>
        );
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  const getContextInfo = () => {
    const info = [];
    if (currentRepo) {
      info.push(`Repository: ${currentRepo.owner}/${currentRepo.repo}`);
    }
    if (currentFile) {
      info.push(`File: ${currentFile.name}`);
    }
    if (selectedText) {
      info.push(`Selected: ${selectedText.length} characters`);
    }
    return info;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Bot className="w-4 h-4 mr-2 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              AI Assistant
            </h3>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadChatHistory}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Context Info */}
        <div className="text-xs text-gray-500 space-y-1">
          {getContextInfo().map((info, index) => (
            <div key={index}>{info}</div>
          ))}
          {getContextInfo().length === 0 && (
            <div>No context available</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Start a conversation with the AI assistant</p>
              <p className="text-xs mt-1">Ask questions about your code, get suggestions, or request help</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm leading-relaxed">
                      {formatMessage(message.content)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Textarea
            ref={inputRef}
            placeholder="Ask about your code, request help, or get suggestions..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

