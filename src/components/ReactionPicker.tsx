// @ts-nocheck
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, ZoomIn, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { TOKENS } from '../theme/tokens';

const REACTIONS = ['❤️', '😂', '👍', '😮', '😡', '😭'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export default function ReactionPicker({ onSelect, onClose, isDark }: ReactionPickerProps) {
  const handleSelect = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSelect(emoji);
    onClose();
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={SlideOutDown.duration(200)}
      style={styles.overlay}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      
      <Animated.View 
        entering={ZoomIn.duration(300).springify().damping(15)} 
        style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(30,41,59,0.2)' : 'rgba(255,255,255,0.2)' }]}
      >
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View style={styles.reactionList}>
          {REACTIONS.map((emoji, index) => (
            <Animated.View key={emoji} entering={ZoomIn.delay(index * 40).springify()}>
              <TouchableOpacity 
                style={styles.reactionBtn} 
                onPress={() => handleSelect(emoji)}
                activeOpacity={0.6}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  reactionList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emojiText: {
    fontSize: 28,
  }
});
