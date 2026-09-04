"use client";

import React, { useEffect, useState } from "react";
import { MessagesSquare, MessageSquare, Bot, Clock, Trash2, ArrowRight, RefreshCw, Zap, Sparkles, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ConversationsHistoryPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/conversations");
      if (res.ok) {
        const json = await res.json();
        setConversations(json.data || []);
        if (json.data?.length > 0 && !selectedConversation) {
          loadConversationDetail(json.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/conversations/${id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedConversation(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Live Audit & Telemetry
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {conversations.length} User Sessions
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Conversation Logs & Grounding
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Review real user chat interactions, inspect RAG document citations, verify model reasoning, and monitor streaming latencies.
            </p>
          </div>

          <Button
            onClick={fetchConversations}
            variant="outline"
            size="lg"
            className="text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Sessions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 cols: Conversations List */}
        <Card className="lg:col-span-4 max-h-[700px] overflow-y-auto border-border/80 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-border/70 shrink-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-primary" /> Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary mb-2" />
                Loading conversation logs...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No user conversation sessions recorded yet.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversationDetail(conv.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all text-xs border ${
                    selectedConversation?.id === conv.id
                      ? "bg-card border-primary ring-1 ring-primary/30 shadow-xs"
                      : "bg-muted/30 border-transparent hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="truncate max-w-[180px]">{conv.title || "Chat Session"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono font-normal">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                    <span className="truncate max-w-[140px] text-foreground font-medium">{conv.agent?.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/70 font-semibold">
                      {conv._count?.messages || 0} msgs
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right 8 cols: Message History Detail */}
        <Card className="lg:col-span-8 flex flex-col h-[700px] overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="py-4 px-6 bg-muted/40 border-b border-border/70 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  {selectedConversation?.title || "Conversation Detail"}
                </CardTitle>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Session ID: {selectedConversation?.id || "N/A"} • Agent: {selectedConversation?.agent?.name || "AI Agent"}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
            {!selectedConversation ? (
              <div className="text-center py-24 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                Select a conversation session on the left to inspect message history and citations.
              </div>
            ) : (
              selectedConversation.messages?.map((msg: any) => {
                const isUser = msg.role === "USER";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl shadow-xs leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                          : "bg-muted/60 text-foreground border border-border/80 rounded-bl-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Source Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-border/70 text-[10px] space-y-1">
                          <span className="font-semibold text-primary">
                            📚 Referenced Knowledge Citations:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {msg.sources.map((s: any, si: number) => (
                              <span
                                key={si}
                                className="px-2 py-0.5 rounded-lg bg-card border border-border/80 text-foreground font-mono font-medium"
                              >
                                {s.fileName} ({(s.similarity * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] opacity-75 mt-2.5 pt-1.5 border-t border-border/40">
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        {!isUser && (
                          <span className="font-mono">
                            Tokens: {msg.inputTokens} in / {msg.outputTokens} out • {msg.latencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
