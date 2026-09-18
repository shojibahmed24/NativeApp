import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';
import { TOKENS } from '../theme/tokens';

const EMOJIS = ['😂', '😍', '😭', '😊', '🙏', '🥺', '🥰', '😎', '😉', '😘', '🤔', '🔥', '👍', '❤️', '🎉', '✨', '💯', '🙌', '👏', '✌️', '🚀', '👀', '💪', '🤝', '🥳', '🤩', '😴', '🤤', '🤫', '😇', '🤗', '🤪', '😜', '😋', '🤓', '🤠', '🤡', '👻'];

export default function EmojiPickerWeb({ open, onClose, onEmojiSelected }: any) {
  const { isDark } = useThemeContext();
  const [query, setQuery] = useState('');

  if (!open) return null;

  return (
    <View style={{ 
      height: 260, 
      backgroundColor: isDark ? '#1e293b' : '#ffffff', 
      borderTopWidth: 1, 
      borderColor: isDark ? '#334155' : '#e2e8f0', 
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontWeight: '700', fontSize: 14, color: isDark ? '#f8fafc' : '#0f172a' }}>Emoji Reactions</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: TOKENS.COLORS.BRAND, fontWeight: '700', fontSize: 13 }}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 }}>
          {EMOJIS.map((e, i) => (
            <TouchableOpacity 
              key={`${e}-${i}`} 
              onPress={() => onEmojiSelected({ emoji: e })} 
              style={{ 
                padding: 6, 
                borderRadius: 8, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 40,
                minHeight: 40
              }}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}