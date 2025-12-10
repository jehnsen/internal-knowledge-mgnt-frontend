"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot, AlertCircle, History, Trash2, MessageSquare, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChatAPI, ChatMessage, ChatSession, SourceDocument, DocumentAPI, Document as APIDocument } from "@/lib/api";
import { AuditLog } from "@/lib/audit";
import { DocumentModal } from "@/components/DocumentModal";
import { KnowledgeGapAlert } from "@/components/KnowledgeGapAlert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConversationalChatProps {
  className?: string;
}

export function ConversationalChat({ className }: ConversationalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<{ doc: any; source?: SourceDocument } | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to detect knowledge gaps in assistant responses
  const isKnowledgeGapMessage = (message: ChatMessage): boolean => {
    if (message.role !== 'assistant') return false;

    const knowledgeGapPhrases = [
      "don't have enough information",
      "cannot find",
      "no information",
      "insufficient information",
      "not found in",
      "unable to find",
      "unable to provide",
      "no relevant information",
      "knowledge base does not contain",
      "no documents about",
      "don't have any information about",
      "couldn't find anything about",
      "no direct mention",
      "does not specify",
      "context does not specify",
      "i am unable to",
      "cannot provide",
      "no specific",
      "not mentioned",
      "no details about",
      "not available in",
    ];

    const content = message.content.toLowerCase();
    const hasGapPhrase = knowledgeGapPhrases.some(phrase => content.includes(phrase));
    const hasNoSources = !message.sources || message.sources.length === 0;

    // Knowledge gap if it has gap phrases OR has no sources and is a short response
    return hasGapPhrase || (hasNoSources && message.content.length < 200);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const data = await ChatAPI.getSessions(20, 0);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setSessionsError(err.message || 'Failed to load conversation history. Backend may not be running.');
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSession = async (session: ChatSession) => {
    try {
      setIsLoading(true);
      const sessionMessages = await ChatAPI.getSessionMessages(session.session_id);
      setMessages(sessionMessages);
      setSessionId(session.session_id);
      setShowHistory(false);
      toast.success(`Loaded conversation from ${new Date(session.created_at).toLocaleDateString()}`);
    } catch (err: any) {
      toast.error('Failed to load conversation');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ChatAPI.deleteSession(sessionIdToDelete);
      setSessions(prev => prev.filter(s => s.session_id !== sessionIdToDelete));
      if (sessionId === sessionIdToDelete) {
        // Clear current conversation if it was deleted
        setMessages([]);
        setSessionId(null);
      }
      toast.success('Conversation deleted');

      // Log audit event
      await AuditLog.chatSessionDelete(sessionIdToDelete);
    } catch (err: any) {
      toast.error('Failed to delete conversation');
      console.error(err);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
    toast.info('Started new conversation');
  };

  const toggleSourcesExpanded = (messageIdx: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageIdx)) {
        newSet.delete(messageIdx);
      } else {
        newSet.add(messageIdx);
      }
      return newSet;
    });
  };

  const handleSourceClick = async (source: SourceDocument) => {
    try {
      // Fetch full document content from API
      const fullDocument = await DocumentAPI.getDocument(source.document_id);
      setSelectedDocument({ doc: fullDocument, source });
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document details');

      // Fallback: Show what we have from the source
      const doc = {
        id: source.document_id,
        title: source.title,
        file_type: source.file_type,
        file_path: source.filename,
        category: source.category,
      };
      setSelectedDocument({ doc, source });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await ChatAPI.sendMessage({
        message: query,
        session_id: sessionId || undefined,
        use_knowledge_base: true,
        max_history: 10,
        search_limit: 1,  // Only request top source for chat UI
      });

      // Update session ID if this is a new conversation
      const isNewSession = !sessionId;
      if (isNewSession) {
        setSessionId(response.session_id);
        // Log audit event for new chat session
        await AuditLog.chatSessionStart(response.session_id);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log audit event for chat message
      await AuditLog.chatMessage(response.session_id, query.length);

      // Reload sessions to show the new one
      loadSessions();
    } catch (err: any) {
      console.error('Chat failed:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      toast.error('Failed to send message');

      // Remove the user message if the query failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex h-full gap-4", className)}>
      {/* Sidebar - Chat History */}
      <div className={cn(
        "w-64 border-r bg-muted/30 flex flex-col transition-all",
        !showHistory && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Conversations
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewConversation}
              className="h-8 px-2"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            <div className="text-center py-8 px-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-muted-foreground">
                Loading conversations...
              </p>
            </div>
          ) : sessionsError ? (
            <div className="px-4 py-6">
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {sessionsError}
                </AlertDescription>
              </Alert>
              <Button
                onClick={loadSessions}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Retry
              </Button>
            </div>
          ) : !Array.isArray(sessions) || sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No previous conversations
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => loadSession(session)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors group",
                    sessionId === session.session_id && "bg-accent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {session.title || `Conversation ${session.session_id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {session.message_count} messages
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteSession(session.session_id, e)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ask me anything about your documents. I'll remember our conversation context,
                so feel free to ask follow-up questions!
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs">
                  Context-aware responses
                </Badge>
                <Badge variant="outline" className="text-xs">
                  RAG-powered answers
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Source citations
                </Badge>
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}

                <div className={cn(
                  "flex flex-col gap-2",
                  message.role === 'assistant' && isKnowledgeGapMessage(message) ? "w-full" : "max-w-[80%]",
                  message.role === 'user' && "items-end"
                )}>
                  {/* Show KnowledgeGapAlert for assistant messages with knowledge gaps */}
                  {message.role === 'assistant' && isKnowledgeGapMessage(message) ? (
                    <KnowledgeGapAlert
                      query={idx > 0 ? messages[idx - 1].content : "your question"}
                      message={message.content}
                      onRefineQuery={() => {
                        // Focus on input field
                        document.querySelector<HTMLInputElement>('input[placeholder*="question"]')?.focus();
                      }}
                    />
                  ) : (
                    <Card className={cn(
                      "shadow-sm",
                      message.role === 'user'
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none"
                        : "bg-card"
                    )}>
                      <CardContent className="p-4">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Only show sources if NOT a knowledge gap message */}
                  {message.sources && message.sources.length > 0 && !isKnowledgeGapMessage(message) && (
                    <div className="w-full space-y-2 px-1">
                      {/* Top source (highest relevance) as clickable link */}
                      <div className="text-xs text-muted-foreground">
                        <span>Based on </span>
                        <button
                          onClick={() => handleSourceClick(message.sources![0])}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <FileText className="h-3 w-3" />
                          {message.sources[0].title}
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {Math.round(message.sources[0].relevance_score * 100)}% match
                          </Badge>
                        </button>
                        {message.sources.length > 1 && (
                          <>
                            <span> and </span>
                            <button
                              onClick={() => toggleSourcesExpanded(idx)}
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {message.sources.length - 1} more source{message.sources.length > 2 ? 's' : ''}
                              {expandedSources.has(idx) ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Expandable additional sources */}
                      {expandedSources.has(idx) && message.sources.length > 1 && (
                        <div className="space-y-1 animate-fade-in">
                          {message.sources.slice(1).map((source, sourceIdx) => (
                            <button
                              key={sourceIdx}
                              onClick={() => handleSourceClick(source)}
                              className="w-full text-left p-2 rounded-lg bg-muted/50 border hover:bg-muted transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground/90 truncate">
                                    {source.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {source.filename}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {Math.round(source.relevance_score * 100)}%
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground px-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <Card className="bg-card shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="text-sm text-muted-foreground">
                      Thinking and searching knowledge base...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/95 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sessionId ? "Ask a follow-up question..." : "Start a conversation..."}
              disabled={isLoading}
              className="flex-1 bg-background"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          {sessionId && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Continuing conversation • Context preserved
            </p>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentModal
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          document={selectedDocument.doc}
          similarityScore={selectedDocument.source?.relevance_score}
        />
      )}
    </div>
  );
}
