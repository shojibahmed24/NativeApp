// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ImageBackground, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Animated as RNAnimated, ScrollView, Modal, Clipboard,  } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { YStack, XStack, Text, Avatar, Spinner } from 'tamagui';
import { ChevronLeft, Phone, Video, Send, Mic, Image as ImageIcon, Smile, Check, CheckCheck, Reply, Languages, X, Paperclip, Clock, FileText, Banknote, CheckSquare, Zap, SquareCheck, Square, Building, Wallet, Copy, QrCode, PlusCircle, Play , CheckCircle2, AlertCircle, Info, DollarSign, ListChecks } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '../../src/components/ThemeComponents';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedEmoji from '../../src/components/AnimatedEmoji';
import ReactionPicker from '../../src/components/ReactionPicker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, Layout, useSharedValue, useAnimatedStyle, withTiming, FadeOutDown } from 'react-native-reanimated';
import { useChat } from '../../src/context/ChatContext';
import { useAuth } from '../../src/context/AuthContext';
import { useCall } from '../../src/context/CallContext';
import { supabase } from '../../src/services/supabase';
import { AudioRecorder, requestRecordingPermissionsAsync, setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Swipeable } from 'react-native-gesture-handler';
import EmojiPicker from '../../src/components/EmojiPickerWrapper';
import { Keyboard, Pressable } from 'react-native';
import { api } from '../../src/services/api';
import { TOKENS } from '../../src/theme/tokens';
import { useThemeContext } from '../../src/context/ThemeContext';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScaleButton = ({ onPress, children, style, ...props }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
        scale.value = withTiming(0.92, { duration: 100 });
      }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
      onPress={onPress}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};


