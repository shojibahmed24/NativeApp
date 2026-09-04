import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

const EMOJIS = ['😂', '😍', '😭', '😊', '🙏', '🥺', '🥰', '😎', '😉', '😘', '🤔', '🔥', '👍', '❤️', '🎉', '✨', '💯', '🙌', '👏', '✌️'];

export default function EmojiPickerWeb({ open, onClose, onEmojiSelected }) {
  if (!open) return null;
  return (
    <View style={{ height: 250, backgroundColor: '#f8fafc', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontWeight: 'bold' }}>Emojis (Web)</Text>
        <TouchableOpacity onPress={onClose}><Text style={{ color: '#005eb8', fontWeight: 'bold' }}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {EMOJIS.map(e => (
            <TouchableOpacity key={e} onPress={() => onEmojiSelected({ emoji: e })} style={{ padding: 5 }}>
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}