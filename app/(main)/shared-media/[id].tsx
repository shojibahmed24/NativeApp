import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, Dimensions, Linking } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, Image as ImageIcon, Link as LinkIcon, Download } from 'lucide-react-native';
import { useChat } from '../../../src/context/ChatContext';
import { useThemeContext } from '../../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { TOKENS } from '../../../src/theme/tokens';
import * as Haptics from 'expo-haptics';



import { useWindowDimensions } from 'react-native';

export default function SharedMediaScreen() {
  const { width } = useWindowDimensions();
  const THUMB_SIZE = (Math.min(width, 420) - 24) / 3;
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useThemeContext();
  const { messages } = useChat();
  const [activeTab, setActiveTab] = useState('media'); // media, docs, links

  // All messages in this chat
  const chatMsgs = messages[id as string] || [];

  const media = chatMsgs.filter(m => m.type === 'image' && m.mediaUrl);
  const docs = chatMsgs.filter(m => m.type === 'document' && m.mediaUrl);
  const links = chatMsgs.filter(m => (m.type === 'text' || !m.type) && m.text && m.text.match(/https?:\/\/[^\s]+/g));

  const renderTab = (key, label, icon) => {
    const isActive = activeTab === key;
    return (
      <TouchableOpacity 
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.selectionAsync().catch(()=>{});
          setActiveTab(key);
        }}
      >
        {icon(isActive ? '#0ea5e9' : (isDark ? '#94a3b8' : '#64748b'))}
        <Text style={[styles.tabText, isActive && styles.activeTabText, { color: isActive ? '#0ea5e9' : (isDark ? '#94a3b8' : '#64748b') }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const openUrl = async (url) => {
    if (!url) return;
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch(e) { console.error('Could not open url', e); }
  };

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity onPress={() => openUrl(item.mediaUrl)}>
      <Image source={{ uri: item.mediaUrl }} style={[styles.mediaThumb, { width: THUMB_SIZE, height: THUMB_SIZE }]}  contentFit="cover" cachePolicy="memory-disk" transition={200} />
    </TouchableOpacity>
  );

  const renderDocItem = ({ item }) => {
    const filename = item.metadata?.filename || 'Document File';
    const size = item.metadata?.size ? (item.metadata.size / 1024).toFixed(1) + ' KB' : '';
    return (
      <TouchableOpacity style={[styles.docItem, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]} onPress={() => openUrl(item.mediaUrl)}>
        <View style={styles.docIcon}><FileText color="#3b82f6" size={24} /></View>
        <YStack flex={1} marginLeft="$3">
          <Text fontSize={15} fontWeight="700" color={isDark ? '#f8fafc' : '#0f172a'} numberOfLines={1}>{filename}</Text>
          {size ? <Text fontSize={12} color={isDark ? '#94a3b8' : '#64748b'} marginTop={2}>{size} • Document</Text> : null}
        </YStack>
        <Download color="#64748b" size={20} />
      </TouchableOpacity>
    );
  };

  const renderLinkItem = ({ item }) => {
    const urls = item.text.match(/https?:\/\/[^\s]+/g) || [];
    return (
      <YStack space="$3" paddingHorizontal="$4">
        {urls.map((url, i) => (
          <TouchableOpacity key={i} style={[styles.linkItem, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]} onPress={() => openUrl(url)}>
            <View style={styles.linkIcon}><LinkIcon color="#8b5cf6" size={20} /></View>
            <Text flex={1} marginLeft="$3" fontSize={14} color="#3b82f6" textDecorationLine="underline" numberOfLines={2}>{url}</Text>
          </TouchableOpacity>
        ))}
      </YStack>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={isDark ? '#f8fafc' : '#0f172a'} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Shared Media</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <XStack style={[styles.tabsContainer, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
        {renderTab('media', 'Media', (c) => <ImageIcon color={c} size={16} style={{ marginRight: 6 }}  contentFit="cover" cachePolicy="memory-disk" transition={200} />)}
        {renderTab('docs', 'Docs', (c) => <FileText color={c} size={16} style={{ marginRight: 6 }} />)}
        {renderTab('links', 'Links', (c) => <LinkIcon color={c} size={16} style={{ marginRight: 6 }} />)}
      </XStack>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'media' && (
          <FlatList
            data={media}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={styles.mediaList}
            renderItem={renderMediaItem}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>No media shared yet</Text>}
          />
        )}
        {activeTab === 'docs' && (
          <FlatList
            data={docs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={renderDocItem}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>No documents shared yet</Text>}
          />
        )}
        {activeTab === 'links' && (
          <FlatList
            data={links}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={renderLinkItem}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>No links shared yet</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  tabsContainer: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#0ea5e9' },
  tabText: { fontSize: 14, fontWeight: '700' },
  activeTabText: { color: '#0ea5e9' },
  content: { flex: 1 },
  mediaList: { padding: 4 },
  mediaThumb: { margin: 4, borderRadius: 8, backgroundColor: '#cbd5e1' },
  listContainer: { padding: 16, gap: 12 },
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  docIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  linkItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  linkIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, fontWeight: '600' }
});
