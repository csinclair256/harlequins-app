import { Tabs } from 'expo-router';
import React from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.textWhite,
        tabBarInactiveTintColor: colors.borderInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
