import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
  getGetMovementsQueryKey,
  useCreateMovement,
  useCreateProgramme,
  useGetMovements,
  useGetProgramme,
  useUpdateProgramme,
} from '@workspace/api-client-react';
import type { Movement, ProgrammeInput } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { BottomNav } from '@/components/BottomNav';

const COMMON_MOVEMENTS = [
  { id: 'snatch', name: 'Snatch' },
  { id: 'clean', name: 'Clean' },
  { id: 'jerk', name: 'Jerk' },
  { id: 'back_squat', name: 'Back Squat' },
  { id: 'front_squat', name: 'Front Squat' },
  { id: 'clean_pull', name: 'Clean Pull' },
  { id: 'snatch_pull', name: 'Snatch Pull' },
];
const MOVEMENT_CATEGORIES = ['Competition Lifts', 'Snatch Variations', 'Clean Variations', 'Jerk Variations', 'Squats', 'Accessories'];

const emptyProgramme: ProgrammeInput = {
  name: 'Foundation cycle',
  sessionsPerWeek: 3,
  lengthWeeks: 4,
  sessions: [{ sessionNumber: 1, name: 'Power & positions', exercises: [{ movementId: 'snatch', sets: 4, reps: 2, percentage: 72 }] }],
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
  const movementsQuery = useGetMovements();
  const createMovement = useCreateMovement();
  const mutation = isNew ? create : update;
  const [form, setForm] = useState<ProgrammeInput>(emptyProgramme);
  const [addingToSession, setAddingToSession] = useState<number | null>(null);
  const [movementTarget, setMovementTarget] = useState<{ sessionIndex: number; exerciseIndex: number } | null>(null);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('All');
  const [customFormVisible, setCustomFormVisible] = useState(false);
  const [customMovement, setCustomMovement] = useState({ name: '', category: MOVEMENT_CATEGORIES[0], description: '' });

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
          movementId: exercise.movementId ?? exercise.exercise ?? 'snatch',
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

  const movements = movementsQuery.data ?? [];
  const movementName = (id?: string) => movements.find((movement) => movement.id === id)?.name ?? COMMON_MOVEMENTS.find((movement) => movement.id === id)?.name ?? id?.replace(/_/g, ' ') ?? 'Snatch';
  const commonMovements = COMMON_MOVEMENTS.map((movement) => movements.find((item) => item.id === movement.id) ?? movement);
  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = movement.name.toLowerCase().includes(librarySearch.toLowerCase().trim());
    return matchesSearch && (libraryCategory === 'All' || movement.category === libraryCategory);
  });

  const chooseMovement = (movement: Movement | { id: string }) => {
    if (movementTarget) {
      updateExercise(movementTarget.sessionIndex, movementTarget.exerciseIndex, { movementId: movement.id });
    } else if (addingToSession !== null) {
      const session = form.sessions[addingToSession];
      updateSession(addingToSession, { exercises: [...session.exercises, { movementId: movement.id, sets: 3, reps: 2, percentage: 70 }] });
    }
    setMovementTarget(null);
    setAddingToSession(null);
    setLibraryVisible(false);
    setCustomFormVisible(false);
  };

  const submitCustomMovement = () => {
    const name = customMovement.name.trim();
    if (!name) return;
    createMovement.mutate(
      { data: { name, category: customMovement.category, description: customMovement.description.trim() || undefined } },
      {
        onSuccess: (movement) => {
          qc.invalidateQueries({ queryKey: getGetMovementsQueryKey() });
          chooseMovement(movement);
          setCustomMovement({ name: '', category: MOVEMENT_CATEGORIES[0], description: '' });
        },
      },
    );
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
                onPress={() => { setMovementTarget({ sessionIndex, exerciseIndex }); setLibraryVisible(true); }}
                style={[styles.exerciseRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exerciseIndex + 1}. {movementName(exercise.movementId ?? exercise.exercise)}</Text>
                <Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>{exercise.sets} sets × {exercise.reps} reps @ {exercise.percentage}%</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => { setMovementTarget(null); setAddingToSession(sessionIndex); }} style={styles.addMovement}>
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <Text style={[styles.addText, { color: colors.primary }]}>Add movement</Text>
            </Pressable>
            {addingToSession === sessionIndex && (
              <View style={[styles.quickPicker, { borderColor: colors.primary, backgroundColor: colors.background }]}>
                <Text style={[styles.quickPickerLabel, { color: colors.primary }]}>ADD MOVEMENT</Text>
                <View style={styles.quickGrid}>
                  {commonMovements.map((movement) => (
                    <Pressable key={movement.id} onPress={() => chooseMovement(movement)} style={[styles.quickMovement, { borderColor: colors.border }]}>
                      <Text style={[styles.quickMovementText, { color: colors.foreground }]}>{movement.name}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => setLibraryVisible(true)} style={[styles.libraryButton, { borderColor: colors.border }]}>
                  <Text style={[styles.libraryButtonText, { color: colors.foreground }]}>EXPLORE MOVEMENT LIBRARY</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}

        <Pressable onPress={() => setForm((previous) => ({ ...previous, sessions: [...previous.sessions, { sessionNumber: previous.sessions.length + 1, name: `Session ${previous.sessions.length + 1}`, exercises: [{ movementId: 'snatch', sets: 3, reps: 2, percentage: 70 }] }] }))} style={[styles.addSession, { borderColor: colors.primary }]}>
          <Text style={[styles.addSessionText, { color: colors.primary }]}>ADD SESSION</Text>
        </Pressable>
        <Pressable onPress={save} disabled={mutation.isPending} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: pressed || mutation.isPending ? 0.82 : 1 }]}>
          {mutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.saveText, { color: colors.primaryForeground }]}>SAVE PROGRAMME</Text>}
        </Pressable>
      </ScrollView>
      <Modal visible={libraryVisible} transparent animationType="slide" onRequestClose={() => setLibraryVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.librarySheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{customFormVisible ? 'ADD NEW MOVEMENT' : 'MOVEMENT LIBRARY'}</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>{customFormVisible ? 'Create a private movement for your library.' : 'Search the full Lofte movement library.'}</Text>
              </View>
              <Pressable onPress={() => { setLibraryVisible(false); setCustomFormVisible(false); }}><Feather name="x" size={22} color={colors.mutedForeground} /></Pressable>
            </View>
            {customFormVisible ? (
              <View>
                <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>MOVEMENT NAME</Text>
                <TextInput value={customMovement.name} onChangeText={(name) => setCustomMovement((current) => ({ ...current, name }))} placeholder="Enter movement name" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                  {MOVEMENT_CATEGORIES.map((category) => (
                    <Pressable key={category} onPress={() => setCustomMovement((current) => ({ ...current, category }))} style={[styles.categoryChip, { borderColor: customMovement.category === category ? colors.primary : colors.border, backgroundColor: customMovement.category === category ? colors.primary : 'transparent' }]}>
                      <Text style={[styles.categoryText, { color: customMovement.category === category ? colors.primaryForeground : colors.mutedForeground }]}>{category}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>DESCRIPTION <Text style={{ fontFamily: 'Inter_400Regular' }}>(OPTIONAL)</Text></Text>
                <TextInput value={customMovement.description} onChangeText={(description) => setCustomMovement((current) => ({ ...current, description }))} placeholder="Add description" placeholderTextColor={colors.mutedForeground} style={[inputStyle, styles.descriptionInput]} multiline maxLength={240} />
                <View style={styles.modalActions}>
                  <Pressable onPress={() => setCustomFormVisible(false)} style={[styles.libraryButton, { borderColor: colors.border, flex: 1 }]}><Text style={[styles.libraryButtonText, { color: colors.foreground }]}>BACK</Text></Pressable>
                  <Pressable onPress={submitCustomMovement} disabled={createMovement.isPending} style={[styles.save, { backgroundColor: colors.primary, flex: 1, opacity: createMovement.isPending ? 0.7 : 1 }]}><Text style={[styles.saveText, { color: colors.primaryForeground }]}>ADD MOVEMENT</Text></Pressable>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.searchWrap}>
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <TextInput value={librarySearch} onChangeText={setLibrarySearch} placeholder="Search movements" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                  {['All', ...MOVEMENT_CATEGORIES].map((category) => (
                    <Pressable key={category} onPress={() => setLibraryCategory(category)} style={[styles.categoryChip, { borderColor: libraryCategory === category ? colors.primary : colors.border, backgroundColor: libraryCategory === category ? colors.primary : 'transparent' }]}>
                      <Text style={[styles.categoryText, { color: libraryCategory === category ? colors.primaryForeground : colors.mutedForeground }]}>{category}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <ScrollView style={styles.libraryResults} keyboardShouldPersistTaps="handled">
                  {filteredMovements.map((movement) => (
                    <Pressable key={movement.id} onPress={() => chooseMovement(movement)} style={[styles.libraryRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.libraryMovementName, { color: colors.foreground }]}>{movement.name}</Text>
                      <Text style={[styles.libraryMovementCategory, { color: colors.mutedForeground }]}>{movement.category}</Text>
                    </Pressable>
                  ))}
                  {filteredMovements.length === 0 && <Text style={[styles.noResults, { color: colors.mutedForeground }]}>No movements found.</Text>}
                </ScrollView>
                <Pressable onPress={() => setCustomFormVisible(true)} style={[styles.libraryButton, { borderColor: colors.border }]}>
                  <Text style={[styles.libraryButtonText, { color: colors.foreground }]}>+ ADD NEW MOVEMENT</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  quickPicker: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12, gap: 10 },
  quickPickerLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  quickMovement: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 9, minWidth: '30%' },
  quickMovementText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  libraryButton: { borderWidth: 1, borderRadius: 9, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  libraryButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  librarySheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, maxHeight: '88%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#343941', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  sheetTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.6 },
  sheetSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  sheetLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6, marginBottom: 7, marginTop: 12 },
  searchWrap: { borderWidth: 1, borderColor: '#343941', borderRadius: 9, minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, height: 42, fontSize: 14, fontFamily: 'Inter_400Regular' },
  categoryRow: { gap: 7, paddingBottom: 6 },
  categoryChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  categoryText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  libraryResults: { maxHeight: 360, marginTop: 6, marginBottom: 12 },
  libraryRow: { minHeight: 48, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  libraryMovementName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  libraryMovementCategory: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  noResults: { textAlign: 'center', paddingVertical: 28, fontSize: 14, fontFamily: 'Inter_400Regular' },
  descriptionInput: { height: 78, paddingTop: 12, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  addSession: { borderWidth: 1, borderRadius: 11, minHeight: 48, marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  addSessionText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  save: { borderRadius: 11, minHeight: 48, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});