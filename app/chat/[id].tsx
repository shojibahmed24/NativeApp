import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageBackground, View, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Animated as RNAnimated, ScrollView, Modal, Clipboard, Image } from 'react-native';
import { YStack, XStack, Text, Avatar, Spinner } from 'tamagui';
import { ChevronLeft, Phone, Video, Send, Mic, Image as ImageIcon, Smile, Check, CheckCheck, Reply, Languages, X, Paperclip, Clock, FileText, Banknote, CheckSquare, Zap, SquareCheck, Square, Building, Wallet, Copy, QrCode, PlusCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '../../src/components/ThemeComponents';
import AnimatedEmoji from '../../src/components/AnimatedEmoji';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { useChat } from '../../src/context/ChatContext';
import { useAuth } from '../../src/context/AuthContext';
import { useCall } from '../../src/context/CallContext';
import { supabase } from '../../src/services/supabase';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Swipeable } from 'react-native-gesture-handler';
import EmojiPicker from '../../src/components/EmojiPickerWrapper';
import { Keyboard } from 'react-native';
import { api } from '../../src/services/api';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally } = useChat();
  const { startVoiceCall } = useCall();
  const { user } = useAuth();
  const chatMessages = messages[id as string] || [];
  
  useEffect(() => {
    if (id) {
      fetchRealMessages(id as string);
      markMessagesAsRead(id as string);
    }
  }, [id]);

  
  const [inputText, setInputText] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, boolean>>({});
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('Task List');
  const [taskInputs, setTaskInputs] = useState(['', '', '']);
  
  const toggleTask = async (msgId: string, taskId: string) => {
    Platform.OS !== 'web' && Haptics.impactAsync();
    const msg = chatMessages.find(m => m.id === msgId);
    if (!msg || !msg.metadata) return;
    const newTasks = msg.metadata.tasks.map((t: any) => t.id === taskId ? { ...t, done: !t.done } : t);
    const newMetadata = { ...msg.metadata, tasks: newTasks };
    updateMessageLocally(id as string, msgId, { metadata: newMetadata });
    try {
      await api.updateMessageMetadata(msgId, newMetadata);
    } catch(e) { console.error(e); }
  };
  
  const sendTaskList = () => {
    const validTasks = taskInputs.filter(t => (typeof t === 'string' ? t : (t.title || '')).trim() !== '').map((t, i) => ({ id: `t${i}_${Date.now()}`, title: (typeof t === 'string' ? t : (t.title || '')).trim(), price: typeof t === 'string' ? 0 : parseFloat(t.price || '0'), done: false }));
    if (validTasks.length === 0) return alert('Please enter at least one task');
    sendMessage(id as string, '', 'todo_list', undefined, replyingTo?.id, undefined, undefined, { title: taskTitle, tasks: validTasks });
    setShowTaskModal(false);
    setTaskInputs(['', '', '']);
    setTaskTitle('Task List');
    setReplyingTo(null);
  };
  
  const [moneyRequestMode, setMoneyRequestMode] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'crypto'>('bank');
  const [activePaymentMsg, setActivePaymentMsg] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  
  const flatListRef = useRef<FlatList>(null);

  const { activeChats } = useChat();
  
  useEffect(() => {
    let isSubscribed = true;
    if (activeChats && activeChats.length > 0) {
      const chat = activeChats.find(c => c.contact && String(c.contact.id) === String(id));
      if (chat && chat.contact) {
        if (isSubscribed) {
          setRecipient({
            ...chat.contact,
            profile_picture: chat.contact.avatar,
            phone_number: chat.contact.phone
          });
        }
        return;
      }
    }
    
    // Fallback API call if not in activeChats
    api.request(`/users/${id}/public-profile`).then(res => {
       if (isSubscribed && res && res.user) setRecipient(res.user);
    }).catch(e => console.warn(e));

    return () => { isSubscribed = false; };
  }, [id, activeChats]);

  const bankDetails = recipient?.privacy?.bank_details || null;
  
  const cryptoDetails = recipient?.privacy?.crypto_details || null;

  useEffect(() => {
    // typing event throttle
    if (inputText.length > 0) {
      sendTypingEvent(id as string, true);
    } else {
      sendTypingEvent(id as string, false);
    }
  }, [inputText]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true
    });

    if (!result.canceled) {
      Platform.OS !== 'web' && Haptics.notificationAsync();
      const asset = result.assets[0];
      try {
        const mimeType = asset.mimeType || 'image/jpeg';
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        // Send a temporary loading message or just await upload
        
          let uploadRes;
          if (Platform.OS === 'web' && asset.base64) {
            uploadRes = await api.uploadBase64(asset.base64, fileName, mimeType, 'chat');
          } else {
            const formDataFile = { uri: asset.uri, name: fileName, type: mimeType };
            uploadRes = await api.uploadFile(formDataFile, 'chat');
          }

        if (uploadRes.success && uploadRes.file?.url) {
          sendMessage(id as string, '', 'image', uploadRes.file?.url, replyingTo?.id);
        } else {
          alert('Failed to upload image');
        }
      } catch (err) {
        alert('Error uploading image');
      }
      setReplyingTo(null);
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      // withData removed for multipart/form-data
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      Platform.OS !== 'web' && Haptics.notificationAsync();
      const asset = result.assets[0];
      try {
        if (!asset.uri) return;
        
        let b64 = '';
        if (Platform.OS === 'web') {
           // For web, we might need to fetch the blob and convert to b64
           const res = await fetch(asset.uri);
           const blob = await res.blob();
           const reader = new FileReader();
           reader.readAsDataURL(blob);
           await new Promise((resolve) => {
             reader.onloadend = () => {
               b64 = reader.result.split(',')[1];
               resolve();
             };
           });
        } else {
           // On native, expo-file-system could read it, but let's try uploadFile since it's a generic file
           const formData = new FormData();
           formData.append('file', {
             uri: asset.uri,
             name: asset.name || 'document.pdf',
             type: asset.mimeType || 'application/octet-stream'
           } as any);
           
           const uploadRes = await api.request(`/storage/upload?type=chat`, {
             method: 'POST',
             body: formData,
             isFormData: true
           });
           
           if (uploadRes.success && uploadRes.file?.url) {
              sendMessage(id as string, asset.name, 'document', uploadRes.file?.url, replyingTo?.id, asset.name);
           }
           setReplyingTo(null);
           return;
        }
        
        if (b64) {
          const uploadRes = await api.uploadBase64(b64, asset.name || 'document', asset.mimeType || 'application/octet-stream', 'chat');
          if (uploadRes.success && uploadRes.file?.url) {
            sendMessage(id as string, asset.name, 'document', uploadRes.file?.url, replyingTo?.id, asset.name);
          }
        }
      } catch (err) {
        console.log(err);
      }
      setReplyingTo(null);
    }
  };

  const sendMoneyRequest = () => {
    if(!moneyAmount) return;
    Platform.OS !== 'web' && Haptics.notificationAsync();
    sendMessage(id as string, 'Payment Request', 'money_request', undefined, undefined, undefined, undefined, { amount: moneyAmount, currency: '৳' });
    setMoneyAmount('');
    setMoneyRequestMode(false);
  };


  const startRecording = async () => {
    try {
      Platform.OS !== 'web' && Haptics.impactAsync();
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRec);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    Platform.OS !== 'web' && Haptics.impactAsync();
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        sendMessage(id as string, '', 'audio', uri, replyingTo?.id);
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSendMessage = (scheduledFor?: Date) => {
    if (!inputText.trim()) return;
    Platform.OS !== 'web' && Haptics.impactAsync();
    sendMessage(id as string, inputText, 'text', undefined, replyingTo?.id, undefined, scheduledFor);
    setInputText('');
    setReplyingTo(null);
    setShowScheduleOptions(false);
  };

  const toggleTranslation = (msgId: string) => {
    Platform.OS !== 'web' && Haptics.selectionAsync();
    setTranslatedMessages(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const renderRightActions = (progress: any, dragX: any, item: any) => {
    const scale = dragX.interpolate({
      inputRange: [-50, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={{ width: 60, justifyContent: 'center', alignItems: 'center' }}>
        <RNAnimated.View style={{ transform: [{ scale }] }}>
          <View style={{ backgroundColor: 'rgba(0,94,184,0.1)', padding: 10, borderRadius: 20 }}>
            <Reply color="#005eb8" size={20} />
          </View>
        </RNAnimated.View>
      </View>
    );
  };

  const renderItem = ({ item: msg }: { item: any }) => {
    const isTranslated = translatedMessages[msg.id];
    
    return (
      <Swipeable
        renderRightActions={(prog, drag) => renderRightActions(prog, drag, msg)}
        onSwipeableRightOpen={() => {
          Platform.OS !== 'web' && Haptics.impactAsync();
          setReplyingTo(msg);
        }}
      >
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          layout={Layout.springify()}
          style={{
            alignSelf: msg.isSender ? 'flex-end' : 'flex-start',
            marginBottom: 16,
            maxWidth: '85%',
          }}
        >
          {msg.emoji ? (
            <AnimatedEmoji emoji={msg.text || '❤️'} />
          ) : (
            <View style={{
              backgroundColor: msg.isSender ? '#007aff' : '#ffffff',
                padding: 12,
                paddingHorizontal: 16,
                borderRadius: 22,
                borderBottomRightRadius: msg.isSender ? 4 : 22,
                borderBottomLeftRadius: msg.isSender ? 22 : 4,
                shadowColor: msg.isSender ? '#007aff' : '#000',
                shadowOpacity: msg.isSender ? 0.2 : 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: msg.isSender ? 4 : 2,
            }}>
              {msg.replyToId && (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: msg.isSender ? '#fff' : '#005eb8' }}>
                  <Text color={msg.isSender ? '#fff' : '#666'} fontSize="$2" fontWeight="bold">Replying to a message</Text>
                </View>
              )}

              {msg.type === 'image' && msg.mediaUrl && (
                <View style={{ marginBottom: 8, borderRadius: 10, overflow: 'hidden' }}>
                  <Image source={{ uri: msg.mediaUrl }} style={{ width: 200, height: 200, borderRadius: 10 }} />
                </View>
              )}
              {msg.type === 'audio' && msg.mediaUrl && (
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <Mic color={msg.isSender ? '#fff' : '#005eb8'} size={20} />
                  <Text color={msg.isSender ? '#fff' : '#005eb8'} marginLeft={8}>Voice Note</Text>
                </View>
              )}
              {msg.type === 'document' && msg.mediaUrl && (
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', padding: 10, borderRadius: 10 }}>
                  <FileText color={msg.isSender ? '#fff' : '#005eb8'} size={24} />
                  <Text color={msg.isSender ? '#fff' : '#333'} marginLeft={8} numberOfLines={1} flex={1} fontWeight="bold">
                    {msg.fileName || 'Document'}
                  </Text>
                </View>
              )}
              {msg.type === 'money_request' && msg.metadata && (
                <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, minWidth: 200, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
                  <View style={{ backgroundColor: 'rgba(0, 94, 184, 0.1)', padding: 12, borderRadius: 50, marginBottom: 8 }}>
                    <Banknote color="#005eb8" size={32} />
                  </View>
                  <Text color="#666" fontSize="$3">Payment Request</Text>
                  <Text color="#333" fontWeight="bold" fontSize="$8" marginVertical="$2">{msg.metadata.currency}{msg.metadata.amount}</Text>
                  <TouchableOpacity onPress={() => { setActivePaymentMsg(msg); setPaymentModalVisible(true); Platform.OS !== 'web' && Haptics.impactAsync(); }} style={{ backgroundColor: '#005eb8', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, width: '100%', alignItems: 'center' }}>
                    {msg.metadata?.status === 'paid' ? <Text color="white" fontWeight="bold">Paid</Text> : <Text color="white" fontWeight="bold">Pay Now</Text>}
                  </TouchableOpacity>
                </View>
              )}
                {(msg.type === 'todo_list' || msg.mediaType === 'todo_list') && msg.metadata?.tasks && (
                  <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, minWidth: 260, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
                    <XStack alignItems="center" marginBottom="$3">
                       <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: 20, marginRight: 8 }}>
                         <CheckSquare color="#3b82f6" size={20} />
                       </View>
                       <YStack flex={1}>
                         <Text color="#333" fontWeight="bold" fontSize={16}>{msg.metadata.title || 'Task List'}</Text>
                         <Text color="#666" fontSize={12}>{msg.metadata.tasks.filter((t) => t.done).length} of {msg.metadata.tasks.length} completed</Text>
                       </YStack>
                    </XStack>
                    
                    <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${(msg.metadata.tasks.filter((t) => t.done).length / (msg.metadata.tasks.length||1)) * 100}%`, backgroundColor: '#3b82f6', borderRadius: 3 }} />
                    </View>
                
                    <YStack space="$2">
                      {msg.metadata.tasks.map((task, index) => (
                        <TouchableOpacity key={task.id} onPress={() => toggleTask(msg.id, task.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                           <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: task.done ? '#3b82f6' : '#cbd5e1', backgroundColor: task.done ? '#3b82f6' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              {task.done && <Check color="#fff" size={14} strokeWidth={3} />}
                           </View>
                           <Text color={task.done ? '#94a3b8' : '#333'} style={{ textDecorationLine: task.done ? 'line-through' : 'none', flex: 1 }}>{task.title}</Text>
                             {task.price > 0 && (
                                <Text color="#10b981" fontWeight="bold" fontSize={12} style={{ marginLeft: 8 }}>${task.price}</Text>
                             )}
                        </TouchableOpacity>
                      ))}
                    </YStack>
                  </View>
                )}
              {msg.type === 'checklist' && msg.metadata && (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 12, marginBottom: 8, minWidth: 200 }}>
                  <Text fontWeight="bold" marginBottom="$2" color={msg.isSender ? '#fff' : '#333'}>{msg.text}</Text>
                  {msg.metadata.items.map((item: any) => (
                    <TouchableOpacity key={item.id} onPress={() => { Platform.OS !== 'web' && Haptics.selectionAsync(); toggleChecklistItem(id as string, msg.id, item.id); }}>
                      <XStack space="$2" alignItems="center" marginBottom="$2">
                        {item.done ? <SquareCheck color={msg.isSender ? '#fff' : '#005eb8'} size={20} /> : <Square color={msg.isSender ? 'rgba(255,255,255,0.5)' : '#999'} size={20} />}
                        <Text color={msg.isSender ? '#fff' : '#333'} textDecorationLine={item.done ? 'line-through' : 'none'}>{item.text}</Text>
                      </XStack>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {msg.type === 'text' && msg.text && !msg.emoji ? (
                <Text color={msg.isSender ? '#fff' : '#333'} fontSize="$4">
                  {isTranslated ? "*(Translated)* " + (msg.metadata?.translatedText || "Translation unavailable") : msg.text}
                </Text>
              ) : null}
              {msg.emoji ? (
                <AnimatedEmoji emoji={msg.text} />
              ) : null}
              <XStack justifyContent="flex-end" alignItems="center" marginTop="$2" space="$2">
                {msg.status === 'scheduled' && <Clock size={12} color={msg.isSender ? 'rgba(255,255,255,0.7)' : '#999'} />}
                {!msg.isSender && msg.type === 'text' && (
                  <TouchableOpacity onPress={() => toggleTranslation(msg.id)}>
                    <Languages size={16} color="#999" />
                  </TouchableOpacity>
                )}
                <Text color={msg.isSender ? 'rgba(255,255,255,0.7)' : '#999'} fontSize="$2">
                  {msg.time}
                </Text>
                {msg.isSender && (
                  msg.status === 'read' ? <CheckCheck size={14} color="#7abeff" /> : 
                  msg.status === 'delivered' ? <CheckCheck size={14} color="rgba(255,255,255,0.7)" /> :
                  <Check size={14} color="rgba(255,255,255,0.7)" />
                )}
              </XStack>
            </View>
          )}
        </Animated.View>
      </Swipeable>
    );
  };

  const renderBackground = (children: React.ReactNode) => {
    if (user?.chat_wallpaper && user.chat_wallpaper !== 'default') {
      return (
        <ImageBackground source={{ uri: user.chat_wallpaper }} style={{ flex: 1 }} resizeMode="cover">
          {children}
        </ImageBackground>
      );
    }
    return <GradientBackground paddingHorizontal="$0">{children}</GradientBackground>;
  };

  return renderBackground(
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <XStack padding="$3" paddingTop="$5" paddingBottom="$3" alignItems="center" justifyContent="space-between" backgroundColor="rgba(255,255,255,0.95)" shadowColor="#000" shadowOpacity={0.08} shadowRadius={8} shadowOffset={{ width: 0, height: 4 }} elevation={4} borderBottomWidth={1} borderBottomColor="rgba(0,0,0,0.05)">
        <XStack space="$3" alignItems="center">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/messages')} style={{ padding: 6, backgroundColor: '#f0f4f8', borderRadius: 20 }}>
            <ChevronLeft color="#333" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/profile/${id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ shadowColor: '#005eb8', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
              {(recipient?.profile_picture || recipient?.avatar) ? (
                <Image source={{ uri: (recipient?.profile_picture || recipient?.avatar || '') }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' }} onError={(e) => console.log('Image Error', e)} />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff', backgroundColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text color="#666" fontSize="$3" fontWeight="bold">{recipient?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
            </View>
            <YStack marginLeft="$3">
              <Text fontWeight="bold" fontSize="$5" color="#333">{recipient?.name || 'Unknown User'}</Text>
              <Text fontSize="$2" color={onlineUsers[id] ? '#27ae60' : '#999'} fontWeight="500">
                {onlineUsers[id] ? 'Online' : 'Offline'}
              </Text>
            </YStack>
          </TouchableOpacity>
        </XStack>
        <XStack space="$3">
            <TouchableOpacity 
              onPress={async () => {
                try {
                  const peer = { id: id as string, name: recipient?.name || 'Unknown', avatar: recipient?.profile_picture, phone: recipient?.phone_number };
                  const res = await startVoiceCall(peer, false);
                  if (res && res.call) router.push(`/call/${res.call.id}`);
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{ padding: 10, backgroundColor: 'rgba(39, 174, 96, 0.1)', borderRadius: 20 }}
            >
              <Phone color="#27ae60" size={20} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={async () => {
                try {
                  const peer = { id: id as string, name: recipient?.name || 'Unknown', avatar: recipient?.profile_picture, phone: recipient?.phone_number };
                  const res = await startVoiceCall(peer, true);
                  if (res && res.call) router.push(`/call/${res.call.id}`);
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{ padding: 10, backgroundColor: 'rgba(0, 94, 184, 0.1)', borderRadius: 20 }}
            >
              <Video color="#005eb8" size={20} />
            </TouchableOpacity>
          </XStack>
      </XStack>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        inverted // Messages load bottom to top
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => loadMoreMessages(id as string)}
        onEndReachedThreshold={0.5}
      />

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <Text fontWeight="bold" fontSize="$6">Make Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </XStack>
            
            <View style={{ backgroundColor: '#f0f8ff', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 }}>
              <Text color="#666">Amount to Pay</Text>
              <Text fontWeight="bold" fontSize="$8" color="#005eb8">{activePaymentMsg?.metadata?.currency}{activePaymentMsg?.metadata?.amount}</Text>
            </View>

            <XStack space="$2" marginBottom="$4">
              <TouchableOpacity onPress={() => setSelectedPaymentMethod('bank')} style={{ flex: 1, backgroundColor: selectedPaymentMethod === 'bank' ? '#005eb8' : '#f0f0f0', padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Building color={selectedPaymentMethod === 'bank' ? '#fff' : '#666'} size={18} style={{ marginRight: 8 }} />
                <Text color={selectedPaymentMethod === 'bank' ? '#fff' : '#666'} fontWeight="bold">US Bank</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedPaymentMethod('crypto')} style={{ flex: 1, backgroundColor: selectedPaymentMethod === 'crypto' ? '#005eb8' : '#f0f0f0', padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Wallet color={selectedPaymentMethod === 'crypto' ? '#fff' : '#666'} size={18} style={{ marginRight: 8 }} />
                <Text color={selectedPaymentMethod === 'crypto' ? '#fff' : '#666'} fontWeight="bold">Crypto</Text>
              </TouchableOpacity>
            </XStack>

            {selectedPaymentMethod === 'bank' ? (
              <View style={{ backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
                <Text color="#999" fontSize="$2" marginBottom="$2">TRANSFER DETAILS (ACH/WIRE)</Text>
                
                <YStack space="$3">
                  <View>
                    <Text color="#666" fontSize="$3">Bank Name</Text>
                    <Text fontWeight="bold" fontSize="$4">{bankDetails?.bankName || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text color="#666" fontSize="$3">Account Holder</Text>
                    <Text fontWeight="bold" fontSize="$4">{bankDetails?.accountHolder || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text color="#666" fontSize="$3">Routing Number</Text>
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold" fontSize="$4" color="#005eb8">{bankDetails?.routingNumber || 'N/A'}</Text>
                      <TouchableOpacity onPress={() => { Clipboard.setString(bankDetails?.routingNumber || ''); alert("Copied"); }}><Copy color="#999" size={16} /></TouchableOpacity>
                    </XStack>
                  </View>
                  <View>
                    <Text color="#666" fontSize="$3">Account Number</Text>
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold" fontSize="$4" color="#005eb8">{bankDetails?.accountNumber || 'N/A'}</Text>
                      <TouchableOpacity onPress={() => { Clipboard.setString(bankDetails?.accountNumber || ''); alert("Copied"); }}><Copy color="#999" size={16} /></TouchableOpacity>
                    </XStack>
                  </View>
                </YStack>
              </View>
            ) : (
              <View style={{ backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center' }}>
                <Text color="#999" fontSize="$2" marginBottom="$4">{cryptoDetails?.network || 'N/A'} WALLET ADDRESS</Text>
                
                <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eee' }}>
                  <ImageBackground 
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cryptoDetails?.walletAddress || '')}` }}
                    style={{ width: 100, height: 100 }}
                  />
                </View>
                
                <View style={{ backgroundColor: '#e6f2ff', padding: 12, borderRadius: 8, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text color="#005eb8" fontWeight="bold" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>{cryptoDetails?.walletAddress || 'N/A'}</Text>
                  <TouchableOpacity><Copy color="#005eb8" size={20} /></TouchableOpacity>
                </View>
                <Text color="#666" fontSize="$2" marginTop="$2" textAlign="center">Send only via {cryptoDetails?.network || 'N/A'} network to this address.</Text>
              </View>
            )}

            <TouchableOpacity onPress={async () => { 
                Platform.OS !== 'web' && Haptics.notificationAsync(); 
                if (activePaymentMsg) {
                  try {
                    await api.request(`/chat/messages/${activePaymentMsg.id}/mark-paid`, { method: 'POST' });
                    activePaymentMsg.metadata = { ...activePaymentMsg.metadata, status: 'paid' };
                  } catch(e) {
                    console.error('Failed to mark as paid', e);
                  }
                }
                setPaymentModalVisible(false); 
              }} style={{ backgroundColor: '#333', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' }}>
              <Text color="white" fontWeight="bold">Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {replyingTo && (
          <Animated.View entering={FadeInUp.duration(200)} style={{ backgroundColor: '#f9f9f9', padding: 12, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ borderLeftWidth: 4, borderLeftColor: '#005eb8', paddingLeft: 8 }}>
              <Text color="#005eb8" fontWeight="bold" fontSize="$3">Replying to {replyingTo.isSender ? 'Yourself' : recipient?.name || 'Contact'}</Text>
              <Text color="#666" fontSize="$3" numberOfLines={1}>{replyingTo.text || 'Media Message'}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X color="#999" size={20} />
            </TouchableOpacity>
          </Animated.View>
        )}
        {showScheduleOptions && (
          <Animated.View entering={FadeInDown} style={{ backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <Text fontWeight="bold" marginBottom={8}>Attachments</Text>
            <XStack space="$4" justifyContent="space-around" marginTop="$2">
              <TouchableOpacity onPress={() => { setMoneyRequestMode(true); setShowScheduleOptions(false); }} style={{ alignItems: 'center' }}>
                <View style={{ padding: 16, backgroundColor: 'rgba(39, 174, 96, 0.1)', borderRadius: 24, marginBottom: 8 }}>
                  <Banknote color="#27ae60" size={28} />
                </View>
                <Text fontSize={12} color="#666">Money</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => { pickDocument(); setShowScheduleOptions(false); }} style={{ alignItems: 'center' }}>
                <View style={{ padding: 16, backgroundColor: 'rgba(155, 89, 182, 0.1)', borderRadius: 24, marginBottom: 8 }}>
                  <Paperclip color="#8e44ad" size={28} />
                </View>
                <Text fontSize={12} color="#666">File</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { pickImage(); setShowScheduleOptions(false); }} style={{ alignItems: 'center' }}>
                <View style={{ padding: 16, backgroundColor: 'rgba(230, 126, 34, 0.1)', borderRadius: 24, marginBottom: 8 }}>
                  <ImageIcon color="#d35400" size={28} />
                </View>
                <Text fontSize={12} color="#666">Gallery</Text>
              </TouchableOpacity>
                
                <TouchableOpacity onPress={() => { setShowTaskModal(true); setShowScheduleOptions(false); }} style={{ alignItems: 'center' }}>
                  <View style={{ padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 24, marginBottom: 8 }}>
                    <CheckSquare color="#3b82f6" size={28} />
                  </View>
                  <Text fontSize={12} color="#666">To-Do</Text>
                </TouchableOpacity>
            </XStack>
          </Animated.View>
        )}
        
        {/* Quick Replies Menu */}
        {inputText.startsWith('/') && (
          <Animated.View entering={FadeInDown} style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', maxHeight: 200 }}>
            <ScrollView keyboardShouldPersistTaps="always">
              {quickReplies.filter((r: string) => r.toLowerCase().includes(inputText.slice(1).toLowerCase())).map((reply: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => { setInputText(reply); Platform.OS !== 'web' && Haptics.selectionAsync(); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center' }}>
                  <Zap color="#f39c12" size={16} style={{ marginRight: 8 }} />
                  <Text>{reply}</Text>
                </TouchableOpacity>
              ))}
              {inputText.length > 1 && !quickReplies.includes(inputText.slice(1)) && (
                <TouchableOpacity onPress={() => { addQuickReply(inputText.slice(1)); setInputText(inputText.slice(1)); Platform.OS !== 'web' && Haptics.notificationAsync(); }} style={{ padding: 16, backgroundColor: '#f0f8ff', flexDirection: 'row', alignItems: 'center' }}>
                  <Text color="#005eb8" fontWeight="bold">+ Save "{inputText.slice(1)}" as new Quick Reply</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
        )}
        {moneyRequestMode && (
          <Animated.View entering={FadeInDown} style={{ backgroundColor: '#f0f8ff', padding: 16, borderTopWidth: 1, borderTopColor: '#cce0ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text fontWeight="bold" color="#005eb8">Request Amount (৳):</Text>
            <XStack space="$2" alignItems="center" flex={1} marginLeft="$3">
              <TextInput value={moneyAmount} onChangeText={setMoneyAmount} keyboardType="numeric" placeholder="0.00" style={{ flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#005eb8', fontSize: 16 }} />
              <TouchableOpacity onPress={sendMoneyRequest} style={{ backgroundColor: '#005eb8', padding: 10, borderRadius: 8 }}>
                <Send color="#fff" size={18} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMoneyRequestMode(false)}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </XStack>
          </Animated.View>
        )}
        {/* Toolbar & Input Box */}
        <XStack padding="$3" paddingBottom="$5" backgroundColor="#fff" alignItems="flex-end" space="$2" shadowColor="#000" shadowOpacity={0.05} shadowRadius={10} elevation={10}>
          <TouchableOpacity onPress={() => setShowScheduleOptions(!showScheduleOptions)}>
            <View style={{ padding: 10, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: showScheduleOptions ? 'rgba(0,0,0,0.05)' : 'transparent' }}>
              <PlusCircle color="#888" size={28} />
            </View>
          </TouchableOpacity>
          
          <View style={{ flex: 1, backgroundColor: '#f4f7fb', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, minHeight: 44, maxHeight: 120, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e1e8f0' }}>
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
                onFocus={() => setIsEmojiPickerOpen(false)}
              placeholder="Message..."
              placeholderTextColor="#999"
              style={{ fontSize: 16, color: '#333', flex: 1, maxHeight: 100 }}
            />
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setIsEmojiPickerOpen(true); }} style={{ marginLeft: 8 }}>
              <Smile color={isEmojiPickerOpen ? "#005eb8" : "#aaa"} size={24} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => inputText.trim() ? handleSendMessage() : null}
            onPressIn={() => !inputText.trim() ? startRecording() : null}
            onPressOut={() => !inputText.trim() ? stopRecording() : null}
          >
            <Animated.View entering={FadeInUp} style={{ padding: 14, backgroundColor: inputText.trim() ? '#007aff' : isRecording ? '#ef4444' : '#f1f5f9', borderRadius: 25, transform: [{ scale: isRecording ? 1.25 : 1 }], shadowColor: inputText.trim() ? '#007aff' : isRecording ? '#ef4444' : 'transparent', shadowOpacity: 0.4, shadowRadius: 10, elevation: (inputText.trim() || isRecording) ? 5 : 0 }}>
              {inputText.trim() ? (
                <Send color="white" size={20} />
              ) : (
                <Mic color="#888" size={20} />
              )}
            </Animated.View>
            </TouchableOpacity>
          </XStack>
      </KeyboardAvoidingView>
      <EmojiPicker 
          open={isEmojiPickerOpen} 
          onClose={() => setIsEmojiPickerOpen(false)} 
          onEmojiSelected={(emojiObject) => setInputText(prev => prev + emojiObject.emoji)} 
          enableSearchBar={true}
        />
      
      {/* Task Creator Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Text fontSize={20} fontWeight="bold">Create To-Do List</Text>
                <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                  <Text color="#666" fontSize={24}>X</Text>
                </TouchableOpacity>
              </XStack>
              
              <TextInput 
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="List Title (e.g. Website Features)"
                style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 12, marginBottom: 16, fontWeight: 'bold' }}
              />
              
              <ScrollView style={{ maxHeight: 300 }}>
                {taskInputs.map((t, i) => (
                  <XStack key={i} alignItems="center" marginBottom="$3">
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', marginRight: 12 }} />
                    <TextInput 
                      value={typeof t === 'string' ? t : t.title}
                      onChangeText={(val) => {
                        const newInputs = [...taskInputs];
                        newInputs[i] = typeof t === 'string' ? { title: val, price: '' } : { ...t, title: val };
                        if (i === taskInputs.length - 1 && val !== '') {
                          newInputs.push('');
                        }
                        setTaskInputs(newInputs);
                      }}
                      placeholder="Add a task..."
                      style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 }}
                    />
                    <TextInput 
                      value={typeof t === 'string' ? '' : t.price}
                      onChangeText={(val) => {
                        const newInputs = [...taskInputs];
                        if (typeof t === 'string') {
                            newInputs[i] = { title: t, price: val };
                        } else {
                            newInputs[i] = { ...t, price: val };
                        }
                        setTaskInputs(newInputs);
                      }}
                      placeholder="$0.00"
                      keyboardType="numeric"
                      style={{ width: 60, marginLeft: 10, backgroundColor: '#f0f4f8', padding: 8, borderRadius: 8, textAlign: 'center' }}
                    />
                  </XStack>
                ))}
              </ScrollView>
              
              <TouchableOpacity onPress={sendTaskList} style={{ backgroundColor: '#005eb8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
                <Text color="#fff" fontWeight="bold">Send List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      </SafeAreaView>
  );
}
