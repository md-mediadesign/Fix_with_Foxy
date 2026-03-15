"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getMessages, sendMessage, markMessagesRead } from "@/actions/messages";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { useTranslations } from "@/components/locale-provider";

type Message = {
  id: string;
  jobId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
};

const POLL_INTERVAL = 5000;

export default function ProviderMessagesPage() {
  const t = useTranslations();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, startSendTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessages(jobId);
      setMessages(data as Message[]);
      await markMessagesRead(jobId);
    } catch {
      // Silently fail for polling
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messageContent = newMessage.trim();
    setNewMessage("");
    startSendTransition(async () => {
      try {
        const result = await sendMessage(jobId, messageContent);
        if (result.error) {
          toast.error(result.error);
          setNewMessage(messageContent);
          return;
        }
        await fetchMessages();
      } catch {
        toast.error(t.messages.sendError);
        setNewMessage(messageContent);
      }
    });
  }

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/anbieter/auftraege/${jobId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.back}
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">{t.messages.title}</h2>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t.messages.noMessages}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender.role === "PROVIDER";
                  return (
                    <div key={message.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        {message.sender.avatarUrl && (
                          <AvatarImage src={message.sender.avatarUrl} alt={message.sender.name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[75%] space-y-1 ${isOwnMessage ? "items-end text-right" : ""}`}>
                        <div className={`flex items-center gap-2 ${isOwnMessage ? "justify-end" : ""}`}>
                          <span className="text-xs font-medium">{message.sender.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: de })}
                          </span>
                        </div>
                        <div className={`inline-block rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <Separator />
          <form onSubmit={handleSend} className="flex items-center gap-2 p-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t.messages.placeholder}
              maxLength={2000}
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
