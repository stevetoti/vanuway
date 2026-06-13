import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  sendRideMessage,
  getRideMessages,
  markMessagesAsRead,
  subscribeToRideMessages,
  unsubscribeFromRideMessages,
  DRIVER_QUICK_MESSAGES,
  PASSENGER_QUICK_MESSAGES,
  type RideMessage,
} from '@/lib/rides/messaging-service';

interface RideMessagingProps {
  rideId: string;
  userId: string;
  userType: 'driver' | 'passenger';
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export const RideMessaging = ({
  rideId,
  userId,
  userType,
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}: RideMessagingProps) => {
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickMessages = userType === 'driver' ? DRIVER_QUICK_MESSAGES : PASSENGER_QUICK_MESSAGES;

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // Mark as read when opened
      markMessagesAsRead(rideId, userId);
      onUnreadCountChange(0);
    }

    // Subscribe to new messages
    const channel = subscribeToRideMessages(rideId, (message) => {
      setMessages((prev) => [...prev, message]);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);

      // Mark as read if chat is open and message is from other person
      if (isOpen && message.sender_id !== userId) {
        markMessagesAsRead(rideId, userId);
      } else if (!isOpen && message.sender_id !== userId) {
        // Update unread count if chat is closed
        onUnreadCountChange(unreadCount + 1);
        toast.info('New message from ' + (userType === 'driver' ? 'passenger' : 'driver'));
      }
    });

    return () => {
      unsubscribeFromRideMessages(channel);
    };
  }, [rideId, userId, isOpen]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const result = await getRideMessages(rideId);
    if (result.success && result.data) {
      setMessages(result.data);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || newMessage.trim();
    if (!textToSend) return;

    setSending(true);
    const result = await sendRideMessage({
      rideId,
      senderId: userId,
      senderType: userType,
      message: textToSend,
      isTemplate: !!messageText, // True if it's a quick message
    });

    if (result.success) {
      setNewMessage('');
    } else {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 h-[70vh] max-h-[500px] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">
            Chat with {userType === 'driver' ? 'Passenger' : 'Driver'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-primary-foreground/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Messages */}
      <div className="p-3 border-b bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Quick messages:</p>
        <div className="flex flex-wrap gap-2">
          {quickMessages.slice(0, 3).map((msg, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(msg)}
              disabled={sending}
              className="text-xs h-7"
            >
              {msg}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as unknown}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Send a message to start the conversation.
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={sending || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface MessageButtonProps {
  onClick: () => void;
  unreadCount: number;
}

export const MessageButton = ({ onClick, unreadCount }: MessageButtonProps) => {
  return (
    <Button variant="outline" size="sm" className="relative" onClick={onClick}>
      <MessageSquare className="h-4 w-4 mr-2" />
      Message
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
          {unreadCount}
        </Badge>
      )}
    </Button>
  );
};
