import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useCall } from './CallContext';
import { uploadMediaToSupabase } from '../utils/storageUtils';

const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { socket } = useCall();
  
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Load conversations from real API
  const loadConversations = useCallback(async () => {
      
    if (!user?.id) return;
    setLoadingConversations(true);
    try {
      const res = await api.getConversations();
      if (res.success && res.conversations) {
        setActiveChats(res.conversations);
        await storage.set('@active_chats', JSON.stringify(res.conversations));
      }
    } catch (e) {
      console.error('Failed to load conversations from API:', e);
      // Fallback to cached data
      const stored = storage.getString('@active_chats');
      if (stored) setActiveChats(JSON.parse(stored));
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const storedReplies = storage.getString('@quick_replies');
        if (storedReplies) setQuickReplies(JSON.parse(storedReplies));
        else setQuickReplies([]);
        const storedMessages = storage.getString('@chat_messages');
        if (storedMessages) setMessages(JSON.parse(storedMessages));
      } catch (e) {
        console.error('Failed to load local chats', e);
      }
    };
    loadLocalData();
  }, []);

  useEffect(() => {
    if (!user) return;

    
    if (!socket) return;
    const handleNewMessage = (newMsg) => {
      setMessages(prev => {
          const chatId = newMsg.chat_id;
          const chatMsgs = prev[chatId] || [];
          if (chatMsgs.find(m => m.id === newMsg.id)) return prev;
          const updatedMsgs = [...chatMsgs, newMsg].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // sort desc
          const updatedState = { ...prev, [chatId]: updatedMsgs };
          storage.set('@chat_messages', JSON.stringify(updatedState));
          return updatedState;
        });
    };
    
    socket.on('message:received', handleNewMessage);
    
    return () => {
      socket.off('message:received', handleNewMessage);

            clearInterval(cronInterval);
    };
  }, [user]);
  
  // Real-time Typing Status via Socket
  useEffect(() => {
    if (!socket) return;
    
    const handleTyping = ({ senderId, isTyping: typingStatus, chatId }) => {
      // Map to local chatId or use senderId
      const activeId = chatId || senderId;
      setIsTyping(prev => ({ ...prev, [activeId]: typingStatus }));
    };
    
    socket.on('typing:status', handleTyping);
    return () => {
      socket.off('typing:status', handleTyping);
    };
  }, [socket]);


  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;
    try {
      setActiveChats(prev => {
        const updated = prev.map(chat => 
          (chat.contact?.id === chatId || chat.chatId === chatId) ? { ...chat, unreadCount: 0 } : chat
        );
        storage.set('@active_chats', JSON.stringify(updated));
        return updated;
      });
      await api.markMessagesAsRead(chatId);
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  
  const updateMessageLocally = (chatId: string, messageId: string, updates: any) => {
    setMessages(prev => {
      const updated = {
        ...prev,
        [chatId]: (prev[chatId] || []).map(m => m.id === messageId ? { ...m, ...updates } : m)
      };
      storage.set('@chat_messages', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteMessage = async (chatId: string, messageId: string) => {
    try {
      setMessages(prev => {
        const updated = {
          ...prev,
          [chatId]: (prev[chatId] || []).filter(m => m.id !== messageId)
        };
        storage.set('@chat_messages', JSON.stringify(updated));
        return updated;
      });
      await api.deleteMessage(messageId);
    } catch (e) {
      console.error('Failed to delete message:', e);
    }
  };

  const sendMessage = async (
    chatId: string, 
    text: string, 
    type: 'text' | 'audio' | 'image' | 'document' | 'checklist' | 'money_request' = 'text', 
    mediaUrl?: string, 
    replyToId?: string,
    fileName?: string,
    scheduledFor?: Date,
    metadata?: any
  ) => {
    const newMessageId = Date.now().toString();
    const isOnlyEmoji = (str: string) => /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s){1,3}$/u.test(str.trim());
    
    const newMessage = {
      id: newMessageId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSender: true,
      status: scheduledFor ? 'scheduled' : 'sending',
      type,
      mediaUrl, // Optimistic local UI rendering
      replyToId,
      fileName,
      scheduledFor,
      metadata,
      emoji: isOnlyEmoji(text)
    };

    // 1. Update UI Optimistically
    setMessages(prev => {
      const updated = { ...prev, [chatId]: [newMessage, ...(prev[chatId] || [])] };
      storage.set('@chat_messages', JSON.stringify(updated));
      return updated;
    });

    setActiveChats(prev => {
      const updated = prev.map(chat => 
        (chat.contact?.id === chatId || chat.chatId === chatId) ? { ...chat, lastMessage: type === 'audio' ? '🎵 Voice Note' : type === 'document' ? '📎 Document' : type === 'image' ? '📷 Image' : type === 'money_request' ? '💵 Payment Request' : type === 'checklist' ? '✅ Checklist' : text, time: 'Just now' } : chat
      );
      storage.set('@active_chats', JSON.stringify(updated));
      return updated;
    });

    // 2. Upload file to Supabase if media exists
    let finalMediaUrl = mediaUrl;
    if (mediaUrl && (mediaUrl.startsWith('file') || mediaUrl.startsWith('blob'))) {
       const uploadedUrl = await uploadMediaToSupabase(mediaUrl, type as any, fileName);
       if (uploadedUrl) {
         finalMediaUrl = uploadedUrl;
         // Update message in UI with final URL
         setMessages(prev => {
            const chatMsgs = prev[chatId] || [];
            return {
              ...prev,
              [chatId]: chatMsgs.map(m => m.id === newMessageId ? { ...m, mediaUrl: finalMediaUrl } : m)
            };
         });
       }
    }

    // 3. Send to Supabase DB (If not scheduled, or maybe store scheduled in a separate table/status)
    if (user && !scheduledFor) {
       const { encryptMessage } = require('../utils/cryptoUtils');
       const encryptedText = await encryptMessage(text, user.id, chatId);

       try {
         await api.sendMessage({ 
           receiverId: chatId, 
           text: encryptedText, 
           mediaType: type, 
           fileUrl: finalMediaUrl,
           replyToId: replyToId,
           metadata: metadata || null,
           fileName: fileName || null
         });
       } catch (err) {
         console.error('Failed to send message:', err);
       }
    }

    // 4. Update status to 'sent'
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m)
      }));
    }, 500);
  };

  
  const fetchRealMessages = useCallback(async (contactId: string) => {
    if (!user) return;
    try {
      const res = await api.getMessages(contactId);
      if (res.success && res.messages) {
        const decryptedMsgs = await Promise.all(res.messages.map(async (m) => {
          let decryptedText = m.text;
          if (decryptedText) {
             const { decryptMessage } = require('../utils/cryptoUtils');
             decryptedText = await decryptMessage(decryptedText, user.id, contactId);
          }
          return {
            id: m.id,
            text: decryptedText,
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSender: m.senderId === user.id,
            status: m.status || 'delivered',
            type: m.mediaType || 'text',
            mediaUrl: m.fileUrl || m.mediaUrl,
            metadata: m.metadata,
            emoji: /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s){1,3}$/u.test((decryptedText||'').trim())
          };
        }));
        
        setMessages(prev => ({
          ...prev,
          [contactId]: decryptedMsgs
        }));
      }
    } catch (e) {
      console.error('Failed to fetch real messages:', e);
    }
  }, [user]);

  const loadMoreMessages = async (chatId: string) => {
    if (!user) return;
    try {
      const currentMessages = messages[chatId] || [];
      const page = Math.floor(currentMessages.length / 50) + 1;
      const res = await api.getMessages(chatId, page, 50);
      if (res.success && res.messages) {
        const decryptedMsgs = await Promise.all(res.messages.map(async (m: any) => {
          let decryptedText = m.text;
          if (decryptedText) {
             const { decryptMessage } = require('../utils/cryptoUtils');
             decryptedText = await decryptMessage(decryptedText, user.id, chatId);
          }
          return {
            id: m.id,
            text: decryptedText,
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSender: m.senderId === user.id,
            status: m.status || 'delivered',
            type: m.mediaType || 'text',
            mediaUrl: m.fileUrl || m.mediaUrl,
            metadata: m.metadata,
            emoji: /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s){1,3}$/u.test((decryptedText||'').trim())
          };
        }));

        setMessages(prev => {
          const existingIds = new Set((prev[chatId] || []).map(m => m.id));
          const newMsgs = decryptedMsgs.filter(m => !existingIds.has(m.id));
          const updated = [...(prev[chatId] || []), ...newMsgs];
          storage.set('@chat_messages', JSON.stringify({ ...prev, [chatId]: updated }));
          return { ...prev, [chatId]: updated };
        });
      }
    } catch (e) {
      console.error('Failed to load more messages', e);
    }
  };

  const sendTypingEvent = (chatId: string, isTypingStatus: boolean) => {
    if (!socket) return;
    if (isTypingStatus) {
      socket.emit('typing:start', { receiverId: chatId, chatId });
    } else {
      socket.emit('typing:stop', { receiverId: chatId, chatId });
    }
  };

  const toggleChecklistItem = (chatId: string, messageId: string, itemId: number) => {
    setMessages(prev => {
      const chatMsgs = prev[chatId] || [];
      const updatedMsgs = chatMsgs.map(m => {
        if (m.id === messageId && m.type === 'checklist' && m.metadata) {
          const newItems = m.metadata.items.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i);
          const updatedMsg = { ...m, metadata: { ...m.metadata, items: newItems } };
          if (user) api.updateMessageMetadata(messageId, updatedMsg.metadata).then();
          return updatedMsg;
        }
        return m;
      });
      const updated = { ...prev, [chatId]: updatedMsgs };
      storage.set('@chat_messages', JSON.stringify(updated));
      return updated;
    });
  };

  const addQuickReply = async (reply: string) => {
    const newReplies = [...quickReplies, reply];
    setQuickReplies(newReplies);
    await AsyncStorage.setItem('@quick_replies', JSON.stringify(newReplies));
  };

  return (
    <ChatContext.Provider value={{ activeChats, messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, loadConversations, loadingConversations, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
