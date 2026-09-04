import React from 'react';
import { Tabs } from 'expo-router';
import { Phone, MessageSquare, Users, ShieldBan, Grip, User, CheckSquare } from 'lucide-react-native';
import { YStack, View, Text } from 'tamagui';
import { Platform, TouchableOpacity } from 'react-native';

const CustomTabBarButton = ({ children, onPress, style }: any) => (
  <TouchableOpacity
    style={[style, {
      top: -25,
      justifyContent: 'center',
      alignItems: 'center',
    }]}
    onPress={onPress}
    activeOpacity={0.8}
    //@ts-ignore
    style={[style, { top: -25, justifyContent: 'center', alignItems: 'center', outline: 'none' }]}
  >
    <View
      backgroundColor="#005eb8"
      width={64}
      height={64}
      borderRadius={32}
      justifyContent="center"
      alignItems="center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: 'below-icon', // Force vertical layout even on wide web screens
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderRadius: 40,
          height: 75,
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: '#005eb8',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 25,
          bottom: Platform.OS === 'web' ? 25 : 20,
          left: 20,
          right: 20,
          paddingHorizontal: 10,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#005eb8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => (
            <View backgroundColor={focused ? 'rgba(0,94,184,0.1)' : 'transparent'} padding={6} borderRadius={16} minWidth={48} alignItems="center">
              <Phone color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <View backgroundColor={focused ? 'rgba(0,94,184,0.1)' : 'transparent'} padding={6} borderRadius={16} minWidth={48} alignItems="center">
              <MessageSquare color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dialpad"
        options={{
          title: '',
          tabBarShowLabel: false,
          tabBarIcon: () => <Grip color="#ffffff" size={32} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
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
          tabBarIcon: ({ color, focused }) => (
            <View backgroundColor={focused ? 'rgba(0,94,184,0.1)' : 'transparent'} padding={6} borderRadius={16} minWidth={48} alignItems="center">
              <Users color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View backgroundColor={focused ? 'rgba(0,94,184,0.1)' : 'transparent'} padding={6} borderRadius={16} minWidth={48} alignItems="center">
              <User color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      {/* Hide the Block tab from bottom navigation (user requested to move this to profile) */}
      <Tabs.Screen
        name="blocking"
        options={{
          href: null,
        }}
      />
      {/* Hide the Profile folder and any other tabs completely */}
      <Tabs.Screen
        name="profile/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="call-info/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
