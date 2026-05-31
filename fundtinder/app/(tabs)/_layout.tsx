import { Redirect, Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Brain,
  Home,
  ListFilterPlus,
  MessageCircleHeart,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { Platform } from 'react-native';

export default function TabLayout() {
  const isDesktop = useIsDesktop();
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const style = document.createElement('style');

    if (isDesktop) {
      style.innerHTML = `
      [role="tablist"] {
        flex-direction: column !important;
        justify-content: center !important;
        align-items: stretch !important;
        padding-top: 24px !important;
      }

      [role="tablist"] > * {
        width: 100% !important;
        min-height: 72px !important;
        flex: none !important;
      }
    `;

      document.head.appendChild(style);
    }

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [isDesktop]);

  if (loading) {
    return null;
  }
  if (!user) {
    return <Redirect href="/login" />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,

        tabBarStyle: isDesktop
          ? {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 100,
              height: '100%',
            }
          : undefined,

        tabBarItemStyle: isDesktop
          ? {
              width: '100%',
            }
          : undefined,

        tabBarLabelStyle: isDesktop
          ? {
              fontSize: 11,
              marginTop: 4,
            }
          : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: !isDesktop ? 'Home' : '',
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="filters"
        options={{
          title: !isDesktop ? 'Filters' : '',
          tabBarIcon: ({ color }) => <ListFilterPlus size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: !isDesktop ? 'Chats' : '',
          tabBarIcon: ({ color }) => (
            <MessageCircleHeart size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lili"
        options={{
          title: !isDesktop ? 'Lili' : '',
          tabBarIcon: ({ color }) => <Brain size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: !isDesktop ? 'Profile' : '',
          tabBarIcon: ({ color }) => <User size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
