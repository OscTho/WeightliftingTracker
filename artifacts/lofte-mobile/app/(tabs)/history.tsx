import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetHistory } from '@workspace/api-client-react';
import type { WorkoutSummary } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';

const EXERCISE_SHORT: Record<string, string> = {
  snatch: 'SN',
  clean_and_jerk: 'C&J',
  back_squat: 'BS',
  front_squat: 'FS',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function WorkoutCard({ item, colors }: { item: WorkoutSummary; colors: ReturnType<typeof useColors> }) {
  const pct = item.totalSets > 0 ? Math.round((item.completedSets / item.totalSets) * 100) : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sessionName, { color: colors.foreground }]}>{item.sessionName}</Text>
          <Text style={[styles.programmeName, { color: colors.mutedForeground }]}>
            {item.programmeName}
          </Text>
        </View>
        {item.hasPb && (
          <View style={[styles.pbBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.pbText, { color: colors.secondaryForeground }]}>PB</Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
        <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
          {item.completedSets}/{item.totalSets} sets · {pct}%
          {item.missedSets > 0 ? ` · ${item.missedSets} missed` : ''}
        </Text>
      </View>

      {/* Completion bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.elevated }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: pct >= 90 ? colors.success : pct >= 70 ? colors.secondary : colors.primary,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              width: (`${pct}%` as any),
            },
          ]}
        />
      </View>

      {/* PB detail */}
      {item.hasPb && item.pbSets.length > 0 && (
        <Text style={[styles.pbDetail, { color: colors.secondary }]}>
          {item.pbSets
            .map((pb) => `${EXERCISE_SHORT[pb.exercise] ?? pb.exercise} ${pb.weight} kg`)
            .join(' · ')}
        </Text>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isFetching } = useGetHistory();

  const topPad = Platform.OS === 'web' ? 67 + 16 : 16;
  const bottomPad = Platform.OS === 'web' ? 84 + 16 : insets.bottom + 72;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={32} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground, marginTop: 12 }]}>
          Couldn't load history
        </Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: colors.elevated, marginTop: 16 }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryBtnText, { color: colors.foreground }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const workouts = data ?? [];

  return (
    <FlatList
      data={workouts}
      keyExtractor={(item) => String(item.id)}
      scrollEnabled={!!workouts.length}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        { paddingHorizontal: 16, paddingTop: topPad, paddingBottom: bottomPad },
        workouts.length === 0 && styles.emptyFlex,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContent}>
          <Feather name="activity" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, marginTop: 14 }]}>
            No sessions yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground, marginTop: 4 }]}>
            Start a workout on the home tab to begin tracking your training
          </Text>
        </View>
      }
      renderItem={({ item }) => <WorkoutCard item={item} colors={colors} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  emptyFlex: { flex: 1 },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyBody: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  sessionName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  programmeName: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  pbBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  pbText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statsText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 4, borderRadius: 2 },
  pbDetail: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
