import React, { useEffect, useRef } from 'react';
import { View, Platform, StyleProp, ViewStyle, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming, 
  withRepeat,
  cancelAnimation,
  Easing
} from 'react-native-reanimated';

interface AnimatedEmojiProps {
  emoji?: string;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
  isLottieEnabled?: boolean;
}

// Map emojis to high-quality public Lottie animations
const LOTTIE_MAP: Record<string, string> = {
  '❤️': 'https://lottie.host/80e9273c-bf58-47c0-be4c-f12b70fcf20b/TjN1OQpE6D.json',
  '😂': 'https://lottie.host/9e4d0d5b-f116-4d0f-a212-e8869151214c/iH2kMh4OOh.json',
  '👍': 'https://lottie.host/575e92cd-ff87-4d64-be55-911b33b000a6/PudA6c98n1.json',
  '😮': 'https://lottie.host/a0a6cc3f-a032-4752-be7f-ef393dc5f7ba/G3iX070LwQ.json',
  '😡': 'https://lottie.host/0a1a541a-821f-4efc-8d19-eaecbc961445/7vFh3A0p2g.json',
  '😭': 'https://lottie.host/3e8c9735-300c-4573-9dc0-67c0500e57ba/7Fw29yN0wL.json'
};

export default function AnimatedEmoji({ emoji = '❤️', size = 80, containerStyle, isLottieEnabled = true }: AnimatedEmojiProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  
  const lottieRef = useRef<LottieView>(null);
  const lottieUrl = LOTTIE_MAP[emoji];

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(rotate);
    scale.value = 0;
    rotate.value = 0;

    if (lottieUrl && isLottieEnabled && Platform.OS !== 'web') {
      // If it's a lottie animation, just a simple pop spring
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      return;
    }

    // Text Fallback Animations
    if (emoji === '❤️' || emoji === '💖' || emoji === '💗' || emoji === '💓') {
      scale.value = withSequence(
        withSpring(1.4, { damping: 5, stiffness: 80 }),
        withRepeat(
          withSequence(
            withTiming(1.1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1, 
          true 
        )
      );
    } else if (emoji === '🔥' || emoji === '✨' || emoji === '🎉' || emoji === '🎊') {
      scale.value = withSpring(1.2, { damping: 8, stiffness: 100 });
      rotate.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 150 }),
          withTiming(15, { duration: 150 }),
          withTiming(0, { duration: 150 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 120 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotate);
    };
  }, [emoji]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ],
    };
  });

  if (lottieUrl && isLottieEnabled && Platform.OS !== 'web') {
    return (
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, containerStyle, animatedStyle]}>
        <LottieView
          ref={lottieRef}
          source={{ uri: lottieUrl }}
          autoPlay
          loop={emoji === '❤️'}
          style={{ width: size * 1.5, height: size * 1.5 }}
        />
      </Animated.View>
    );
  }

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', padding: 8 }, containerStyle]}>
      <Animated.Text style={[{ fontSize: size, textAlign: 'center', includeFontPadding: false, minWidth: size * 1.5, minHeight: size * 1.5 }, animatedStyle]}>
        {emoji}
      </Animated.Text>
    </View>
  );
}
