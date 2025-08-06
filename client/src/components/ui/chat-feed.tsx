import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isCommand: boolean;
  isSystemMessage: boolean;
}

interface ChatFeedProps {
  messages: ChatMessage[];
  onNewMessage?: (message: ChatMessage) => void;
}

export function ChatFeed({ messages, onNewMessage }: ChatFeedProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await apiRequest("POST", "/api/chat", { message: newMessage });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent to the room.",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message to the room.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPlayerInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getPlayerColor = (name: string) => {
    // Generate consistent color based on name
    const colors = [
      "bg-primary",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-blue-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="flex flex-col h-full" data-testid="chat-feed">
      <CardHeader className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Live Chat</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-500">Live</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-3" data-testid="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${
                message.isSystemMessage
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-muted"
              }`}
              data-testid={`chat-message-${message.id}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  message.isSystemMessage
                    ? "bg-green-500 text-white"
                    : getPlayerColor(message.playerName)
                } text-white`}
              >
                {message.isSystemMessage ? (
                  <i className="fas fa-robot text-xs"></i>
                ) : (
                  getPlayerInitial(message.playerName)
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">
                    {message.playerName}
                  </span>
                  {message.playerName === "Admin Dashboard" && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      Admin
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    message.isSystemMessage
                      ? "text-green-400"
                      : message.isCommand
                      ? "text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.message}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex space-x-3">
            <Input
              type="text"
              placeholder="Send message to room..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-muted border-border"
              disabled={isSending}
              data-testid="chat-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/90"
              data-testid="send-message-button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
