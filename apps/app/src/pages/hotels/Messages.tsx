import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HotelChatService } from '@/lib/hotels/chat-service';
import type { Conversation } from '@/types/hotels';
import { MessageSquare, Building2, Clock } from 'lucide-react';
import { ChatWidget } from '@/components/hotels/ChatWidget';

const HotelMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [otherParticipants, setOtherParticipants] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (user) {
      loadConversations();

      // Subscribe to conversation updates
      const subscription = HotelChatService.subscribeToConversations(
        user.id,
        (updatedConv) => {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === updatedConv.id ? updatedConv : conv
            )
          );
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    // Auto-select conversation from URL param
    const convId = searchParams.get('conversation');
    if (convId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === convId);
      if (conv) {
        setSelectedConversation(conv);
      }
    } else if (conversations.length > 0 && !selectedConversation) {
      // Auto-select first conversation
      setSelectedConversation(conversations[0]);
    }
  }, [searchParams, conversations]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const convs = await HotelChatService.getUserConversations(user.id);
      setConversations(convs);

      // Load other participants info
      const participants: Record<string, unknown> = {};
      for (const conv of convs) {
        const participant = await HotelChatService.getOtherParticipant(
          conv.id,
          user.id
        );
        if (participant) {
          participants[conv.id] = participant;
        }
      }
      setOtherParticipants(participants);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = (conv: Conversation) => {
    if (!user) return 0;
    return conv.participant1_id === user.id
      ? conv.participant1_unread
      : conv.participant2_unread;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Chat with property owners and guests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="p-4 overflow-y-auto">
            <h2 className="font-semibold mb-4">Conversations</h2>

            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start chatting with property owners when you book a hotel
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const unread = getUnreadCount(conv);
                  const participant = otherParticipants[conv.id];
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="font-semibold text-sm truncate">
                            {(conv as unknown).hotel?.name || 'Hotel'}
                          </p>
                        </div>
                        {unread > 0 && (
                          <Badge className="ml-2 flex-shrink-0" variant="default">
                            {unread}
                          </Badge>
                        )}
                      </div>

                      {participant && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {participant.businessName || participant.name}
                        </p>
                      )}

                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {conv.last_message}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(conv.last_message_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatWidget
                hotelId={selectedConversation.hotel_id!}
                hotelName={(selectedConversation as unknown).hotel?.name || 'Hotel'}
                ownerId={
                  selectedConversation.participant1_id === user?.id
                    ? selectedConversation.participant2_id
                    : selectedConversation.participant1_id
                }
                bookingId={selectedConversation.booking_id || undefined}
                triggerButton={false}
              />
            ) : conversations.length > 0 ? (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HotelMessages;
