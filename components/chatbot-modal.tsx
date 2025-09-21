"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, X, Loader2 } from "lucide-react"
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

interface ChatbotModalProps {
  isOpen: boolean
  onClose: () => void
  type: "sales" | "research"
  title: string
  description: string
}

// Memoized message component to prevent unnecessary re-renders
const MessageBubble = memo(({ message, type }: { message: Message; type: "sales" | "research" }) => {
  // Memoize ReactMarkdown components to prevent recreation
  const markdownComponents = useMemo(() => ({
    h1: ({ children, ...props }: any) => <h1 {...props} className="text-lg font-bold mb-4 mt-6 first:mt-0 text-slate-900 dark:text-slate-100">{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props} className="text-base font-semibold mb-3 mt-5 first:mt-0 text-slate-900 dark:text-slate-100">{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props} className="text-sm font-medium mb-2 mt-4 first:mt-0 text-slate-900 dark:text-slate-100">{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 {...props} className="text-sm font-medium mb-2 mt-3 first:mt-0 text-slate-800 dark:text-slate-200">{children}</h4>,
    h5: ({ children, ...props }: any) => <h5 {...props} className="text-xs font-medium mb-2 mt-3 first:mt-0 text-slate-800 dark:text-slate-200">{children}</h5>,
    h6: ({ children, ...props }: any) => <h6 {...props} className="text-xs font-medium mb-2 mt-3 first:mt-0 text-slate-800 dark:text-slate-200">{children}</h6>,
    p: ({ children, ...props }: any) => <p {...props} className="mb-3 text-slate-700 dark:text-slate-300 leading-relaxed">{children}</p>,
    ul: ({ children, ...props }: any) => <ul {...props} className="list-disc list-inside mb-4 space-y-1.5 pl-2">{children}</ul>,
    ol: ({ children, ...props }: any) => <ol {...props} className="list-decimal list-inside mb-4 space-y-1.5 pl-2">{children}</ol>,
    li: ({ children, ...props }: any) => <li {...props} className="text-slate-700 dark:text-slate-300 leading-relaxed [&>p]:inline [&>p]:mb-0 [&>p:not(:last-child)]:mr-1">{children}</li>,
    strong: ({ children, ...props }: any) => <strong {...props} className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>,
    em: ({ children, ...props }: any) => <em {...props} className="italic text-slate-700 dark:text-slate-300">{children}</em>,
    code: ({ children, ...props }: any) => <code {...props} className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200">{children}</code>,
    pre: ({ children, ...props }: any) => <pre {...props} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto mb-4 border border-slate-200 dark:border-slate-700">{children}</pre>,
    blockquote: ({ children, ...props }: any) => <blockquote {...props} className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-2 italic text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 rounded-r-md">{children}</blockquote>,
    hr: (props: any) => <hr {...props} className="border-slate-300 dark:border-slate-600 my-6 border-t-2" />,
    table: ({ children, ...props }: any) => <div className="mb-4 overflow-x-auto"><table {...props} className="w-full border-collapse border border-slate-300 dark:border-slate-600 text-xs rounded-md overflow-hidden">{children}</table></div>,
    thead: ({ children, ...props }: any) => <thead {...props} className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
    tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }: any) => <tr {...props} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">{children}</tr>,
    th: ({ children, ...props }: any) => <th {...props} className="border border-slate-300 dark:border-slate-600 px-3 py-2 font-medium text-left text-slate-900 dark:text-slate-100">{children}</th>,
    td: ({ children, ...props }: any) => <td {...props} className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-slate-700 dark:text-slate-300">{children}</td>,
    div: ({ children, className, ...props }: any) => <div {...props} className={`${className || ''} mb-2`}>{children}</div>,
  }), []);

  return (
    <div
      className={`flex items-start space-x-2 ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
    >
      <div
        className={`p-1.5 rounded-full flex-shrink-0 ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-slate-200 dark:bg-slate-700"}`}
      >
        {message.sender === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      </div>
      <div
        className={`max-w-[85%] p-3 rounded-lg ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"}`}
      >
        {message.sender === "user" ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <span className="text-xs opacity-70 mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const ChatbotModalComponent = memo(function ChatbotModal({ isOpen, onClose, type, title, description }: ChatbotModalProps) {
  const [input, setInput] = useState("");
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chat functionality with proper transport configuration
  const { messages: aiMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: type === "sales" ? "/api/chat/sales" : "/api/chat/research",
    }),
  });

  // Memoized welcome message to prevent recreation
  const welcomeMessage = useMemo(() => ({
    id: "welcome",
    content: type === "sales"
      ? "Hello! I'm your Sales & Marketing AI assistant. I can help you identify leads, analyze usage data, and find upselling opportunities. What would you like to explore today?"
      : "Hi! I'm your Research Assistant AI. I can help you discover relevant publications, match research topics with journals, and provide personalized recommendations. How can I assist your research today?",
    sender: "bot" as const,
    timestamp: new Date(),
  }), [type]);

  // Optimize message formatting with better memoization
  const formattedMessages = useMemo(() => {
    const processedAiMessages = aiMessages.map((msg) => {
      let content = '';
      
      // Extract text content from text parts (text, text-delta)
      const textParts = msg.parts.filter((part: any) => 
        part.type === 'text' || part.type === 'text-delta'
      );
      if (textParts.length > 0) {
        content = textParts.map((part: any) => part.text).join('').trim();
      }
      
      return {
        id: msg.id,
        content,
        sender: msg.role === "user" ? "user" as const : "bot" as const,
        timestamp: new Date(),
      };
    }).filter(msg => msg.content.length > 0);

    return [welcomeMessage, ...processedAiMessages];
  }, [aiMessages, welcomeMessage]);

  // More reliable loading state detection
  const isWaitingForContent = useMemo(() => {
    // If we just submitted, show loading
    if (status === 'submitted') return true;
    
    // If not streaming, don't show loading
    if (status !== 'streaming') return false;
    
    // Check if we have any AI messages with actual content
    const aiMessagesWithContent = aiMessages.filter(msg => {
      const textParts = msg.parts.filter((part: any) => 
        part.type === 'text' || part.type === 'text-delta'
      );
      return textParts.length > 0 && textParts.some((part: any) => part.text.trim().length > 0);
    });
    
    // If no AI content yet, show loading
    if (aiMessagesWithContent.length === 0) return true;
    
    // If the last message is from user, show loading (waiting for AI response)
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    return lastMessage?.sender === 'user';
  }, [status, aiMessages, formattedMessages]);

  // Enhanced auto-scroll for streaming responses
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (!isUserScrolling || force)) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isUserScrolling]);

  // Handle scroll detection to prevent auto-scroll when user is reading
  const handleScroll = useCallback(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setIsUserScrolling(!isNearBottom);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset user scrolling flag after a delay
      scrollTimeoutRef.current = setTimeout(() => {
        if (isNearBottom) {
          setIsUserScrolling(false);
        }
      }, 1000);
    }
  }, []);

  // Auto-scroll when new messages arrive or content changes
  useEffect(() => {
    scrollToBottom();
  }, [formattedMessages, scrollToBottom]);

  // Continuous auto-scroll during streaming (more aggressive for streaming content)
  useEffect(() => {
    if (status === 'streaming') {
      // Force scroll during streaming regardless of user scroll state initially
      const streamingInterval = setInterval(() => {
        scrollToBottom();
      }, 100); // Scroll every 100ms during streaming
      
      return () => clearInterval(streamingInterval);
    }
  }, [status, scrollToBottom]);

  // Auto-scroll on aiMessage changes (captures content updates during streaming)
  useEffect(() => {
    if (aiMessages.length > 0) {
      scrollToBottom();
    }
  }, [aiMessages, scrollToBottom]);

  // Force scroll when waiting state changes
  useEffect(() => {
    if (isWaitingForContent) {
      scrollToBottom(true); // Force scroll when showing loading
    }
  }, [isWaitingForContent, scrollToBottom]);

  // Optimize debug logging with reduced dependencies
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Chat Debug:', {
        status,
        aiMessagesCount: aiMessages.length,
        formattedMessagesCount: formattedMessages.length,
        isWaitingForContent,
      });
    }
  }, [status, aiMessages.length, formattedMessages.length, isWaitingForContent]);

  // Body scroll management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Setup scroll listener for ScrollArea
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer && isOpen) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [isOpen, handleScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Memoized event handlers to prevent re-renders
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input }]
    });
    setInput("");
  }, [input, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  // Memoize quick question data to prevent recreation
  const quickQuestions = useMemo(() => {
    const salesQuestions = [
      { display: "Top 5 books in 2024", query: "What are our top 5 most popular books in 2024?" },
      { display: "Highest denial rates this year", query: "Show me the books with highest denial rates this year" },
      { display: "Best performing journals 2025", query: "Which journals are performing best this year?" },
      { display: "Recent book purchases", query: "What are our most recent book purchases?" },
      { display: "Most popular books overall", query: "Show me our most popular books overall" },
      { display: "Book usage trends 2024", query: "Analyze book usage trends for 2024" }
    ];

    const researchQuestions = [
      { display: "Find AI books", query: "Find books about artificial intelligence" },
      { display: "Search Nature journals", query: "Search for Analysis journals" },
      { display: "Machine learning articles", query: "Find articles about data analysis" },
      { display: "Data science chapters", query: "Search for operational research articles" },
      { display: "Publication statistics 2024", query: "Show me recent publications" },
      { display: "University chapter data", query: "Find editor contact information" }
    ];

    return type === "sales" ? salesQuestions : researchQuestions;
  }, [type]);

  const handleQuestionClick = useCallback((query: string) => {
    setInput(query);
  }, []);

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] pointer-events-auto" onClick={onClose} />

      <div
        className="fixed right-0 top-0 h-full w-[33vw] min-w-[400px] bg-background border-l shadow-xl z-[101] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4">
              {formattedMessages.map((message) => (
                <MessageBubble key={message.id} message={message} type={type} />
              ))}
              {isWaitingForContent && (
                <div className="flex items-start space-x-2">
                  <div className="p-1.5 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="max-w-[85%] p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {type === "sales" ? "📊 Analyzing sales data..." : "📚 Researching publications..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {/* Invisible element for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Scroll to bottom button when user has scrolled up */}
          {isUserScrolling && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <Button
                size="sm"
                onClick={() => {
                  setIsUserScrolling(false);
                  scrollToBottom(true);
                }}
                className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-3 py-1 text-xs"
              >
                ↓ New messages
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          {/* Quick Question Pills */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuestionClick(question.query)}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600 transition-colors duration-200 max-w-[140px] truncate"
                  title={question.query}
                >
                  {question.display}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 text-sm"
              disabled={isWaitingForContent}
            />
            <Button type="submit" size="icon" disabled={isWaitingForContent || !input.trim()}>
              {isWaitingForContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
});

export { ChatbotModalComponent as ChatbotModal };
