import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { getGetDashboardQueryKey, getGetWorkoutQueryKey, useGetDashboard, useStartWorkout } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

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
  const recentWorkouts = dashboard?.recentWorkouts ?? [];
  const sessionsThisWeek = recentWorkouts.filter((workout) => workout.completedSets > 0).length;
  const nextSessionSets = dashboard?.nextSession?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;

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
          {dashboard?.programme && dashboard.nextSession ? (
            <>
              <Text style={[styles.ghostNumber, { color: colors.mutedForeground }]}>{String(dashboard.nextSession.sessionNumber).padStart(2, '0')}</Text>
              <View style={styles.workoutHeader}>
                <Text style={[styles.workoutEyebrow, { color: colors.secondary }]}>NEXT SESSION · {dashboard.programme.name}</Text>
                <Text style={[styles.workoutTitle, { color: colors.foreground }]}>{dashboard.nextSession.name}</Text>
                <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>{dashboard.nextSession.exercises.length} MOVEMENTS · {nextSessionSets} WORKING SETS</Text>
              </View>
              <Pressable
                onPress={startSession}
                disabled={startWorkout.isPending}
                style={({ pressed }) => [styles.startButton, { backgroundColor: colors.primary, opacity: pressed || startWorkout.isPending ? 0.8 : 1 }]}
                testID="button-start-workout"
              >
                {startWorkout.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.startText, { color: colors.primaryForeground }]}>START SESSION</Text>}
              </Pressable>
            </>
          ) : (
            <View style={styles.emptyWorkout}>
              <Text style={[styles.workoutEyebrow, { color: colors.mutedForeground }]}>NO ACTIVE PROGRAMME</Text>
              <Text style={[styles.workoutTitle, { color: colors.foreground }]}>READY WHEN YOU ARE.</Text>
              <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>Create a programme to plan your next session.</Text>
              <Pressable onPress={() => router.push('/plans')} style={[styles.startButton, { backgroundColor: colors.primary }]} testID="button-create-first-programme">
                <Text style={[styles.startText, { color: colors.primaryForeground }]}>CREATE PROGRAMME</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>WEEKLY STATISTICS</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{sessionsThisWeek}/{dashboard?.programme?.sessionsPerWeek ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>SESSIONS</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{dashboard?.weeklyCompletedSets ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>SETS</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>RECENT SESSIONS</Text>
            <Pressable onPress={() => router.push('/history')}><Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text></Pressable>
          </View>
          <View style={styles.recentList}>
            {recentWorkouts.length > 0 ? recentWorkouts.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/workout/${item.id}`)} style={[styles.recentCard, { backgroundColor: colors.card }]}>
                <View style={styles.recentDetails}>
                  <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(item.date)).toUpperCase()}</Text>
                  <Text style={[styles.recentTitle, { color: colors.foreground }]}>{item.sessionName}</Text>
                  <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>{item.totalSets} working sets</Text>
                </View>
                <View style={[styles.completeBadge, item.missedSets > 0 ? { backgroundColor: colors.destructive + '26' } : undefined]}>
                  <Text style={[styles.completeText, { color: item.missedSets > 0 ? colors.destructive : item.completedSets === item.totalSets ? colors.success : colors.secondary }]}>
                    {item.missedSets > 0 ? `${item.missedSets} MISSED` : item.completedSets === item.totalSets ? 'COMPLETE' : 'IN PROGRESS'}
                  </Text>
                </View>
              </Pressable>
            )) : (
              <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>No sessions recorded yet.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable onPress={() => router.push('/plans')} style={[styles.programmeCard, { backgroundColor: colors.card }]}>
            <View style={styles.programmeDetails}>
              <Text style={[styles.programmeEyebrow, { color: colors.primary }]}>{dashboard?.programme ? `${dashboard.programme.sessionsPerWeek} SESSIONS / WEEK · ${dashboard.programme.lengthWeeks} WEEKS` : 'NO ACTIVE PROGRAMME'}</Text>
              <Text style={[styles.programmeTitle, { color: colors.foreground }]}>{dashboard?.programme?.name ?? 'CREATE YOUR FIRST PROGRAMME'}</Text>
              <Text style={[styles.programmeCopy, { color: colors.mutedForeground }]}>{dashboard?.programme?.sessionNames.join(', ') ?? 'Build a plan to see it here.'}</Text>
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
  emptyWorkout: { gap: 8 },
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