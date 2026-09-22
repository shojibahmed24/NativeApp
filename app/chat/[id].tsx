// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ImageBackground, View, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Animated as RNAnimated, ScrollView, Modal, Clipboard,  } from 'react-native';
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
  
  const flatListRef = useRef<FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={50}
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
                  <ImageIcon color="#fff" size={26} />
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
