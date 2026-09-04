"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Send,
  Check,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClientTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/v1/tickets/${id}`);
      if (res.ok) {
        const json = await res.json();
        setTicket(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/v1/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        fetchTicket();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkResolved = async () => {
    try {
      const res = await fetch(`/api/v1/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Loading ticket conversation...</span>
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-16 text-center text-sm text-muted-foreground">Support ticket not found.</div>;
  }

  // Filter out any internal notes for client view
  const visibleMessages = (ticket.messages || []).filter((m: any) => !m.isInternalNote);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/client/tickets"
              className="p-2.5 rounded-2xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-primary">
                  {ticket.ticketNumber}
                </span>
                <Badge variant={ticket.status === "RESOLVED" ? "success" : ticket.status === "OPEN" ? "destructive" : "secondary"} className="text-[10px] font-semibold">
                  {ticket.status}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{ticket.title}</h1>
              <div className="text-xs text-muted-foreground">
                Raised on {new Date(ticket.createdAt).toLocaleDateString()} • Priority: <span className="font-semibold text-foreground">{ticket.priority}</span>
              </div>
            </div>
          </div>

          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkResolved}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 shrink-0"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Mark as Resolved
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: Message History & Reply Composer */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="flex flex-col min-h-[500px] border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="py-3.5 px-6 bg-muted/40 border-b border-border/70 shrink-0">
              <CardTitle className="text-sm font-bold text-foreground">Support Conversation History</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {visibleMessages.map((msg: any) => {
                const isSuperAdmin = msg.senderRole === "SUPER_ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 shadow-xs ${
                      isSuperAdmin
                        ? "bg-primary/5 border-primary/20 ml-4 sm:ml-6"
                        : "bg-muted/40 border-border mr-4 sm:mr-6"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {isSuperAdmin ? "Brain Plug Support Engineer" : msg.sender?.fullName || "You"}
                        </span>
                        <Badge
                          variant={isSuperAdmin ? "primary" : "secondary"}
                          className="text-[9px] font-semibold"
                        >
                          {isSuperAdmin ? "Support Staff" : "Client Message"}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>

                    {msg.attachmentUrl && (
                      <div className="pt-2 border-t border-border/70">
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-semibold flex items-center gap-1 hover:underline text-xs"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> {msg.attachmentName || "View Attachment"}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>

            {/* Reply Composer Form */}
            {ticket.status !== "CLOSED" ? (
              <form onSubmit={handleSendReply} className="p-4 border-t border-border/70 bg-card space-y-3 shrink-0">
                <textarea
                  rows={3}
                  required
                  placeholder="Type your reply or additional details here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-xl border border-border/80 p-3 bg-background text-xs text-foreground outline-none focus:border-primary font-sans leading-relaxed"
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSending || !replyText.trim()} className="text-xs font-semibold shadow-xs">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    {isSending ? "Sending Reply..." : "Send Reply to Support"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-muted/40 text-center text-xs text-muted-foreground border-t border-border/70">
                This ticket is closed. If you have a new question, please raise a new support ticket.
              </div>
            )}
          </Card>
        </div>

        {/* Right 4 cols: Status Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-bold text-foreground">Ticket Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Ticket #:</span>
                <span className="font-mono font-bold text-primary">{ticket.ticketNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={ticket.status === "RESOLVED" ? "success" : "secondary"}>{ticket.status}</Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant={ticket.priority === "URGENT" ? "destructive" : "secondary"}>
                  {ticket.priority}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-semibold text-foreground">{ticket.category.replace(/_/g, " ")}</span>
              </div>
              {ticket.agent && (
                <div className="flex justify-between items-center py-1 border-b border-border/60">
                  <span className="text-muted-foreground">AI Agent:</span>
                  <span className="font-semibold text-foreground">{ticket.agent.name}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
