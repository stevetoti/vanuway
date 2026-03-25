import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Message } from '@/types/hotels';

export class HotelChatService {
  /**
   * Get or create a conversation between two users for a specific hotel
   */
  static async getOrCreateConversation(
    participant1Id: string,
    participant2Id: string,
    hotelId: string,
    bookingId?: string
  ): Promise<Conversation | null> {
    try {
      // Try to find existing conversation with first participant order
      const { data: existing1 } = await supabase
        .from('conversations')
        .select('*')
        .eq('participant1_id', participant1Id)
        .eq('participant2_id', participant2Id)
        .eq('hotel_id', hotelId)
        .maybeSingle();

      if (existing1) {
        return existing1;
      }

      // Try reversed participant order
      const { data: existing2 } = await supabase
        .from('conversations')
        .select('*')
        .eq('participant1_id', participant2Id)
        .eq('participant2_id', participant1Id)
        .eq('hotel_id', hotelId)
        .maybeSingle();

      if (existing2) {
        return existing2;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant1_id: participant1Id,
          participant2_id: participant2Id,
          hotel_id: hotelId,
          booking_id: bookingId,
          participant1_unread: 0,
          participant2_unread: 0,
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConversation;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return null;
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      // Query conversations where user is participant1
      const { data: conv1, error: error1 } = await supabase
        .from('conversations')
        .select('*, hotel:hotels(name, city)')
        .eq('participant1_id', userId)
        .order('last_message_at', { ascending: false });

      if (error1) throw error1;

      // Query conversations where user is participant2
      const { data: conv2, error: error2 } = await supabase
        .from('conversations')
        .select('*, hotel:hotels(name, city)')
        .eq('participant2_id', userId)
        .order('last_message_at', { ascending: false });

      if (error2) throw error2;

      // Combine and deduplicate by id, then sort by last_message_at
      const allConversations = [...(conv1 || []), ...(conv2 || [])];
      const uniqueConversations = Array.from(
        new Map(allConversations.map(c => [c.id, c])).values()
      );

      // Sort by last_message_at descending
      return uniqueConversations.sort((a, b) => {
        const dateA = new Date(a.last_message_at || 0).getTime();
        const dateB = new Date(b.last_message_at || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    messageText: string
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          message_text: messageText,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Mark all unread messages as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      // Update conversation unread count
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const isParticipant1 = conversation.participant1_id === userId;
        await supabase
          .from('conversations')
          .update({
            [isParticipant1 ? 'participant1_unread' : 'participant2_unread']: 0,
          })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to conversation updates
   */
  static subscribeToConversations(
    userId: string,
    onUpdate: (conversation: Conversation) => void
  ) {
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(participant1_id.eq.${userId},participant2_id.eq.${userId})`,
        },
        (payload) => {
          onUpdate(payload.new as Conversation);
        }
      )
      .subscribe();
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Get unread count where user is participant1
      const { data: conv1, error: error1 } = await supabase
        .from('conversations')
        .select('participant1_unread')
        .eq('participant1_id', userId);

      if (error1) throw error1;

      // Get unread count where user is participant2
      const { data: conv2, error: error2 } = await supabase
        .from('conversations')
        .select('participant2_unread')
        .eq('participant2_id', userId);

      if (error2) throw error2;

      const unread1 = conv1?.reduce((sum, c) => sum + (c.participant1_unread || 0), 0) || 0;
      const unread2 = conv2?.reduce((sum, c) => sum + (c.participant2_unread || 0), 0) || 0;

      return unread1 + unread2;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get other participant info
   */
  static async getOtherParticipant(conversationId: string, currentUserId: string) {
    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const otherUserId =
        conversation.participant1_id === currentUserId
          ? conversation.participant2_id
          : conversation.participant1_id;

      // Try to get hotel owner profile first
      const { data: ownerProfile } = await supabase
        .from('hotel_owners')
        .select('contact_person, business_name')
        .eq('user_id', otherUserId)
        .single();

      if (ownerProfile) {
        return {
          id: otherUserId,
          name: ownerProfile.contact_person,
          businessName: ownerProfile.business_name,
          isOwner: true,
        };
      }

      // Otherwise return generic customer info
      // Note: We can't access user details from client-side auth
      // Consider creating a user_profiles table if you need more details
      return {
        id: otherUserId,
        name: 'Customer',
        isOwner: false,
      };
    } catch (error) {
      console.error('Error getting other participant:', error);
      return null;
    }
  }
}
