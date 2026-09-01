import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { BottomNav } from '@/components/BottomNav';

function activeTab(pathname: string): 'track' | 'plans' | 'history' | 'profile' {
  if (pathname.includes('/plans')) return 'plans';
  if (pathname.includes('/history')) return 'history';
  if (pathname.includes('/profile')) return 'profile';
  return 'track';
}

export default function TabLayout() {
  const colors = useColors();
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={() => <BottomNav active={activeTab(pathname)} embedded />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}