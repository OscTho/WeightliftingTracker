import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGetProgrammes } from '@workspace/api-client-react';

export default function PlansScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: programmes, isLoading, isError, refetch, isFetching } = useGetProgrammes();
  const topPad = Platform.OS === 'web' ? 67 + 16 : 16;
  const bottomPad = Platform.OS === 'web' ? 96 : insets.bottom + 72;

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={30} color={colors.mutedForeground} />
        <Text style={[styles.error, { color: colors.mutedForeground }]}>Couldn’t load programmes</Text>
        <Pressable onPress={() => refetch()} style={[styles.retry, { borderColor: colors.border }]}>
          <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>TRAINING PLANS</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>PROGRAMME{'\n'}ROOM.</Text>
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>Build a week you can execute when the room is loud.</Text>

      <Pressable
        onPress={() => router.push('/programme/new')}
        style={({ pressed }) => [styles.newButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
        testID="button-new-programme"
      >
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text style={[styles.newButtonText, { color: colors.primaryForeground }]}>NEW PROGRAMME</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>YOUR PROGRAMMES</Text>
      {(programmes?.length ?? 0) === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="clipboard" size={24} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No programme yet</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Create your first training cycle to start logging sessions.</Text>
        </View>
      ) : (
        programmes!.map((programme) => (
          <Pressable
            key={programme.id}
            onPress={() => router.push(`/programme/${programme.id}`)}
            style={({ pressed }) => [styles.programmeCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }]}
            testID={`card-programme-${programme.id}`}
          >
            <Text style={[styles.cardEyebrow, { color: colors.primary }]}>TRAINING PROGRAMME</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{programme.name.toUpperCase()}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{programme.sessionsPerWeek} SESSIONS / WEEK · {programme.lengthWeeks} WEEKS</Text>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.3, marginBottom: 6 },
  title: { fontSize: 38, lineHeight: 39, fontFamily: 'Inter_700Bold', letterSpacing: -1.6 },
  intro: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', marginTop: 12, maxWidth: 330 },
  newButton: { minHeight: 48, borderRadius: 12, marginTop: 26, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  newButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.4, marginTop: 30, marginBottom: 14 },
  programmeCard: { borderRadius: 14, borderWidth: 1, padding: 20, marginBottom: 12 },
  cardEyebrow: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 8 },
  cardTitle: { fontSize: 24, lineHeight: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#343941', paddingTop: 14, marginTop: 18 },
  cardMeta: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 26, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12 },
  emptyCopy: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, textAlign: 'center', marginTop: 6 },
  error: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 12 },
  retry: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 10, marginTop: 16 },
  retryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});