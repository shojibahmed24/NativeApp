// @ts-nocheck
import { StatusBar } from 'expo-status-bar';
import 'react-native-get-random-values';
import { Platform, LogBox, useColorScheme, Text, View as RNView, Text as RNText, useWindowDimensions } from 'react-native';
import React, { useEffect } from 'react';
if (Platform.OS === 'web') {
  require('./global.css');
}
LogBox.ignoreLogs(['Exceeded max renders without commit']);
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme, YStack, Spinner, View } from 'tamagui'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as Sentry from "@sentry/react-native";

if (process.env.EXPO_PUBLIC_SENTRY_DSN && process.env.EXPO_PUBLIC_SENTRY_DSN.startsWith('http')) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

import tamaguiConfig from '../tamagui.config'
import { AuthProvider, useAuth } from '../src/context/AuthContext';
// removed providers
import { ThemeProvider, useThemeContext } from '../src/context/ThemeContext'
import IncomingCallModal from '../src/components/IncomingCallModal'

function RootLayoutNav() {
  const { user, loading, hasSeenOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const publicRoutes = ['terms', 'privacy', 'support'];
    const isPublicRoute = publicRoutes.includes(segments[0]);
    
    if (!user && !inAuthGroup && !isPublicRoute) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && (inAuthGroup || segments.length === 0)) {
      if (!hasSeenOnboarding && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      } else if (hasSeenOnboarding) {
        router.replace('/(main)/messages');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$colorFocus" />
      </YStack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="dialpadModal" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="call/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
    </Stack>
  );
}


import { TOKENS } from '../src/theme/tokens';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    Sentry.captureException(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <RNText style={{ color: 'red', fontSize: 18, marginBottom: 10 }}>App Crashed</RNText>
          <RNText>{this.state.error?.message}</RNText>
        </RNView>
      );
    }
    return this.props.children;
  }
}


function InnerApp() {
  const { isDark } = useThemeContext();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth > 600;
  return (
    <TamaguiProvider config={tamaguiConfig}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      <Theme name={isDark ? 'dark' : 'light'}>
        <View 
          flex={1} 
          backgroundColor={isDesktopWeb ? (isDark ? '#0f172a' : '#f0f0f0') : (isDark ? '#0f172a' : '$background')} 
          alignItems={isDesktopWeb ? 'center' : 'stretch'} 
          justifyContent={isDesktopWeb ? 'center' : 'flex-start'}
        >
          <View 
            flex={1} 
            width="100%" 
            maxWidth={isDesktopWeb ? 420 : '100%'} 
            maxHeight={isDesktopWeb ? Math.min(850, windowHeight - 40) : '100%'}
            backgroundColor="$background"
            overflow="hidden"
            shadowColor="#000"
            shadowOpacity={isDesktopWeb ? 0.15 : 0}
            shadowRadius={20}
            style={isDesktopWeb ? { 
              marginVertical: 20, 
              borderRadius: TOKENS.RADIUS.XL, 
              borderWidth: 8, 
              borderColor: isDark ? '#1e293b' : '#333', 
              borderStyle: 'solid',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            } : {}}
          >
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </View>
        </View>
      </Theme>
    </TamaguiProvider>
  );
}

function RootLayout() {

  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <InnerApp />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}

const hasSentry = process.env.EXPO_PUBLIC_SENTRY_DSN && process.env.EXPO_PUBLIC_SENTRY_DSN.startsWith('http');
export default hasSentry ? Sentry.wrap(RootLayout) : RootLayout;

