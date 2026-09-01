import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type TabName = 'track' | 'plans' | 'history' | 'profile';

const tabs: Array<{ key: TabName; label: string; icon: keyof typeof Feather.glyphMap; path: string }> = [
  { key: 'track', label: 'Track', icon: 'play-circle', path: '/' },
  { key: 'plans', label: 'Plans', icon: 'clipboard', path: '/plans' },
  { key: 'history', label: 'History', icon: 'clock', path: '/history' },
  { key: 'profile', label: 'Profile', icon: 'user', path: '/profile' },
];

export function BottomNav({ active, embedded = false }: { active: TabName; embedded?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[embedded ? styles.embeddedBar : styles.floatingBar, { backgroundColor: colors.background }]}>
      <View style={[styles.bar, { borderColor: colors.border, paddingBottom: Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8) }]}>
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable key={tab.key} onPress={() => router.replace(tab.path as Href)} style={[styles.item, selected && { backgroundColor: colors.primary }]} accessibilityRole="tab" accessibilityState={{ selected }}>
              <Feather name={tab.icon} size={21} color={selected ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.label, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {Platform.OS === 'web' && (
        <View style={styles.homeIndicatorArea}>
          <View style={[styles.homeIndicator, { backgroundColor: colors.mutedForeground }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 76, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 10 },
  floatingBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  embeddedBar: { width: '100%' },
  item: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  homeIndicatorArea: { height: 29, alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  homeIndicator: { width: 139, height: 5, borderRadius: 3 },
});