const MessageBubble = React.memo(({ msg, isTranslated, translatedMessages, renderRightActions, setReplyingTo, setActivePaymentMsg, setPaymentModalVisible, toggleChecklistItem, toggleTranslation, id, isDark }: any) => {
    
    return (
      <Swipeable
        renderRightActions={(p, d) => renderRightActions(p, d, msg)}
        onSwipeableOpen={() => {
          Platform.OS !== 'web' && Haptics.impactAsync();
          setReplyingTo(msg);
        }}
      >
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          
          style={{
            alignSelf: msg.isSender ? 'flex-end' : 'flex-start',
            marginBottom: 16,
            maxWidth: '85%',
          }}
        >
          {msg.emoji ? (
            <AnimatedEmoji emoji={msg.text || '❤️'} size={50} />
          ) : (
            <View style={{
              shadowColor: msg.isSender ? '#4f46e5' : (isDark ? '#000' : '#0f172a'),
              shadowOpacity: msg.isSender ? 0.3 : 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: Platform.OS === 'web' ? (msg.isSender ? 2 : 1) : 0,
              borderRadius: TOKENS.RADIUS.LG,
              borderBottomRightRadius: msg.isSender ? 4 : 24,
              borderBottomLeftRadius: msg.isSender ? 24 : 4,
              backgroundColor: msg.isSender ? '#6366f1' : (isDark ? '#1e293b' : '#f8fafc'),
            }}>
              <View style={{
                backgroundColor: msg.isSender ? '#6366f1' : (isDark ? '#1e293b' : '#f8fafc'),
                padding: 12,
                paddingHorizontal: 16,
                borderRadius: TOKENS.RADIUS.LG,
                borderBottomRightRadius: msg.isSender ? 4 : 24,
                borderBottomLeftRadius: msg.isSender ? 24 : 4,
                overflow: 'hidden'
              }}>
                {msg.isSender && <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:1, y:1}} end={{x:0, y:0}} style={StyleSheet.absoluteFill} />}
                
                {msg.replyToId && (
                  <View style={{ backgroundColor: msg.isSender ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)', padding: 10, borderRadius: TOKENS.RADIUS.MD, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: msg.isSender ? '#fff' : '#6366f1' }}>
                    <Text color={msg.isSender ? 'rgba(255,255,255,0.8)' : '#6366f1'} fontSize="$2" fontWeight="800" marginBottom={2}>Replying to message</Text>
                    <Text color={msg.isSender ? '#fff' : '#334155'} fontSize="$3" numberOfLines={1}>Tap to view previous context...</Text>
                  </View>
                )}

                {msg.type === 'image' && msg.mediaUrl && (
                  <View style={{ marginBottom: 10, borderRadius: TOKENS.RADIUS.MD, ...TOKENS.SHADOWS.ELEVATED }}>
                    <Image contentFit="cover" cachePolicy="memory-disk" transition={200} source={{ uri: msg.mediaUrl }} style={{ width: 260, height: undefined, aspectRatio: 4/3, borderRadius: TOKENS.RADIUS.MD }} />
                  </View>
                )}
                {msg.type === 'audio' && msg.mediaUrl && (
                  <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: msg.isSender ? 'rgba(255,255,255,0.2)' : '#eef2ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: TOKENS.RADIUS.XL }}>
                    <TouchableOpacity 
                      onPress={async () => {
                        try {
                          const player = createAudioPlayer(msg.mediaUrl);
                          player.play();
                          player.addListener('playbackStatusUpdate', (status) => {
                            if (status.didJustFinish) { player.release(); }
                          });
                        } catch (e) { console.log('Audio play error:', e); }
                      }}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: msg.isSender ? '#fff' : '#6366f1', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Play color={msg.isSender ? '#6366f1' : '#fff'} size={18} />
                    </TouchableOpacity>
                    <XStack space="$1" alignItems="center">
                      {[12, 18, 10, 24, 14, 20, 16, 10, 18].map((h, i) => (
                        <View key={i} style={{ width: 3, height: h, backgroundColor: msg.isSender ? 'rgba(255,255,255,0.8)' : '#6366f1', borderRadius: 2 }} />
                      ))}
                    </XStack>
                    <Text color={msg.isSender ? '#fff' : '#6366f1'} marginLeft={12} fontSize={12} fontWeight="700">{msg.metadata?.duration ? `${Math.floor(msg.metadata.duration / 60)}:${String(msg.metadata.duration % 60).padStart(2, '0')}` : '0:00'}</Text>
                  </View>
                )}
                {msg.type === 'document' && msg.mediaUrl && (
                  <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: msg.isSender ? 'rgba(255,255,255,0.2)' : 'rgba(59,130,246,0.1)', padding: 12, borderRadius: TOKENS.RADIUS.MD }}>
                    <View style={{ padding: 10, borderRadius: TOKENS.RADIUS.MD, backgroundColor: msg.isSender ? '#fff' : '#3b82f6', marginRight: 12 }}>
                      <FileText color={msg.isSender ? '#3b82f6' : '#fff'} size={20} />
                    </View>
                    <YStack flex={1}>
                      <Text color={msg.isSender ? '#fff' : (isDark ? '#f8fafc' : '#0f172a')} numberOfLines={1} fontWeight="bold">{msg.fileName || 'Document'}</Text>
                      <Text color={msg.isSender ? 'rgba(255,255,255,0.8)' : '#64748b'} fontSize={12} marginTop={2}>FILE ATTACHMENT</Text>
                    </YStack>
                  </View>
                )}
                {msg.type === 'money_request' && msg.metadata && (
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: TOKENS.RADIUS.LG, minWidth: 220, marginBottom: 10, ...TOKENS.SHADOWS.ELEVATED, overflow: 'hidden' }}>
                    <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <View style={{ padding: 14, borderRadius: TOKENS.RADIUS.XL, marginBottom: 12, overflow: 'hidden' }}>
                        <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
                        <Banknote color="#fff" size={28} />
                      </View>
                      <Text color={TOKENS.COLORS.SUCCESS} fontSize="$3" fontWeight="700">Payment Request</Text>
                      <Text color="#064e3b" fontWeight="900" fontSize="$8" marginVertical="$2">{msg.metadata.currency}{msg.metadata.amount}</Text>
                      
                      {msg.metadata?.status === 'paid' ? (
                         <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 24, borderRadius: TOKENS.RADIUS.LG, width: '100%', justifyContent: 'center' }}>
                           <Check color="#fff" size={20} strokeWidth={3} style={{ marginRight: 8 }} />
                           <Text color="white" fontWeight="bold">Paid</Text>
                         </View>
                      ) : (
                         <ScaleButton onPress={() => { setActivePaymentMsg(msg); setPaymentModalVisible(true); Platform.OS !== 'web' && Haptics.impactAsync(); }} style={{ width: '100%', overflow: 'hidden', borderRadius: TOKENS.RADIUS.LG }}>
                           <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
                           <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                             <Text color="white" fontWeight="bold" fontSize={16}>Pay Now</Text>
                           </View>
                         </ScaleButton>
                      )}
                    </View>
                  </View>
                )}
                  {(msg.type === 'todo_list' || msg.mediaType === 'todo_list') && msg.metadata?.tasks && (
                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: TOKENS.RADIUS.LG, minWidth: 260, marginBottom: 10, ...TOKENS.SHADOWS.ELEVATED, overflow: 'hidden' }}>
                      <View style={{ padding: 16 }}>
                        <XStack alignItems="center" marginBottom="$4">
                           <View style={{ width: 40, height: 40, borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                             <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />
                             <CheckSquare color="#fff" size={20} />
                           </View>
                           <YStack flex={1}>
                             <Text color={TOKENS.COLORS.TEXT_PRIMARY} fontWeight="800" fontSize={16}>{msg.metadata.title || 'Task List'}</Text>
                             <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize={12} fontWeight="600">{msg.metadata.tasks.filter((t: any) => t.done).length} of {msg.metadata.tasks.length} completed</Text>
                           </YStack>
                        </XStack>
                        
                        <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
                          <View style={{ height: '100%', width: `${(msg.metadata.tasks.filter((t: any) => t.done).length / (msg.metadata.tasks.length||1)) * 100}%`, borderRadius: 4 }}>
                             <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFill} />
                          </View>
                        </View>
                    
                        <YStack space="$3">
                          {msg.metadata.tasks.map((task: any) => (
                            <ScaleButton key={task.id} onPress={() => toggleTask(msg.id, task.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                               <View style={{ width: 24, height: 24, borderRadius: TOKENS.RADIUS.SM, borderWidth: 2, borderColor: task.done ? '#6366f1' : '#cbd5e1', backgroundColor: task.done ? '#6366f1' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                  {task.done && <Check color="#fff" size={14} strokeWidth={3.5} />}
                               </View>
                               <Text color={task.done ? '#94a3b8' : (isDark ? '#f8fafc' : '#0f172a')} fontWeight={task.done ? "500" : "600"} style={{ textDecorationLine: task.done ? 'line-through' : 'none', flex: 1 }}>{task.title}</Text>
                                 {task.price > 0 && (
                                    <Text color={TOKENS.COLORS.SUCCESS} fontWeight="800" fontSize={13} style={{ marginLeft: 8 }}>${task.price}</Text>
                                 )}
                            </ScaleButton>
                          ))}
                        </YStack>
                      </View>
                    </View>
                  )}
                {msg.type === 'checklist' && msg.metadata && (
                  <View style={{ backgroundColor: msg.isSender ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)', padding: 14, borderRadius: TOKENS.RADIUS.MD, marginBottom: 10, minWidth: 200 }}>
                    <Text fontWeight="800" marginBottom="$3" color={msg.isSender ? '#fff' : (isDark ? '#f8fafc' : '#0f172a')}>{msg.text}</Text>
                    {msg.metadata.items.map((item: any) => (
                      <ScaleButton key={item.id} onPress={() => { toggleChecklistItem(id as string, msg.id, item.id); }} style={{ paddingVertical: 4 }}>
                        <XStack space="$3" alignItems="center" marginBottom="$2">
                          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: item.done ? (msg.isSender ? '#fff' : '#6366f1') : (msg.isSender ? 'rgba(255,255,255,0.5)' : '#cbd5e1'), backgroundColor: item.done ? (msg.isSender ? '#fff' : '#6366f1') : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                            {item.done && <Check color={msg.isSender ? '#6366f1' : '#fff'} size={12} strokeWidth={4} />}
                          </View>
                          <Text color={msg.isSender ? (item.done ? 'rgba(255,255,255,0.6)' : '#fff') : (item.done ? '#94a3b8' : '#334155')} fontWeight={item.done ? "500" : "600"} textDecorationLine={item.done ? 'line-through' : 'none'}>{item.text}</Text>
                        </XStack>
                      </ScaleButton>
                    ))}
                  </View>
                )}
                {msg.type === 'text' && msg.text && !msg.emoji ? (
                  <Text color={msg.isSender ? '#fff' : (isDark ? '#f8fafc' : '#1e293b')} fontSize="$4" fontWeight="500" lineHeight={22}>
                    {isTranslated ? "*(Translated)* " + (msg.metadata?.translatedText || "Translation unavailable") : msg.text}
                  </Text>
                ) : null}
                <XStack justifyContent="flex-end" alignItems="center" marginTop="$2" space="$2">
                  {msg.status === 'scheduled' && <Clock size={12} color={msg.isSender ? 'rgba(255,255,255,0.7)' : '#999'} />}
                  {!msg.isSender && msg.type === 'text' && (
                    <ScaleButton onPress={() => toggleTranslation(msg.id)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' }}>
                      <Languages size={14} color="#6366f1" />
                    </ScaleButton>
                  )}
                  <Text color={msg.isSender ? 'rgba(255,255,255,0.7)' : '#94a3b8'} fontSize="$2" fontWeight="600">
                    {msg.time}
                  </Text>
                  {msg.isSender && (
                    msg.status === 'read' ? <CheckCheck size={16} color="#38bdf8" /> : 
                    msg.status === 'delivered' ? <CheckCheck size={16} color="rgba(255,255,255,0.6)" /> :
                    <Check size={16} color="rgba(255,255,255,0.6)" />
                  )}
                </XStack>
              </View>
            </View>
          )}
        </Animated.View>
      </Swipeable>
    );
  });

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { messages, sendMessage, isTyping, onlineUsers, loadMoreMessages, sendTypingEvent, quickReplies, addQuickReply, toggleChecklistItem, fetchRealMessages, markMessagesAsRead, deleteMessage, updateMessageLocally } = useChat();
  const { startVoiceCall } = useCall();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
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
  const [recording, setRecording] = useState<AudioRecorder | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
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
  
  const flatListRef = useRef<FlashList<any>>(null);
  const [copiedRouting, setCopiedRouting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedCrypto, setCopiedCrypto] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

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
      await requestRecordingPermissionsAsync();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const newRec = new AudioRecorder({ sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 });
      await newRec.prepareToRecordAsync();
      newRec.record();
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
      recording.stop();
      const uri = recording.uri;
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

  const renderRightActions = (progress, dragX, item) => {
    return (
      <View style={{ width: 80, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: TOKENS.RADIUS.LG, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' }}>
          <Reply color="#4f46e5" size={22} />
        </View>
      </View>
    );
  };

  
  const renderItem = React.useCallback(({ item: msg }: { item: any }) => {
    return (
      <MessageBubble
        msg={msg}
        isTranslated={translatedMessages[msg.id]}
        translatedMessages={translatedMessages}
        renderRightActions={renderRightActions}
        setReplyingTo={setReplyingTo}
        setActivePaymentMsg={setActivePaymentMsg}
        setPaymentModalVisible={setPaymentModalVisible}
        toggleChecklistItem={toggleChecklistItem}
        toggleTranslation={toggleTranslation}
        id={id}
        isDark={isDark}
      />
    );
  }, [translatedMessages, renderRightActions, id, setReplyingTo, setActivePaymentMsg, setPaymentModalVisible, toggleChecklistItem, toggleTranslation, isDark]);

  const renderBackground = (children: React.ReactNode) => {
    return (
      <GradientBackground style={{ flex: 1 }}>
        {children}
      </GradientBackground>
    );
  };

  return renderBackground(
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={{ backgroundColor: 'transparent', zIndex: 10 }}>
        <LinearGradient colors={isDark ? ['rgba(30,41,59,0.85)', 'rgba(30,41,59,0.75)'] : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.92)']} style={StyleSheet.absoluteFill} />
        <XStack padding="$3" paddingTop="$5" paddingBottom="$3" alignItems="center" justifyContent="space-between" shadowColor="#0f172a" shadowOpacity={0.12} shadowRadius={12} shadowOffset={{ width: 0, height: 6 }} elevation={8} borderBottomWidth={1} borderBottomColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}>
          <XStack space="$3" alignItems="center">
            <ScaleButton onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/messages')} style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: TOKENS.RADIUS.LG, justifyContent: 'center', alignItems: 'center', ...TOKENS.SHADOWS.SUBTLE }}>
              <ChevronLeft color={isDark ? '#f8fafc' : '#334155'} size={24} />
            </ScaleButton>
            <TouchableOpacity onPress={() => router.push(`/profile/${id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <View style={{ padding: 2, borderRadius: TOKENS.RADIUS.LG, backgroundColor: isDark ? '#1e293b' : '#ffffff', ...TOKENS.SHADOWS.ELEVATED }}>
                  {(recipient?.profile_picture || recipient?.avatar) ? (
                    <Image contentFit="cover" cachePolicy="memory-disk" transition={200} source={{ uri: (recipient?.profile_picture || recipient?.avatar || '') }} style={{ width: 44, height: 44, borderRadius: TOKENS.RADIUS.LG }} onError={(e) => console.log('Image Error', e)} />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: TOKENS.RADIUS.LG, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                      <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$4" fontWeight="bold">{recipient?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                    </View>
                  )}
                </View>
                {onlineUsers[id as string] && (
                  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff', shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4, elevation: Platform.OS === 'web' ? 2 : 0 }} />
                )}
              </View>
              <YStack marginLeft="$3">
                <Text fontWeight="bold" fontSize="$5" color={isDark ? '#f8fafc' : TOKENS.COLORS.TEXT_PRIMARY}>{recipient?.name || 'Unknown User'}</Text>
                <XStack alignItems="center" space="$1.5" marginTop={2}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: onlineUsers[id as string] ? '#10b981' : '#94a3b8' }} />
                  <Text fontSize="$2" color={onlineUsers[id as string] ? '#059669' : '#64748b'} fontWeight="600">
                    {onlineUsers[id as string] ? (isTyping[id as string] ? 'Typing...' : 'Online') : 'Offline'}
                  </Text>
                </XStack>
              </YStack>
            </TouchableOpacity>
          </XStack>
          <XStack space="$2.5">
              <ScaleButton 
                onPress={async () => {
                  try {
                    const peer = { id: id as string, name: recipient?.name || 'Unknown', avatar: recipient?.profile_picture, phone: recipient?.phone_number };
                    const res = await startVoiceCall(peer, false);
                    if (res && res.call) router.push(`/call/${res.call.id}`);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#10b981', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: Platform.OS === 'web' ? 4 : 0 }}
              >
                <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
                <Phone color="#fff" size={18} />
              </ScaleButton>
              <ScaleButton 
                onPress={async () => {
                  try {
                    const peer = { id: id as string, name: recipient?.name || 'Unknown', avatar: recipient?.profile_picture, phone: recipient?.phone_number };
                    const res = await startVoiceCall(peer, true);
                    if (res && res.call) router.push(`/call/${res.call.id}`);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#6366f1', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: Platform.OS === 'web' ? 4 : 0 }}
              >
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />
                <Video color="#fff" size={18} />
              </ScaleButton>
            </XStack>
        </XStack>
      </View>

      {/* Messages */}
      <FlashList
        estimatedItemSize={100}
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
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <Animated.View entering={FadeInDown.duration(200)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <Animated.View entering={FadeInDown.springify().damping(15).delay(100)} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderTopLeftRadius: TOKENS.RADIUS.XL, borderTopRightRadius: TOKENS.RADIUS.XL, padding: 20, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
            {/* Drag Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <XStack alignItems="center" space="$2">
                <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                  <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
                  <Banknote color="#fff" size={16} />
                </View>
                <Text fontWeight="800" fontSize="$6" color={TOKENS.COLORS.TEXT_PRIMARY}>Make Payment</Text>
              </XStack>
              <ScaleButton onPress={() => setPaymentModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                <X color={TOKENS.COLORS.TEXT_SECONDARY} size={18} />
              </ScaleButton>
            </XStack>
            
            <View style={{ overflow: 'hidden', padding: 20, borderRadius: TOKENS.RADIUS.LG, alignItems: 'center', marginBottom: 20, ...TOKENS.SHADOWS.SUBTLE }}>
              <LinearGradient colors={['#ecfdf5', '#ccfbf1']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
              <Text color={TOKENS.COLORS.SUCCESS} fontWeight="600" fontSize="$3" marginBottom={4}>Requested Amount</Text>
              <Text fontWeight="900" fontSize={42} color={TOKENS.COLORS.SUCCESS} letterSpacing={-1}>{activePaymentMsg?.metadata?.currency}{activePaymentMsg?.metadata?.amount}</Text>
            </View>

            <XStack space="$2" marginBottom="$4" padding={4} backgroundColor="#f8fafc" borderRadius={TOKENS.RADIUS.MD}>
              <Pressable onPress={() => setSelectedPaymentMethod('bank')} style={{ flex: 1 }}>
                <View style={{ backgroundColor: selectedPaymentMethod === 'bank' ? 'transparent' : 'transparent', padding: 12, borderRadius: TOKENS.RADIUS.SM, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden', ...(selectedPaymentMethod === 'bank' ? TOKENS.SHADOWS.COLORED(TOKENS.COLORS.BRAND) : {}) }}>
                  {selectedPaymentMethod === 'bank' && <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />}
                  <Building color={selectedPaymentMethod === 'bank' ? '#fff' : TOKENS.COLORS.TEXT_SECONDARY} size={18} style={{ marginRight: 8 }} />
                  <Text color={selectedPaymentMethod === 'bank' ? '#fff' : TOKENS.COLORS.TEXT_SECONDARY} fontWeight="bold">US Bank</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => setSelectedPaymentMethod('crypto')} style={{ flex: 1 }}>
                <View style={{ backgroundColor: selectedPaymentMethod === 'crypto' ? 'transparent' : 'transparent', padding: 12, borderRadius: TOKENS.RADIUS.SM, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden', ...(selectedPaymentMethod === 'crypto' ? TOKENS.SHADOWS.COLORED(TOKENS.COLORS.BRAND) : {}) }}>
                  {selectedPaymentMethod === 'crypto' && <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />}
                  <Wallet color={selectedPaymentMethod === 'crypto' ? '#fff' : TOKENS.COLORS.TEXT_SECONDARY} size={18} style={{ marginRight: 8 }} />
                  <Text color={selectedPaymentMethod === 'crypto' ? '#fff' : TOKENS.COLORS.TEXT_SECONDARY} fontWeight="bold">Crypto</Text>
                </View>
              </Pressable>
            </XStack>

            {selectedPaymentMethod === 'bank' ? (
              <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: 16, borderRadius: TOKENS.RADIUS.MD, borderWidth: 1, borderColor: '#f1f5f9', ...TOKENS.SHADOWS.SUBTLE }}>
                <LinearGradient colors={['#ffffff', '#f8fafc']} style={StyleSheet.absoluteFill} />
                <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontWeight="700" fontSize="$2" marginBottom="$4" letterSpacing={0.5}>TRANSFER DETAILS (ACH/WIRE)</Text>
                
                <YStack space="$4">
                  <View>
                    <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$3" marginBottom={4}>Bank Name</Text>
                    <Text fontWeight="700" fontSize="$4" color={TOKENS.COLORS.TEXT_PRIMARY}>{bankDetails?.bankName || 'N/A'}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }} />
                  <View>
                    <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$3" marginBottom={4}>Account Holder</Text>
                    <Text fontWeight="700" fontSize="$4" color={TOKENS.COLORS.TEXT_PRIMARY}>{bankDetails?.accountHolder || 'N/A'}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }} />
                  <View>
                    <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$3" marginBottom={4}>Routing Number</Text>
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="700" fontSize="$5" color={TOKENS.COLORS.BRAND}>{bankDetails?.routingNumber || 'N/A'}</Text>
                      <ScaleButton onPress={() => { Clipboard.setString(bankDetails?.routingNumber || ''); Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setCopiedRouting(true); setTimeout(() => setCopiedRouting(false), 1500); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                        {copiedRouting ? <CheckCircle2 color={TOKENS.COLORS.SUCCESS} size={16} /> : <Copy color={TOKENS.COLORS.BRAND} size={16} />}
                      </ScaleButton>
                    </XStack>
                  </View>
                  <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }} />
                  <View>
                    <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$3" marginBottom={4}>Account Number</Text>
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="700" fontSize="$5" color={TOKENS.COLORS.BRAND}>{bankDetails?.accountNumber || 'N/A'}</Text>
                      <ScaleButton onPress={() => { Clipboard.setString(bankDetails?.accountNumber || ''); Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setCopiedAccount(true); setTimeout(() => setCopiedAccount(false), 1500); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                        {copiedAccount ? <CheckCircle2 color={TOKENS.COLORS.SUCCESS} size={16} /> : <Copy color={TOKENS.COLORS.BRAND} size={16} />}
                      </ScaleButton>
                    </XStack>
                  </View>
                </YStack>
              </View>
            ) : (
              <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: 16, borderRadius: TOKENS.RADIUS.MD, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', ...TOKENS.SHADOWS.SUBTLE }}>
                <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontWeight="700" fontSize="$2" marginBottom="$4" letterSpacing={0.5}>{cryptoDetails?.network?.toUpperCase() || 'N/A'} WALLET ADDRESS</Text>
                
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: 16, borderRadius: TOKENS.RADIUS.LG, marginBottom: 20, borderWidth: 2, borderColor: '#f1f5f9', ...TOKENS.SHADOWS.ELEVATED }}>
                  <Image contentFit="cover" cachePolicy="memory-disk" transition={200}Background 
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cryptoDetails?.walletAddress || '')}` }}
                    style={{ width: 120, height: 120 }}
                  />
                </View>
                
                <View style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', padding: 12, paddingLeft: 16, borderRadius: TOKENS.RADIUS.MD, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#475569' : '#e2e8f0', borderLeftWidth: 4, borderLeftColor: TOKENS.COLORS.BRAND, ...TOKENS.SHADOWS.SUBTLE, marginBottom: 12 }}>
                  <Text color={TOKENS.COLORS.TEXT_PRIMARY} fontWeight="600" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>{cryptoDetails?.walletAddress || 'N/A'}</Text>
                  <ScaleButton onPress={() => { Clipboard.setString(cryptoDetails?.walletAddress || ''); Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setCopiedCrypto(true); setTimeout(() => setCopiedCrypto(false), 1500); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                    {copiedCrypto ? <CheckCircle2 color={TOKENS.COLORS.SUCCESS} size={18} /> : <Copy color={TOKENS.COLORS.BRAND} size={18} />}
                  </ScaleButton>
                </View>
                <XStack space="$2" alignItems="center">
                  <AlertCircle color={TOKENS.COLORS.WARNING} size={14} />
                  <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$2" textAlign="center">Send only via {cryptoDetails?.network || 'N/A'} network to this address.</Text>
                </XStack>
              </View>
            )}

            <ScaleButton disabled={isPaid} onPress={async () => { 
                Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
                setIsPaid(true);
                if (activePaymentMsg) {
                  try {
                    await api.request(`/chat/messages/${activePaymentMsg.id}/mark-paid`, { method: 'POST' });
                    activePaymentMsg.metadata = { ...activePaymentMsg.metadata, status: 'paid' };
                  } catch(e) {
                    console.error('Failed to mark as paid', e);
                  }
                }
                setTimeout(() => { setPaymentModalVisible(false); setIsPaid(false); }, 600); 
              }} style={{ width: '100%', overflow: 'hidden', padding: 16, borderRadius: TOKENS.RADIUS.MD, marginTop: 24, alignItems: 'center', ...TOKENS.SHADOWS.COLORED(TOKENS.COLORS.SUCCESS) }}>
              <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
              <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale: isPaid ? 1.1 : 1 }] }}>
                <CheckCircle2 color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text color="white" fontWeight="bold" fontSize="$4">{isPaid ? 'Paid ✓' : 'Mark as Paid'}</Text>
              </Animated.View>
            </ScaleButton>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {replyingTo && (
          <Animated.View entering={FadeInUp.duration(200)} style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <LinearGradient colors={TOKENS.GRADIENTS.SCREEN_BG} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
            <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                <View style={{ width: 4, height: '100%', minHeight: 32, backgroundColor: '#6366f1', borderRadius: 4, marginRight: 10 }} />
                <View flex={1}>
                  <Text color="#4f46e5" fontWeight="800" fontSize="$2" marginBottom={2}>Replying to {replyingTo.isSender ? 'Yourself' : recipient?.name || 'Contact'}</Text>
                  <Text color={TOKENS.COLORS.TEXT_SECONDARY} fontSize="$3" numberOfLines={1}>{replyingTo.text || 'Media Message'}</Text>
                </View>
              </View>
              <ScaleButton onPress={() => setReplyingTo(null)} style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: TOKENS.RADIUS.MD, marginLeft: 8 }}>
                <X color={TOKENS.COLORS.TEXT_SECONDARY} size={18} />
              </ScaleButton>
            </View>
          </Animated.View>
        )}
        {showScheduleOptions && (
          <Animated.View entering={FadeInDown.springify().damping(20)} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 16 }}>
            <Text fontWeight="800" marginBottom={16} color={TOKENS.COLORS.TEXT_PRIMARY} fontSize={16}>Attachments</Text>
            <XStack space="$4" justifyContent="space-around" marginTop="$2">
              <ScaleButton onPress={() => { setMoneyRequestMode(true); setShowScheduleOptions(false); Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ alignItems: 'center' }}>
                <Animated.View entering={FadeInDown.delay(0).springify()} style={{ padding: 16, borderRadius: TOKENS.RADIUS.LG, marginBottom: 8, overflow: 'hidden', ...TOKENS.SHADOWS.COLORED(TOKENS.COLORS.SUCCESS) }}>
                  <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
                  <Banknote color="#fff" size={26} />
                </Animated.View>
                <Text fontSize={13} color={TOKENS.COLORS.TEXT_SECONDARY} fontWeight="600">Money</Text>
              </ScaleButton>
              
              <ScaleButton onPress={() => { pickDocument(); setShowScheduleOptions(false); Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ alignItems: 'center' }}>
                <Animated.View entering={FadeInDown.delay(40).springify()} style={{ padding: 16, borderRadius: TOKENS.RADIUS.LG, marginBottom: 8, overflow: 'hidden', ...TOKENS.SHADOWS.COLORED(TOKENS.COLORS.BRAND) }}>
                  <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />
                  <Paperclip color="#fff" size={26} />
                </Animated.View>
                <Text fontSize={13} color={TOKENS.COLORS.TEXT_SECONDARY} fontWeight="600">File</Text>
              </ScaleButton>
              
              <ScaleButton onPress={() => { pickImage(); setShowScheduleOptions(false); Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ alignItems: 'center' }}>
                <Animated.View entering={FadeInDown.delay(80).springify()} style={{ padding: 16, borderRadius: TOKENS.RADIUS.LG, marginBottom: 8, overflow: 'hidden', ...TOKENS.SHADOWS.COLORED(TOKENS.COLORS.WARNING) }}>
                  <LinearGradient colors={TOKENS.GRADIENTS.GOLD} style={StyleSheet.absoluteFill} />
                  <ImageIcon color="#fff" size={26}  contentFit="cover" cachePolicy="memory-disk" transition={200} />
                </Animated.View>
                <Text fontSize={13} color={TOKENS.COLORS.TEXT_SECONDARY} fontWeight="600">Gallery</Text>
              </ScaleButton>
                
              <ScaleButton onPress={() => { setShowTaskModal(true); setShowScheduleOptions(false); Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ alignItems: 'center' }}>
                <Animated.View entering={FadeInDown.delay(120).springify()} style={{ padding: 16, borderRadius: TOKENS.RADIUS.LG, marginBottom: 8, overflow: 'hidden', ...TOKENS.SHADOWS.COLORED('#8b5cf6') }}>
                  <LinearGradient colors={TOKENS.GRADIENTS.AI} style={StyleSheet.absoluteFill} />
                  <ListChecks color="#fff" size={26} />
                </Animated.View>
                <Text fontSize={13} color={TOKENS.COLORS.TEXT_SECONDARY} fontWeight="600">To-Do</Text>
              </ScaleButton>
            </XStack>
          </Animated.View>
        )}
        
        {/* Quick Replies Menu */}
        {inputText.startsWith('/') && (
          <Animated.View entering={FadeInDown} style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', maxHeight: 240, ...TOKENS.SHADOWS.SUBTLE }}>
            <ScrollView keyboardShouldPersistTaps="always">
              {quickReplies.filter((r: string) => r.toLowerCase().includes(inputText.slice(1).toLowerCase())).map((reply: string, i: number) => (
                <ScaleButton key={i} onPress={() => { setInputText(reply); Platform.OS !== 'web' && Haptics.selectionAsync(); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc', flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: TOKENS.RADIUS.MD, overflow: 'hidden', backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <LinearGradient colors={TOKENS.GRADIENTS.GOLD} style={StyleSheet.absoluteFill} />
                    <Zap color="#d97706" size={16} />
                  </View>
                  <Text color={TOKENS.COLORS.TEXT_PRIMARY} fontWeight="500" fontSize={15}>{reply}</Text>
                </ScaleButton>
              ))}
              {inputText.length > 1 && !quickReplies.includes(inputText.slice(1)) && (
                <ScaleButton onPress={() => { addQuickReply(inputText.slice(1)); setInputText(inputText.slice(1)); Platform.OS !== 'web' && Haptics.notificationAsync(); }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', backgroundColor: '#eff6ff' }}>
                  <LinearGradient colors={TOKENS.GRADIENTS.SCREEN_BG} style={StyleSheet.absoluteFill} />
                  <View style={{ width: 32, height: 32, borderRadius: TOKENS.RADIUS.MD, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <PlusCircle color="#fff" size={16} />
                  </View>
                  <Text color="#2563eb" fontWeight="800" fontSize={15}>Save "{inputText.slice(1)}" as new Quick Reply</Text>
                </ScaleButton>
              )}
            </ScrollView>
          </Animated.View>
        )}
        {moneyRequestMode && (
          <Animated.View entering={FadeInUp.duration(200)} style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', overflow: 'hidden', ...TOKENS.SHADOWS.SUBTLE }}>
            <LinearGradient colors={['#ecfdf5', '#f0fdf4']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
            <XStack padding={12} alignItems="center" space="$2">
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: TOKENS.RADIUS.MD, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#34d399', ...TOKENS.SHADOWS.SUBTLE }}>
                <Text color={TOKENS.COLORS.SUCCESS} fontWeight="bold" fontSize={16} marginRight={4}>$</Text>
                <TextInput 
                  value={moneyAmount}
                  onChangeText={setMoneyAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  autoFocus
                  style={{ fontSize: 16, color: TOKENS.COLORS.TEXT_PRIMARY, flex: 1, fontWeight: '600' }}
                />
              </View>
              <ScaleButton onPress={() => { 
                  if(moneyAmount) { 
                    sendMoneyRequest(); 
                    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
                  }
                }} 
                style={{ width: 44, height: 44, borderRadius: TOKENS.RADIUS.MD, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', opacity: moneyAmount ? 1 : 0.5, ...(moneyAmount ? TOKENS.SHADOWS.COLORED(TOKENS.COLORS.SUCCESS) : {}) }}
              >
                <LinearGradient colors={TOKENS.GRADIENTS.SUCCESS} style={StyleSheet.absoluteFill} />
                <Send color="white" size={18} style={{ transform: [{ translateX: -1 }] }} />
              </ScaleButton>
              <ScaleButton style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' }} onPress={() => setMoneyRequestMode(false)}>
                <X color={TOKENS.COLORS.SUCCESS} size={20} />
              </ScaleButton>
            </XStack>
          </Animated.View>
        )}
        {/* Toolbar & Input Box */}
        <XStack padding="$3" paddingBottom={Platform.OS === 'ios' ? "$5" : "$3"} backgroundColor={isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.85)'} alignItems="flex-end" space="$2" borderTopWidth={1} borderTopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} shadowColor="#0f172a" shadowOpacity={0.05} shadowRadius={8} shadowOffset={{width: 0, height: -2}} elevation={10}>
          <ScaleButton onPress={() => { setShowScheduleOptions(!showScheduleOptions); Platform.OS !== 'web' && Haptics.selectionAsync(); }}>
            <View style={{ width: 44, height: 44, borderRadius: TOKENS.RADIUS.LG, justifyContent: 'center', alignItems: 'center', backgroundColor: showScheduleOptions ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'), transform: [{ rotate: showScheduleOptions ? '45deg' : '0deg' }] }}>
              <PlusCircle color={showScheduleOptions ? (isDark ? '#94a3b8' : '#475569') : (isDark ? '#64748b' : '#64748b')} size={26} strokeWidth={2.5} />
            </View>
          </ScaleButton>
          
          <View style={{ flex: 1, backgroundColor: inputText.trim() ? (isDark ? '#1e293b' : '#fff') : (isDark ? '#1e293b' : '#f8fafc'), borderRadius: TOKENS.RADIUS.LG, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, minHeight: 44, maxHeight: 120, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputText.trim() ? '#6366f1' : (isDark ? '#334155' : '#e2e8f0'), shadowColor: inputText.trim() ? '#6366f1' : 'transparent', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setIsEmojiPickerOpen(false)}
              placeholder="Message..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={{ fontSize: 16, color: isDark ? '#f8fafc' : '#0f172a', flex: 1, maxHeight: 100 }}
            />
            <ScaleButton onPress={() => { Keyboard.dismiss(); setIsEmojiPickerOpen(true); }} style={{ marginLeft: 8, padding: 4 }}>
              <Smile color={isEmojiPickerOpen ? "#6366f1" : "#94a3b8"} size={24} />
            </ScaleButton>
          </View>
          
          <AnimatedPressable 
            onPress={() => inputText.trim() ? handleSendMessage() : null}
            onPressIn={() => {
              if (!inputText.trim()) {
                startRecording();
                Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(()=>{});
              }
            }}
            onPressOut={() => {
              if (!inputText.trim()) {
                stopRecording();
                Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
              }
            }}
          >
            <Animated.View style={{ padding: 12, borderRadius: TOKENS.RADIUS.LG, overflow: 'hidden', backgroundColor: (!inputText.trim() && !isRecording) ? (isDark ? 'rgba(255,255,255,0.08)' : '#e0e7ff') : inputText.trim() ? '#6366f1' : '#ef4444', transform: [{ scale: isRecording ? 1.3 : 1 }], shadowColor: inputText.trim() ? '#4f46e5' : isRecording ? '#ef4444' : 'transparent', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: Platform.OS === 'web' ? ((inputText.trim() || isRecording) ? 5 : 0) : 0 }}>
              {inputText.trim() ? (
                <>
                  <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />
                  <Send color="white" size={20} style={{ transform: [{ translateX: 2 }, { translateY: -1 }] }} />
                </>
              ) : (
                <>
                  {isRecording && <LinearGradient colors={TOKENS.GRADIENTS.DANGER} style={StyleSheet.absoluteFill} />}
                  <Mic color={isRecording ? "#fff" : "#6366f1"} size={22} />
                  {isRecording && (
                    <Animated.View style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: TOKENS.RADIUS.XL, borderWidth: 2, borderColor: '#ef4444', opacity: 0.4 }} />
                  )}
                </>
              )}
            </Animated.View>
          </AnimatedPressable>
        </XStack>
      </KeyboardAvoidingView>
      <EmojiPicker 
          open={isEmojiPickerOpen} 
          onClose={() => setIsEmojiPickerOpen(false)} 
          onEmojiSelected={(emojiObject) => setInputText(prev => prev + emojiObject.emoji)} 
          enableSearchBar={true}
        />
      
      {/* Task Creator Modal */}
      <Modal visible={showTaskModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Animated.View entering={FadeInDown.duration(200)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <Animated.View entering={FadeInDown.springify().damping(15).delay(100)} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderTopLeftRadius: TOKENS.RADIUS.XL, borderTopRightRadius: TOKENS.RADIUS.XL, padding: 20, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
              
              {/* Drag Handle */}
              <View style={{ width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
              
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <XStack alignItems="center" space="$2">
                  <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                    <LinearGradient colors={TOKENS.GRADIENTS.AI} style={StyleSheet.absoluteFill} />
                    <ListChecks color="#fff" size={16} />
                  </View>
                  <Text fontWeight="800" fontSize="$6" color={TOKENS.COLORS.TEXT_PRIMARY}>Create To-Do List</Text>
                </XStack>
                <ScaleButton onPress={() => setShowTaskModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                  <X color={TOKENS.COLORS.TEXT_SECONDARY} size={18} />
                </ScaleButton>
              </XStack>
              
              <TextInput 
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="List Title (e.g. Website Features)"
                placeholderTextColor={TOKENS.COLORS.TEXT_SECONDARY}
                style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', padding: 16, borderRadius: TOKENS.RADIUS.MD, marginBottom: 16, fontWeight: '700', fontSize: 16, color: TOKENS.COLORS.TEXT_PRIMARY, borderWidth: 1, borderColor: taskTitle ? TOKENS.COLORS.BRAND : '#e2e8f0', ...TOKENS.SHADOWS.SUBTLE }}
              />
              
              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                {taskInputs.map((t, i) => (
                  <Animated.View key={i} entering={FadeInDown.springify()} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: TOKENS.RADIUS.MD, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', ...TOKENS.SHADOWS.SUBTLE }}>
                    <XStack alignItems="center">
                      <View style={{ width: 24, height: 24, borderRadius: TOKENS.RADIUS.SM, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? '#475569' : '#e2e8f0', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                        <Text fontSize={12} fontWeight="800" color={TOKENS.COLORS.TEXT_SECONDARY}>{i + 1}</Text>
                      </View>
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
                        placeholderTextColor={TOKENS.COLORS.TEXT_SECONDARY}
                        style={{ flex: 1, paddingVertical: 8, fontSize: 15, color: TOKENS.COLORS.TEXT_PRIMARY, fontWeight: '500' }}
                      />
                      <View style={{ width: 80, marginLeft: 10, backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: TOKENS.RADIUS.SM, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: (typeof t !== 'string' && t.price) ? TOKENS.COLORS.BRAND : '#e2e8f0' }}>
                        <DollarSign color={TOKENS.COLORS.TEXT_SECONDARY} size={14} />
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
                          placeholder="0.00"
                          placeholderTextColor={TOKENS.COLORS.TEXT_SECONDARY}
                          keyboardType="numeric"
                          style={{ flex: 1, paddingVertical: 8, fontSize: 14, color: TOKENS.COLORS.TEXT_PRIMARY, fontWeight: '600' }}
                        />
                      </View>
                    </XStack>
                  </Animated.View>
                ))}
              </ScrollView>
              
              <ScaleButton 
                onPress={() => {
                  if (taskTitle.trim() && taskInputs.some(t => typeof t === 'string' ? t.trim() : t.title.trim())) {
                    sendTaskList();
                    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }} 
                style={{ width: '100%', overflow: 'hidden', padding: 16, borderRadius: TOKENS.RADIUS.MD, marginTop: 16, alignItems: 'center', opacity: (taskTitle.trim() && taskInputs.some(t => typeof t === 'string' ? t.trim() : t.title.trim())) ? 1 : 0.5, ...((taskTitle.trim() && taskInputs.some(t => typeof t === 'string' ? t.trim() : t.title.trim())) ? TOKENS.SHADOWS.COLORED(TOKENS.COLORS.BRAND) : {}) }}
              >
                <LinearGradient colors={TOKENS.GRADIENTS.PRIMARY} style={StyleSheet.absoluteFill} />
                <XStack space="$2" alignItems="center">
                  <Send color="#fff" size={18} />
                  <Text color="white" fontWeight="bold" fontSize="$4">Send List</Text>
                </XStack>
              </ScaleButton>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      </SafeAreaView>
  );
}
