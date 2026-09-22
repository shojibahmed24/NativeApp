const fs = require('fs');
const path = './src/context/ChatContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add zustand import
content = content.replace("import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';", 
  "import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';\nimport { create } from 'zustand';");

// 2. Define useChatStore
const storeCode = `
export const useChatStore = create<any>((set, get) => ({
  activeChats: [],
  messages: {},
  isTyping: {},
  quickReplies: [],
  onlineUsers: {},
  loadingConversations: false,
  setActiveChats: (updater: any) => set((state: any) => ({ activeChats: typeof updater === 'function' ? updater(state.activeChats) : updater })),
  setMessages: (updater: any) => set((state: any) => ({ messages: typeof updater === 'function' ? updater(state.messages) : updater })),
  setIsTyping: (updater: any) => set((state: any) => ({ isTyping: typeof updater === 'function' ? updater(state.isTyping) : updater })),
  setQuickReplies: (updater: any) => set((state: any) => ({ quickReplies: typeof updater === 'function' ? updater(state.quickReplies) : updater })),
  setOnlineUsers: (updater: any) => set((state: any) => ({ onlineUsers: typeof updater === 'function' ? updater(state.onlineUsers) : updater })),
  setLoadingConversations: (loadingConversations: boolean) => set({ loadingConversations }),
  setFunctions: (funcs: any) => set(funcs)
}));

const ChatContext = createContext<any>(null);
`;
content = content.replace("const ChatContext = createContext<any>(null);", storeCode);

// 3. Replace state definitions in ChatProvider
content = content.replace(
  /const \[activeChats, setActiveChats\] = useState<any\[\]>\(\[\]\);\s*const \[messages, setMessages\] = useState<Record<string, any\[\]>>\(\{\}\);\s*const \[isTyping, setIsTyping\] = useState<Record<string, boolean>>\(\{\}\);\s*const \[quickReplies, setQuickReplies\] = useState<string\[\]>\(\[\]\);\s*const \[onlineUsers, setOnlineUsers\] = useState<Record<string, boolean>>\(\{\}\);\s*const \[loadingConversations, setLoadingConversations\] = useState\(false\);/,
  `const {
    activeChats, setActiveChats,
    messages, setMessages,
    isTyping, setIsTyping,
    quickReplies, setQuickReplies,
    onlineUsers, setOnlineUsers,
    loadingConversations, setLoadingConversations,
    setFunctions
  } = useChatStore();`
);

// 4. Inject functions into the store
const contextValueReplacement = `  const contextValue = useMemo(() => ({ activeChats, messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, loadConversations, loadingConversations, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally }), [activeChats, messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, loadConversations, loadingConversations, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally]);

  useEffect(() => {
    setFunctions({
      sendMessage, loadMoreMessages, sendTypingEvent, addQuickReply, toggleChecklistItem, loadConversations, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally
    });
  }, [setFunctions, sendMessage, loadMoreMessages, sendTypingEvent, addQuickReply, toggleChecklistItem, loadConversations, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally]);
`;

content = content.replace(/const contextValue = useMemo\(\(\) => \(\{[\s\S]*?\n/, contextValueReplacement);

fs.writeFileSync(path, content, 'utf8');
