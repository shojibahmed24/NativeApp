import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Phone, MessageSquare, Users, ShieldBan, Grip, User, CheckSquare } from 'lucide-react-native';
import { YStack, View, Text } from 'tamagui';
import { Platform, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { TOKENS } from '../../src/theme/tokens';
import { useThemeContext } from '../../src/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Custom Animated Icon Component
const TabIcon = ({ name, focused, isDark, color }: any) => {
  const scale = useSharedValue(focused ? 1 : 0.8);
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.8, { damping: 15 });
    opacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const IconComp = name === 'calls' ? Phone 
                 : name === 'messages' ? MessageSquare 
                 : name === 'contacts' ? Users 
                 : User;

  const activeColor = isDark ? '#38bdf8' : '#0ea5e9';
  const inactiveColor = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 48, height: 44 }}>
      <Animated.View 
        style={[
          {
            position: 'absolute',
            width: 48,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)',
          },
          bgStyle
        ]} 
      />
      <IconComp color={focused ? activeColor : inactiveColor} size={22} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
};

// Center FAB Button
const CenterDialpadButton = ({ onPress, style }: any) => {
  const { isDark } = useThemeContext();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <TouchableOpacity
      style={[style, {
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
      }]}
      onPress={(e) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress(e);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[animatedStyle, { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={[
          glowStyle,
          {
            position: 'absolute',
            width: '100%', height: '100%',
            borderRadius: 34,
            backgroundColor: '#0ea5e9',
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 15,
            elevation: 8,
            borderWidth: 4,
            borderColor: isDark ? '#1e293b' : '#ffffff',
          }
        ]} />
        <LinearGradient
          colors={['#0ea5e9', '#6366f1']}
          start={{x:0, y:0}} end={{x:1, y:1}}
          style={{
            width: 60, height: 60, borderRadius: 30,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)'
          }}
        >
          <Grip color="#ffffff" size={28} />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function MainLayout() {
  const { isDark } = useThemeContext();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderRadius: 35,
          height: 70,
          position: 'absolute',
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#e2e8f0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          bottom: Platform.OS === 'web' ? 25 : 25,
          left: 20,
          right: 20,
          paddingHorizontal: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: isDark ? '#38bdf8' : '#0ea5e9',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => <TabIcon name="calls" focused={focused} isDark={isDark} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => <TabIcon name="messages" focused={focused} isDark={isDark} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dialpad"
        options={{
          title: '',
          tabBarShowLabel: false,
          tabBarButton: (props) => <CenterDialpadButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('dialpadModal');
          },
        })}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => <TabIcon name="contacts" focused={focused} isDark={isDark} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="profile" focused={focused} isDark={isDark} color={color} />,
        }}
      />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="blocking" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="call-info/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="shared-media/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
