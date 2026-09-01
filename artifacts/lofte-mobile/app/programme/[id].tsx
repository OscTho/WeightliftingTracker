import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetProgrammeQueryKey,
  getGetProgrammesQueryKey,
  useCreateProgramme,
  useGetProgramme,
  useUpdateProgramme,
} from '@workspace/api-client-react';
import type { ExerciseName, ProgrammeInput } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { BottomNav } from '@/components/BottomNav';

const exerciseLabels: Record<ExerciseName, string> = {
  snatch: 'Snatch',
  clean_and_jerk: 'Clean & Jerk',
  back_squat: 'Back Squat',
  front_squat: 'Front Squat',
};
const exerciseOptions: ExerciseName[] = ['snatch', 'clean_and_jerk', 'back_squat', 'front_squat'];

const emptyProgramme: ProgrammeInput = {
  name: 'Foundation cycle',
  sessionsPerWeek: 3,
  lengthWeeks: 4,
  sessions: [{ sessionNumber: 1, name: 'Power & positions', exercises: [{ exercise: 'snatch', sets: 4, reps: 2, percentage: 72 }] }],
};

export default function ProgrammeEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const programmeId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const query = useGetProgramme(programmeId, { query: { queryKey: getGetProgrammeQueryKey(programmeId), enabled: !isNew && Number.isFinite(programmeId) } });
  const create = useCreateProgramme();
  const update = useUpdateProgramme();
  const mutation = isNew ? create : update;
  const [form, setForm] = useState<ProgrammeInput>(emptyProgramme);

  useEffect(() => {
    if (!query.data) return;
    setForm({
      name: query.data.name,
      sessionsPerWeek: query.data.sessionsPerWeek,
      lengthWeeks: query.data.lengthWeeks,
      sessions: query.data.sessions.map((session) => ({
        sessionNumber: session.sessionNumber,
        name: session.name,
        exercises: session.exercises.map((exercise) => ({
          exercise: exercise.exercise,
          sets: exercise.sets,
          reps: exercise.reps,
          percentage: exercise.percentage,
        })),
      })),
    });
  }, [query.data]);

  const bottomPad = Platform.OS === 'web' ? 112 : insets.bottom + 24;
  const inputStyle = useMemo(() => [styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }], [colors]);

  const updateSession = (index: number, patch: Partial<ProgrammeInput['sessions'][number]>) =>
    setForm((previous) => ({ ...previous, sessions: previous.sessions.map((session, sessionIndex) => sessionIndex === index ? { ...session, ...patch } : session) }));
  const updateExercise = (sessionIndex: number, exerciseIndex: number, patch: Partial<ProgrammeInput['sessions'][number]['exercises'][number]>) =>
    setForm((previous) => ({
      ...previous,
      sessions: previous.sessions.map((session, currentSessionIndex) => currentSessionIndex === sessionIndex
        ? { ...session, exercises: session.exercises.map((exercise, currentExerciseIndex) => currentExerciseIndex === exerciseIndex ? { ...exercise, ...patch } : exercise) }
        : session),
    }));
  const updateNumber = (field: 'sessionsPerWeek' | 'lengthWeeks', value: string) => {
    const numericValue = Number(value.replace(/[^0-9]/g, ''));
    setForm((previous) => ({ ...previous, [field]: Math.max(1, numericValue || 1) }));
  };

  const save = () => {
    const data: ProgrammeInput = {
      ...form,
      name: form.name.trim() || 'Untitled programme',
      sessions: form.sessions.map((session, index) => ({ ...session, sessionNumber: index + 1 })),
    };
    const onSuccess = (programme: { id: number }) => {
      qc.invalidateQueries({ queryKey: getGetProgrammesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetProgrammeQueryKey(programme.id) });
      router.replace(`/programme/${programme.id}`);
    };
    if (isNew) create.mutate({ data }, { onSuccess });
    else update.mutate({ programmeId, data }, { onSuccess });
  };

  if (!isNew && query.isLoading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }
  if (!isNew && (query.isError || !query.data)) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.mutedForeground }}>Programme not found</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 14, paddingBottom: bottomPad }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>{isNew ? 'New programme' : 'Edit programme'}</Text>
        </Pressable>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>PROGRAMME NAME</Text>
        <TextInput value={form.name} onChangeText={(name) => setForm((previous) => ({ ...previous, name }))} style={inputStyle} placeholder="Programme name" placeholderTextColor={colors.mutedForeground} />

        <View style={styles.twoColumn}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>SESSIONS / WEEK</Text>
            <TextInput value={`${form.sessionsPerWeek} Sessions`} onChangeText={(value) => updateNumber('sessionsPerWeek', value)} keyboardType="number-pad" style={inputStyle} />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PROGRAMME LENGTH</Text>
            <TextInput value={`${form.lengthWeeks} Weeks`} onChangeText={(value) => updateNumber('lengthWeeks', value)} keyboardType="number-pad" style={inputStyle} />
          </View>
        </View>

        {form.sessions.map((session, sessionIndex) => (
          <View key={sessionIndex} style={[styles.sessionCard, { backgroundColor: colors.card }]}>
            <View style={styles.sessionHeader}>
              <Text style={[styles.sessionEyebrow, { color: colors.primary }]}>WEEK {sessionIndex + 1} · SESSION {sessionIndex + 1}</Text>
              {form.sessions.length > 1 && (
                <Pressable onPress={() => setForm((previous) => ({ ...previous, sessions: previous.sessions.filter((_, index) => index !== sessionIndex) }))}>
                  <Feather name="trash-2" size={18} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <TextInput value={session.name} onChangeText={(name) => updateSession(sessionIndex, { name })} style={[inputStyle, styles.sessionInput]} placeholder="Session name" placeholderTextColor={colors.mutedForeground} />
            {session.exercises.map((exercise, exerciseIndex) => (
              <Pressable
                key={exerciseIndex}
                onPress={() => updateExercise(sessionIndex, exerciseIndex, { exercise: exerciseOptions[(exerciseOptions.indexOf(exercise.exercise) + 1) % exerciseOptions.length] })}
                style={[styles.exerciseRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exerciseIndex + 1}. {exerciseLabels[exercise.exercise]}</Text>
                <Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>{exercise.sets} sets × {exercise.reps} reps @ {exercise.percentage}%</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => updateSession(sessionIndex, { exercises: [...session.exercises, { exercise: 'snatch', sets: 3, reps: 2, percentage: 70 }] })} style={styles.addMovement}>
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <Text style={[styles.addText, { color: colors.primary }]}>Add movement</Text>
            </Pressable>
          </View>
        ))}

        <Pressable onPress={() => setForm((previous) => ({ ...previous, sessions: [...previous.sessions, { sessionNumber: previous.sessions.length + 1, name: `Session ${previous.sessions.length + 1}`, exercises: [{ exercise: 'snatch', sets: 3, reps: 2, percentage: 70 }] }] }))} style={[styles.addSession, { borderColor: colors.primary }]}>
          <Text style={[styles.addSessionText, { color: colors.primary }]}>ADD SESSION</Text>
        </Pressable>
        <Pressable onPress={save} disabled={mutation.isPending} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: pressed || mutation.isPending ? 0.82 : 1 }]}>
          {mutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.saveText, { color: colors.primaryForeground }]}>SAVE PROGRAMME</Text>}
        </Pressable>
      </ScrollView>
      <BottomNav active="plans" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, marginBottom: 24 },
  backText: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  label: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6, marginBottom: 7, marginTop: 14 },
  input: { height: 44, borderRadius: 9, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  twoColumn: { flexDirection: 'row', gap: 14 },
  half: { flex: 1 },
  sessionCard: { borderRadius: 14, padding: 16, marginTop: 24 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionEyebrow: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  sessionInput: { marginBottom: 10 },
  exerciseRow: { paddingVertical: 9, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  exerciseName: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  exerciseMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  addMovement: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  addText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addSession: { borderWidth: 1, borderRadius: 11, minHeight: 48, marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  addSessionText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  save: { borderRadius: 11, minHeight: 48, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});