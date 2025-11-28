"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CitationCard } from "@/components/CitationCard";
import { Message, Citation } from "@/lib/types";
import { SearchAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  conversationId?: string;
  onQuery?: (query: string) => Promise<void>;
}

export function ChatInterface({ conversationId, onQuery }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Call the real search API with RAG enabled
      const response = await SearchAPI.search({
        query,
        use_rag: true,
        top_k: 5,
      });

      console.log('Search API response:', response);

      // Convert search results to citations
      // Handle both possible response formats from backend
      const citations: Citation[] = (response.results || [])
        .filter(result => {
          if (!result) return false;
          // Backend might return document or doc_metadata
          return result.document || result.doc_metadata;
        })
        .map((result, index) => {
          // Handle different backend response formats
          const doc = result.document || result.doc_metadata || {};
          const docId = doc.id || index;

          return {
            documentId: docId,
            documentName: doc.title || doc.filename || 'Untitled Document',
            pageNumber: doc.num_pages ? undefined : undefined,
            chunkId: `chunk_${docId}_${index}`,
            content: result.chunk_content || result.content || (doc.content ? doc.content.substring(0, 200) + '...' : 'No content available'),
            relevanceScore: result.similarity_score || 0,
          };
        });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.rag_response || 'Based on the search results, here are the most relevant documents from your knowledge base.',
        citations,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (onQuery) {
        await onQuery(query);
      }
    } catch (err: any) {
      console.error('Query failed:', err);
      setError(err.message || 'Failed to get response. Please try again.');

      // Remove the user message if the query failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
            <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Ask me anything</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              I can help you find information from your uploaded documents.
              Try asking about policies, procedures, or any other content in your knowledge base.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div className={cn(
                "flex flex-col gap-2 max-w-[80%]",
                message.role === 'user' && "items-end"
              )}>
                <Card className={cn(
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}>
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>

                {message.citations && message.citations.length > 0 && (
                  <div className="w-full space-y-2">
                    <p className="text-xs font-medium text-muted-foreground px-1">
                      Sources ({message.citations.length})
                    </p>
                    <div className="space-y-2">
                      {message.citations.map((citation, idx) => (
                        <CitationCard key={idx} citation={citation} index={idx} />
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Searching knowledge base...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
