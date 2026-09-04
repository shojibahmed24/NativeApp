import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

// Use environment variable for production, fallback to localhost for dev
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const SOCKET_URL = API_BASE.replace('/api', '');

let memoryToken = null;
let memoryDevId = null;

export const api = {
  // Initialize from storage (call this early in app boot)
  async init() {
    try {
      if (Platform.OS !== 'web') {
        try {
          memoryToken = await SecureStore.getItemAsync('unicom_user_token');
        } catch (e) {
          console.warn('SecureStore error', e);
        }
      }
      if (!memoryToken) {
        memoryToken = await AsyncStorage.getItem('unicom_user_token');
      }
      memoryDevId = await AsyncStorage.getItem('unicom_dev_id');
      if (!memoryDevId) {
        memoryDevId = 'mobile_primary_session_' + Math.random().toString(36).substring(7);
        await AsyncStorage.setItem('unicom_dev_id', memoryDevId);
      }
    } catch (e) {
      console.error('Failed to init API storage', e);
    }
  },

  getToken() {
    return memoryToken;
  },

  async setToken(token) {
    memoryToken = token;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('unicom_user_token', token);
      } else {
        await AsyncStorage.setItem('unicom_user_token', token);
      }
    } catch(err) {}
  },

  async clearToken() {
    memoryToken = null;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('unicom_user_token');
      }
      await AsyncStorage.removeItem('unicom_user_token');
      // Fix for Issue 6: Clear cached messages on logout
      await AsyncStorage.removeItem('@chat_messages');
      await AsyncStorage.removeItem('@active_chats');
    } catch(err) {}
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { message: text };
      }
    }

    if (!res.ok) {
      const err = new Error(data?.message || 'Request failed');
      err.code = data?.code;
      throw err;
    }
    return data;
  },

  // Auth
  requestOtp(phone, mode) {
    return this.request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, mode })
    });
  },

  verifyFirebaseToken(idToken, deviceId) {
    return this.request('/auth/verify-firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken, deviceId })
    });
  },

  verifyOtp(phone, code, deviceId) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, deviceId })
    });
  },


  getProfile() {
    return this.request('/auth/profile');
  },

  getPublicProfile(userId) {
    return this.request(`/users/${userId}/public-profile`);
  },

  updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  blockUser(blockedId) {
    return this.request('/users/block', { method: 'POST', body: JSON.stringify({ blockedId }) });
  },

  toggleMuteUser(userIdToMute) {
    return this.request('/auth/mute', { method: 'POST', body: JSON.stringify({ userIdToMute }) });
  },

  unblockUser(blockedId) {
    return this.request(`/users/block/${blockedId}`, { method: 'DELETE' });
  },

  getBlockedUsers() {
    return this.request('/users/blocked');
  },

  muteChat(chatId) {
    return this.request('/chat/mute', { method: 'POST', body: JSON.stringify({ chatId }) });
  },

  unmuteChat(chatId) {
    return this.request(`/chat/mute/${chatId}`, { method: 'DELETE' });
  },

  getChatMedia(chatId) {
    return this.request(`/chat/media/${chatId}`);
  },

  deleteAccount() {
    return this.request('/auth/account', {
      method: 'DELETE'
    });
  },

  // Chats & Messaging
  getConversations() {
    return this.request('/chat/conversations');
  },

  getMessages(contactId, page = 1) {
    return this.request(`/chat/messages/${contactId}?page=${page}&limit=50`);
  },

  async syncContacts(phoneNumbers) {
    // Fix for H8: Chunking phone numbers to prevent DB crash (Supabase .in limit)
    const CHUNK_SIZE = 100;
    let allContacts = [];
    
    for (let i = 0; i < phoneNumbers.length; i += CHUNK_SIZE) {
      const chunk = phoneNumbers.slice(i, i + CHUNK_SIZE);
      try {
        const res = await this.request('/chat/sync-contacts', {
          method: 'POST',
          body: JSON.stringify({ phoneNumbers: chunk })
        });
        if (res.success && res.contacts) {
          allContacts = [...allContacts, ...res.contacts];
        }
      } catch (err) {
        console.error('Contact sync chunk error:', err);
      }
    }
    
    return { success: true, contacts: allContacts };
  },

  sendMessage(messageData) {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  },

  reactToMessage(messageId, emoji) {
    return this.request(`/chat/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  },

  deleteMessage(messageId) {
    return this.request(`/chat/messages/${messageId}`, {
      method: 'DELETE'
    });
  },
  updateMessageMetadata(messageId, metadata) {
    return this.request(`/chat/messages/${messageId}/metadata`, {
      method: 'PUT',
      body: JSON.stringify({ metadata })
    });
  },
  


  
  markMessagesAsRead(chatId) {
    return this.request('/chat/read', {
      method: 'POST',
      body: JSON.stringify({ chatId })
    });
  },

  uploadBase64(base64, fileName, mimeType, type = 'chat') {
    return this.request(`/storage/upload?type=${type}`, {
      method: 'POST',
      body: JSON.stringify({ base64, fileName, mimeType })
    });
  },

  uploadFile(file, type = 'chat') {
    const formData = new FormData();
    let fileName = file.name || '';
    if (!fileName || !fileName.includes('.')) {
      const ext = file.type ? file.type.split('/')[1] : 'bin';
      fileName = fileName ? `${fileName}.${ext}` : `upload.${ext}`;
    }
    if (fileName.endsWith('.jpeg')) fileName = fileName.replace('.jpeg', '.jpg');
    
    formData.append('file', file, fileName);
    return this.request(`/storage/upload?type=${type}`, {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  // Calls
  joinCall(callId) {
    return this.request(`/calls/${callId}/join`, {
      method: 'POST'
    });
  },

  initiateCall(receiverId) {
    return this.request('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ receiverId })
    });
  },

  endCall(callId, durationSeconds, avgLatencyMs) {
    return this.request('/calls/end', {
      method: 'POST',
      body: JSON.stringify({ callId, durationSeconds, avgLatencyMs })
    });
  },

  getCallHistory() {
    return this.request('/calls/history');
  },

  deleteCallLog(callId) {
    return this.request(`/calls/${callId}`, { method: 'DELETE' });
  },

  reportCallIssue(callId, reason, details) {
    return this.request('/calls/report-issue', {
      method: 'POST',
      body: JSON.stringify({ callId, reason, details })
    });
  },

  reportUser(userId, reason = 'Inappropriate behavior') {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'general',
        subject: `User Report: ${userId}`,
        initialMessage: `Reporting user ${userId}. Reason: ${reason}`,
        priority: 'high'
      })
    });
  },

  // Payments & USDT
  getPlansAndWallet() {
    return this.request('/payments/plans-wallet');
  },

  submitUsdtPayment(planId, txHash) {
    return this.request('/payments/submit-usdt', {
      method: 'POST',
      body: JSON.stringify({ planId, txHash })
    });
  },

  createStripeCheckout(planId) {
    return this.request('/payments/stripe-checkout', {
      method: 'POST',
      body: JSON.stringify({ planId })
    });
  },

  // Support
  createTicket(category, subject, initialMessage) {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ category, subject, initialMessage })
    });
  },

  getUserTickets() {
    return this.request('/support/tickets');
  },

  replyTicket(ticketId, message) {
    return this.request(`/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
};

