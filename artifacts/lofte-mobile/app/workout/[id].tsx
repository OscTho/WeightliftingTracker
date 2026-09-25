import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getGetDashboardQueryKey,
  getGetHistoryQueryKey,
  useGetMovements,
  getGetWorkoutQueryKey,
  useCompleteSet,
  useFinishWorkout,
  useGetWorkout,
  useMissSet,
} from '@workspace/api-client-react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

// ─── helpers ─────────────────────────────────────────────────────────────────

const EXERCISE_LABELS: Record<string, string> = {
  snatch: 'SNATCH',
  clean_and_jerk: 'CLEAN & JERK',
  back_squat: 'BACK SQUAT',
  front_squat: 'FRONT SQUAT',
};

const EXERCISE_SHORT: Record<string, string> = {
  snatch: 'SN',
  clean_and_jerk: 'C&J',
  back_squat: 'BS',
  front_squat: 'FS',
};

function fmtWeight(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

// ─── component ───────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: workout, isLoading, isError, refetch } = useGetWorkout(workoutId, {
    query: { queryKey: getGetWorkoutQueryKey(workoutId), enabled: Number.isFinite(workoutId) },
  });
  const { data: movements } = useGetMovements();

  const completeSet = useCompleteSet();
  const missSet = useMissSet();
  const finishWorkout = useFinishWorkout();

  const [showMissChoice, setShowMissChoice] = useState(false);
  const [showLoadSheet, setShowLoadSheet] = useState(false);
  const [customWeight, setCustomWeight] = useState<number | null>(null);
  const [draftWeight, setDraftWeight] = useState('');
  const pendingSetId = workout?.sets.find((set) => set.status === 'pending')?.id;
  const movementName = (id?: string) =>
    movements?.find((movement) => movement.id === id)?.name ??
    EXERCISE_LABELS[id ?? ''] ??
    id?.replace(/_/g, ' ') ??
    'Snatch';
  const movementShortName = (id?: string) =>
    EXERCISE_SHORT[id ?? ''] ??
    movementName(id).split(/\s+/).map((part) => part[0]).join('').slice(0, 4).toUpperCase();

  useEffect(() => {
    setCustomWeight(null);
    setShowLoadSheet(false);
  }, [pendingSetId]);

  // insets — web gets manual values, native uses safe area
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── loading / error ──
  if (isLoading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !workout) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.mutedForeground, marginTop: 12 }]}>
          Workout not found
        </Text>
        <Pressable
          style={[styles.smallBtn, { backgroundColor: colors.elevated, marginTop: 16 }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.smallBtnText, { color: colors.foreground }]}>Go back</Text>
        </Pressable>
        <Pressable
          style={[styles.smallBtn, { backgroundColor: colors.elevated, marginTop: 8 }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.smallBtnText, { color: colors.foreground }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── cache helpers ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCache = (next: any) => {
    qc.setQueryData(getGetWorkoutQueryKey(workoutId), next);
    qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };

  const currentSet = workout.sets.find((s) => s.status === 'pending');
  const displayWeight = currentSet ? customWeight ?? currentSet.weight : 0;
  const exerciseOrder = [...new Set(workout.sets.map((set) => set.exercise))];
  const movementNumber = currentSet ? exerciseOrder.indexOf(currentSet.exercise) + 1 : 0;

  // ── workout completed ──
  if (workout.status === 'completed') {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.completedContainer,
            { paddingTop: topInset + 40, paddingBottom: bottomInset + 24, paddingHorizontal: 24 },
          ]}
        >
          <View style={[styles.completedIconRing, { backgroundColor: colors.success + '25' }]}>
            <Feather name="check" size={40} color={colors.success} />
          </View>

          <Text style={[styles.completedEyebrow, { color: colors.primary, marginTop: 24 }]}>
            SESSION COMPLETE
          </Text>
          <Text style={[styles.completedTitle, { color: colors.foreground }]}>
            {workout.sessionName.toUpperCase()}
          </Text>
          <Text style={[styles.completedMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
            {workout.completedSets} completed · {workout.missedSets} missed · {workout.attempts} attempts
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 28 }]} />

          <Pressable
            style={({ pressed }) => [
              styles.fullBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.replace('/')}
            testID="link-finished-home"
          >
            <Text style={[styles.fullBtnText, { color: colors.primaryForeground }]}>
              BACK TO TODAY
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.outlineBtn,
              { borderColor: colors.border, marginTop: 12, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.replace('/history')}
          >
            <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>VIEW HISTORY</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── action handlers ──
  const handleComplete = () => {
    if (!currentSet || completeSet.isPending) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeSet.mutate(
      { workoutId, setId: currentSet.id, data: { weight: displayWeight } },
      { onSuccess: updateCache }
    );
  };

  const handleMissTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMissChoice(true);
  };

  const handleMissAction = (action: 'retry' | 'move_on') => {
    if (!currentSet || missSet.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    missSet.mutate(
      { workoutId, setId: currentSet.id, data: { action } },
      {
        onSuccess: (next) => {
          updateCache(next);
          setShowMissChoice(false);
        },
      }
    );
  };

  const handleFinish = () => {
    if (finishWorkout.isPending) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finishWorkout.mutate(
      { workoutId },
      {
        onSuccess: (next) => {
          updateCache(next);
          qc.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        },
      }
    );
  };

  const handleExit = () => {
    Alert.alert('Exit Workout', 'Your progress is saved. You can resume this session later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  // ── exercise-level progress dots ──
  const currentExerciseSets = currentSet
    ? workout.sets.filter((s) => (s.movementId ?? s.exercise) === (currentSet.movementId ?? currentSet.exercise))
    : [];

  // ── render active workout ──
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          hitSlop={12}
          style={({ pressed }) => [styles.exitBtn, { opacity: pressed ? 0.5 : 1 }]}
          onPress={handleExit}
        >
          <View style={styles.exitContent}>
            <Feather name="arrow-left" size={15} color={colors.primary} />
            <Text style={[styles.exitText, { color: colors.primary }]}>Exit</Text>
          </View>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerProgramme, { color: colors.primary }]} numberOfLines={1}>
            {workout.programmeName.toUpperCase()}
          </Text>
          <Text style={[styles.headerSession, { color: colors.foreground }]} numberOfLines={1}>
            {workout.sessionName.toUpperCase()}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.headerBadge, { backgroundColor: colors.elevated }]}>
            <Text style={[styles.headerCount, { color: colors.foreground }]}>
              {workout.completedSets}/{workout.sets.length} Completed
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {currentSet ? (
          /* ── Active set ── */
          <View style={styles.currentSetContainer}>
            <Text style={[styles.movementLabel, { color: colors.primary }]}>MOVEMENT {movementNumber} OF {exerciseOrder.length}</Text>
            <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>
              {movementName(currentSet.movementId ?? currentSet.exercise)}
            </Text>

            {/* Progress dots for this exercise */}
            <View style={styles.dotsRow}>
              {currentExerciseSets.map((s) => {
                const isCurrent = s.id === currentSet.id;
                let dotBg = colors.background;
                let dotBorder = colors.border;
                if (s.status === 'completed') { dotBg = colors.primary; dotBorder = colors.primary; }
                else if (s.status === 'missed') { dotBg = colors.destructive; dotBorder = colors.destructive; }
                else if (isCurrent) { dotBorder = colors.primary; }
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.dot,
                      { backgroundColor: dotBg, borderColor: dotBorder, borderWidth: isCurrent ? 2 : 1 },
                    ]}
                  ><Text style={[styles.dotText, { color: isCurrent ? colors.foreground : colors.mutedForeground }]}>{s.setNumber}</Text></View>
                );
              })}
            </View>

            {/* Big weight display */}
            <Pressable
              onPress={() => { setDraftWeight(String(displayWeight)); setShowLoadSheet(true); }}
              style={[styles.weightCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Adjust load"
              testID="button-adjust-load"
            >
              <Text style={[styles.weightNumber, { color: colors.secondary }]}>{fmtWeight(displayWeight)}</Text>
              <Text style={[styles.weightUnit, { color: colors.mutedForeground }]}>KG</Text>
              <View style={styles.targetRow}>
                <View style={[styles.targetPill, { backgroundColor: colors.elevated }]}>
                  <Text style={[styles.targetPillText, { color: colors.primary }]}>{currentSet.percentage}% 1RM</Text>
                </View>
                <Text style={[styles.repsLabel, { color: colors.foreground }]}>{currentSet.reps} REPS</Text>
              </View>
            </Pressable>

            {/* ── Action buttons or miss choice ── */}
            {showMissChoice ? (
              <View style={styles.missChoiceBox}>
                <Text style={[styles.missChoiceTitle, { color: colors.foreground }]}>
                  Missed — what next?
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.bigBtn,
                    {
                      backgroundColor: colors.elevated,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed || missSet.isPending ? 0.7 : 1,
                      marginTop: 14,
                    },
                  ]}
                  onPress={() => handleMissAction('retry')}
                  disabled={missSet.isPending}
                >
                  {missSet.isPending ? (
                    <ActivityIndicator color={colors.foreground} size="small" />
                  ) : (
                    <>
                      <Feather name="rotate-ccw" size={18} color={colors.foreground} />
                      <Text style={[styles.bigBtnText, { color: colors.foreground }]}>RETRY</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.bigBtn,
                    {
                      backgroundColor: colors.elevated,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed || missSet.isPending ? 0.7 : 1,
                      marginTop: 10,
                    },
                  ]}
                  onPress={() => handleMissAction('move_on')}
                  disabled={missSet.isPending}
                >
                  <Feather name="skip-forward" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.bigBtnText, { color: colors.mutedForeground }]}>MOVE ON</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.cancelTap, { opacity: pressed ? 0.5 : 1 }]}
                  onPress={() => setShowMissChoice(false)}
                >
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionPair}>
                <Pressable
                  style={({ pressed }) => [
                    styles.bigBtn,
                    {
                      backgroundColor: colors.secondary,
                      opacity: pressed || completeSet.isPending ? 0.8 : 1,
                    },
                  ]}
                  onPress={handleComplete}
                  disabled={completeSet.isPending}
                  testID="button-complete-set"
                >
                  {completeSet.isPending ? (
                        <ActivityIndicator color={colors.secondaryForeground} size="small" />
                  ) : (
                    <>
                        <Feather name="check" size={22} color={colors.secondaryForeground} />
                    <Text style={[styles.bigBtnText, { color: colors.secondaryForeground }]}>
                      COMPLETE REP
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.bigBtn,
                    {
                      backgroundColor: 'transparent',
                      opacity: pressed || completeSet.isPending ? 0.8 : 1,
                    },
                  ]}
                  onPress={handleMissTap}
                  disabled={completeSet.isPending}
                  testID="button-miss-set"
                >
                    <Text style={[styles.missButtonText, { color: colors.destructive }]}>Missed it</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          /* ── All sets accounted for ── */
          <View style={[styles.allDoneBox, { paddingHorizontal: 24 }]}>
            <View style={[styles.allDoneIcon, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={36} color={colors.success} />
            </View>
            <Text style={[styles.allDoneTitle, { color: colors.foreground }]}>
              All reps accounted for
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.bigBtn,
                {
                  backgroundColor: colors.primary,
                  marginTop: 20,
                  opacity: pressed || finishWorkout.isPending ? 0.85 : 1,
                },
              ]}
              onPress={handleFinish}
              disabled={finishWorkout.isPending}
              testID="button-finish-workout"
            >
              {finishWorkout.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <>
                  <Text style={[styles.bigBtnText, { color: colors.primaryForeground }]}>
                    FINISH WORKOUT
                  </Text>
                  <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* ── Full set list ── */}
        <View style={styles.setsList}>
          <Text style={[styles.setsListTitle, { color: colors.mutedForeground }]}>ALL SETS</Text>

          {workout.sets.map((s) => {
            const isCurrent = s.id === currentSet?.id;
            type IconName = 'circle' | 'check-circle' | 'x-circle' | 'minus-circle';
            let icon: IconName = 'circle';
            let iconColor = colors.border;
            if (s.status === 'completed') { icon = 'check-circle'; iconColor = colors.success; }
            else if (s.status === 'missed') { icon = 'x-circle'; iconColor = colors.destructive; }
            else if (s.status === 'skipped') { icon = 'minus-circle'; iconColor = colors.mutedForeground; }
            else if (isCurrent) { iconColor = colors.primary; }

            return (
              <View
                key={s.id}
                style={[
                  styles.setRow,
                  {
                    backgroundColor: isCurrent ? colors.elevated : colors.card,
                    borderColor: isCurrent ? colors.primary : colors.border,
                    borderWidth: isCurrent ? 1.5 : 1,
                  },
                ]}
              >
                <Feather name={icon} size={14} color={iconColor} />
                <Text style={[styles.setRowEx, { color: isCurrent ? colors.foreground : colors.mutedForeground }]}>
                  {movementShortName(s.movementId ?? s.exercise)}
                </Text>
                <Text style={[styles.setRowNum, { color: colors.mutedForeground }]}>
                  {s.setNumber}/{s.totalSets}
                </Text>
                <Text style={[styles.setRowWeight, { color: isCurrent ? colors.foreground : colors.mutedForeground }]}>
                  {fmtWeight(s.weight)} kg
                </Text>
                <Text style={[styles.setRowReps, { color: colors.mutedForeground }]}>×{s.reps}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showLoadSheet && !!currentSet} transparent animationType="slide" onRequestClose={() => setShowLoadSheet(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowLoadSheet(false)} />
          <View style={[styles.loadSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>ADJUST LOAD</Text>
            <Text style={[styles.sheetCopy, { color: colors.mutedForeground }]}>Override target weight calculated from your 1RM.</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setDraftWeight(String(Math.max(0, Math.round(((Number(draftWeight) || 0) - 0.5) * 10) / 10)))}
                style={[styles.stepperButton, { backgroundColor: colors.elevated, borderColor: colors.border }]}
              ><Text style={[styles.stepperText, { color: colors.foreground }]}>−</Text></Pressable>
              <TextInput
                value={draftWeight}
                onChangeText={setDraftWeight}
                keyboardType="decimal-pad"
                style={[styles.loadInput, { backgroundColor: colors.elevated, borderColor: colors.border, color: colors.foreground }]}
                selectTextOnFocus
              />
              <Pressable
                onPress={() => setDraftWeight(String(Math.round(((Number(draftWeight) || 0) + 0.5) * 10) / 10))}
                style={[styles.stepperButton, { backgroundColor: colors.elevated, borderColor: colors.border }]}
              ><Text style={[styles.stepperText, { color: colors.foreground }]}>+</Text></Pressable>
            </View>
            <Pressable
              onPress={() => {
                const weight = Number(draftWeight);
                if (Number.isFinite(weight) && weight >= 0) setCustomWeight(weight);
                setShowLoadSheet(false);
              }}
              style={({ pressed }) => [styles.sheetConfirm, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
              testID="button-confirm-load"
            ><Text style={[styles.sheetConfirmText, { color: colors.primaryForeground }]}>CONFIRM</Text></Pressable>
            <Pressable onPress={() => { setCustomWeight(null); setShowLoadSheet(false); }} style={styles.resetLoad}>
              <Text style={[styles.resetLoadText, { color: colors.mutedForeground }]}>Reset to calculated load</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, textAlign: 'center' },
  smallBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  smallBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 12 },
  exitBtn: { marginTop: 2, padding: 4 },
  exitContent: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  exitText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  headerCenter: { flex: 1, paddingHorizontal: 12, alignItems: 'center' },
  headerProgramme: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
  headerSession: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', minWidth: 104 },
  headerBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  headerCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.1 },
  headerDivider: { height: 1 },

  // Current set — follows the Figma core workout flow.
  currentSetContainer: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  movementLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.1 },
  exerciseTitle: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -1, marginTop: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 78, marginBottom: 64, justifyContent: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  weightCard: { borderRadius: 24, borderWidth: 1, minHeight: 268, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  weightNumber: { fontSize: 86, fontFamily: 'Inter_700Bold', letterSpacing: -4, lineHeight: 90 },
  weightUnit: { fontSize: 22, fontFamily: 'Inter_400Regular', letterSpacing: 1, marginTop: 2 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 20 },
  targetPill: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
  targetPillText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  repsLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 },
  actionPair: { gap: 10, marginTop: 78 },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    borderRadius: 12,
    gap: 10,
  },
  bigBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  missButtonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center', paddingVertical: 12 },
  missChoiceBox: { marginTop: 4 },
  missChoiceTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  cancelTap: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  cancelText: { fontSize: 14, fontFamily: 'Inter_400Regular' },

  // All done
  allDoneBox: { paddingTop: 40, paddingBottom: 24, alignItems: 'center' },
  allDoneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  allDoneTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },

  // Sets list
  setsList: { paddingHorizontal: 16, paddingTop: 16 },
  setsListTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, marginBottom: 8 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  setRowEx: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  setRowNum: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  setRowWeight: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  setRowReps: { fontSize: 11, fontFamily: 'Inter_400Regular', minWidth: 26, textAlign: 'right' },

  // Adjust load sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  loadSheet: { borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  sheetCopy: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 6 },
  stepper: { flexDirection: 'row', gap: 10, marginTop: 20 },
  stepperButton: { height: 44, width: 48, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 22, fontFamily: 'Inter_600SemiBold' },
  loadInput: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  sheetConfirm: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  sheetConfirmText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  resetLoad: { minHeight: 36, alignItems: 'center', justifyContent: 'flex-end' },
  resetLoadText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  // Completed screen
  completedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  completedIconRing: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  completedEyebrow: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
  completedTitle: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -1, textAlign: 'center', marginTop: 8 },
  completedMeta: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  divider: { height: 1, alignSelf: 'stretch' },
  fullBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', alignSelf: 'stretch' },
  fullBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  outlineBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', alignSelf: 'stretch', borderWidth: 1 },
  outlineBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
