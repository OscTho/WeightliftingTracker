import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { getGetDashboardQueryKey, getGetWorkoutQueryKey, useGetDashboard, useStartWorkout } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const sessionItems = [
  { date: 'YESTERDAY', name: 'Clean & Jerk Heavy Singles', sets: '12 working sets' },
  { date: '08 AUG', name: 'Power Snatch', sets: '10 working sets' },
];

function StatusBarMock({ colors }: { colors: ReturnType<typeof useColors> }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={styles.statusBar}>
      <Text style={[styles.statusTime, { color: colors.foreground }]}>9:41</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signal}>
          <View style={[styles.signalBar, { height: 4, backgroundColor: colors.foreground }]} />
          <View style={[styles.signalBar, { height: 7, backgroundColor: colors.foreground }]} />
          <View style={[styles.signalBar, { height: 10, backgroundColor: colors.foreground }]} />
          <View style={[styles.signalBar, { height: 13, backgroundColor: colors.foreground }]} />
        </View>
        <Feather name="wifi" size={16} color={colors.foreground} />
        <View style={[styles.battery, { borderColor: colors.foreground }]}>
          <View style={[styles.batteryFill, { backgroundColor: colors.foreground }]} />
          <View style={[styles.batteryTip, { backgroundColor: colors.foreground }]} />
        </View>
      </View>
    </View>
  );
}

export default function TrackDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: dashboard } = useGetDashboard();
  const startWorkout = useStartWorkout();

  const startSession = () => {
    if (!dashboard?.programme || !dashboard.nextSession || startWorkout.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startWorkout.mutate(
      { data: { programmeId: dashboard.programme.id, sessionNumber: dashboard.nextSession.sessionNumber } },
      {
        onSuccess: (workout) => {
          queryClient.setQueryData(getGetWorkoutQueryKey(workout.id), workout);
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          router.push(`/workout/${workout.id}`);
        },
      },
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scrollContent, { paddingTop: Platform.OS === 'web' ? 0 : insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBarMock colors={colors} />
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Text style={[styles.wordmark, { color: colors.primary }]}>LOFTE</Text>
          <View style={[styles.avatar, { backgroundColor: colors.elevated }]} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.overline, { color: colors.mutedForeground }]}>TODAY</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>READY WHEN{'\n'}YOU ARE.</Text>
        </View>

        <View style={[styles.workoutCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.ghostNumber, { color: colors.mutedForeground }]}>01</Text>
          <View style={styles.workoutHeader}>
            <Text style={[styles.workoutEyebrow, { color: colors.secondary }]}>WEEK 1 SESSION 1</Text>
            <Text style={[styles.workoutTitle, { color: colors.foreground }]}>SNATCH &amp; Front Squats</Text>
            <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>5 MOVEMENTS · 16 WORKING SETS</Text>
          </View>
          <Pressable
            onPress={startSession}
            disabled={startWorkout.isPending}
            style={({ pressed }) => [styles.startButton, { backgroundColor: colors.primary, opacity: pressed || startWorkout.isPending ? 0.8 : 1 }]}
            testID="button-start-workout"
          >
            {startWorkout.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.startText, { color: colors.primaryForeground }]}>START SESSION</Text>}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>WEEKLY STATISTICS</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>4/5</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>SESSIONS</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>64</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>REPS</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>RECENT SESSIONS</Text>
            <Pressable onPress={() => router.push('/history')}><Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text></Pressable>
          </View>
          <View style={styles.recentList}>
            {sessionItems.map((item) => (
              <View key={item.name} style={[styles.recentCard, { backgroundColor: colors.card }]}>
                <View style={styles.recentDetails}>
                  <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>{item.date}</Text>
                  <Text style={[styles.recentTitle, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>{item.sets}</Text>
                </View>
                <View style={styles.completeBadge}><Text style={[styles.completeText, { color: colors.success }]}>COMPLETE</Text></View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable onPress={() => router.push('/plans')} style={[styles.programmeCard, { backgroundColor: colors.card }]}>
            <View style={styles.programmeDetails}>
              <Text style={[styles.programmeEyebrow, { color: colors.primary }]}>4 SESSIONS / WEEK · 12 WEEKS</Text>
              <Text style={[styles.programmeTitle, { color: colors.foreground }]}>Solitude Strength{'\n'}v2</Text>
              <Text style={[styles.programmeCopy, { color: colors.mutedForeground }]}>Squat Intensity, Snatch Speed, Pull Complex, Leg Volume</Text>
            </View>
            <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 30 },
  content: { paddingHorizontal: 20, gap: 28 },
  statusBar: { height: 44, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTime: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signal: { height: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, borderRadius: 1 },
  battery: { width: 22, height: 11, borderWidth: 1, borderRadius: 3, justifyContent: 'center', paddingHorizontal: 2, position: 'relative' },
  batteryFill: { height: 7, width: 15, borderRadius: 1 },
  batteryTip: { position: 'absolute', right: -3, top: 3, width: 2, height: 5, borderRadius: 1 },
  topBar: { height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  hero: { gap: 4 },
  overline: { fontSize: 11, lineHeight: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  heroTitle: { fontSize: 44, lineHeight: 50, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  workoutCard: { minHeight: 154, borderRadius: 16, padding: 24, gap: 24, overflow: 'hidden' },
  ghostNumber: { position: 'absolute', right: 13, top: -5, fontSize: 84, lineHeight: 92, letterSpacing: 1, fontFamily: 'Inter_700Bold', opacity: 0.28 },
  workoutHeader: { gap: 4 },
  workoutEyebrow: { fontSize: 11, lineHeight: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2, textTransform: 'uppercase' },
  workoutTitle: { fontSize: 22, lineHeight: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.7, textTransform: 'uppercase' },
  workoutMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  startButton: { width: 217, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  section: { gap: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 24, lineHeight: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, minHeight: 66, borderRadius: 12, padding: 16, gap: 4 },
  statNumber: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  recentList: { gap: 12 },
  recentCard: { minHeight: 76, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  recentDetails: { flex: 1, gap: 4 },
  recentDate: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  recentTitle: { fontSize: 15, lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
  recentMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  completeBadge: { backgroundColor: 'rgba(63,143,104,0.14)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  completeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  programmeCard: { borderRadius: 16, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  programmeDetails: { flex: 1, gap: 4 },
  programmeEyebrow: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.15 },
  programmeTitle: { fontSize: 23, lineHeight: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  programmeCopy: { fontSize: 15, lineHeight: 20, fontFamily: 'Inter_400Regular' },
});