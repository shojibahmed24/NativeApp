import React, { useEffect } from 'react';
import { View, Platform, Text as RNText } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming, 
  withRepeat,
  Easing
} from 'react-native-reanimated';

interface AnimatedEmojiProps {
  emoji?: string;
}

export default function AnimatedEmoji({ emoji = '❤️' }: AnimatedEmojiProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (emoji === '❤️' || emoji === '🔥' || emoji === '😍' || emoji === '😘') {
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
    } else if (emoji === '😂' || emoji === '🤣' || emoji === '😭' || emoji === '😅') {
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
  }, [emoji]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ],
    };
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 140, height: 140, padding: 10 }}>
      <Animated.Text style={[{ fontSize: 80, textAlign: 'center' }, animatedStyle]}>
        {emoji}
      </Animated.Text>
    </View>
  );
}

