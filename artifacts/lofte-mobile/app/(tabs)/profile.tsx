import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getGetCurrentSessionQueryKey,
  getGetDashboardQueryKey,
  getGetProfileQueryKey,
  useChangePassword,
  useGetProfile,
  useLogout,
  useSaveProfile,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const SESSION_KEY = 'lofte.session.token';

const INCREMENTS: Array<1 | 2 | 2.5> = [1, 2, 2.5];

const PB_FIELDS = [
  { label: 'Snatch', key: 'snatch' as const },
  { label: 'Clean & Jerk', key: 'cj' as const },
  { label: 'Back Squat', key: 'bsq' as const },
  { label: 'Front Squat', key: 'fsq' as const },
] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useGetProfile();
  const saveProfile = useSaveProfile();
  const changePassword = useChangePassword();
  const logout = useLogout();

  const [name, setName] = useState('');
  const [pbs, setPbs] = useState({ snatch: '0', cj: '0', bsq: '0', fsq: '0' });
  const [increment, setIncrement] = useState<1 | 2 | 2.5>(2.5);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Populate form when profile data arrives
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPbs({
        snatch: String(profile.snatchPb),
        cj: String(profile.cleanJerkPb),
        bsq: String(profile.backSquatPb),
        fsq: String(profile.frontSquatPb),
      });
      setIncrement(profile.roundingIncrement as 1 | 2 | 2.5);
    }
  }, [profile]);

  const setPbField = (key: keyof typeof pbs, value: string) => {
    setPbs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveProfile.mutate(
      {
        data: {
          name: name.trim() || 'Athlete',
          snatchPb: Number(pbs.snatch) || 0,
          cleanJerkPb: Number(pbs.cj) || 0,
          backSquatPb: Number(pbs.bsq) || 0,
          frontSquatPb: Number(pbs.fsq) || 0,
          roundingIncrement: increment,
        },
      },
      {
        onSuccess: (updated) => {
          qc.setQueryData(getGetProfileQueryKey(), updated);
          qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        qc.clear();
      },
    });
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordChanged(false);
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError('Password must be between 8 and 128 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    changePassword.mutate(
      { data: { password: newPassword } },
      {
        onSuccess: async (replacementSession) => {
          if (!replacementSession.token) {
            setPasswordError('Could not create a persistent session. Please try again.');
            return;
          }
          await SecureStore.setItemAsync(SESSION_KEY, replacementSession.token);
          qc.setQueryData(getGetCurrentSessionQueryKey(), replacementSession);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordChanged(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: () => setPasswordError('Could not change your password. Please try again.'),
      },
    );
  };

  const topPad = Platform.OS === 'web' ? 67 + 16 : 16;
  const bottomPad = Platform.OS === 'web' ? 84 + 16 : insets.bottom + 72;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const inputBase = {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    color: colors.foreground,
    borderRadius: colors.radius,
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={60}
    >
      {/* Athlete name */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ATHLETE</Text>
      <TextInput
        style={[styles.textInput, inputBase]}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="words"
        returnKeyType="done"
        testID="input-name"
      />

      {/* Personal bests */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 28 }]}>
        PERSONAL BESTS
      </Text>

      {PB_FIELDS.map((field) => (
        <View key={field.key} style={styles.pbRow}>
          <Text style={[styles.pbLabel, { color: colors.foreground }]}>{field.label}</Text>
          <View style={styles.pbInputWrapper}>
            <TextInput
              style={[styles.pbInput, inputBase]}
              value={pbs[field.key]}
              onChangeText={(v) => setPbField(field.key, v)}
              keyboardType="numeric"
              returnKeyType="done"
              selectTextOnFocus
              testID={`input-${field.key}`}
            />
            <Text style={[styles.pbUnit, { color: colors.mutedForeground }]}>kg</Text>
          </View>
        </View>
      ))}

      {/* Rounding increment */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 28 }]}>
        WEIGHT ROUNDING
      </Text>
      <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
        Weights are rounded to the nearest increment
      </Text>
      <View style={styles.incrementRow}>
        {INCREMENTS.map((inc) => {
          const active = increment === inc;
          return (
            <Pressable
              key={inc}
              style={({ pressed }) => [
                styles.incrementBtn,
                {
                  backgroundColor: active ? colors.primary : colors.elevated,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                setIncrement(inc);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.incrementText,
                  { color: active ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {inc} kg
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Save */}
      <Pressable
        style={({ pressed }) => [
          styles.saveBtn,
          {
            backgroundColor: saved ? colors.success : colors.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={handleSave}
        disabled={saveProfile.isPending}
        testID="button-save-profile"
      >
        {saveProfile.isPending ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : saved ? (
          <>
            <Feather name="check" size={16} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>SAVED</Text>
          </>
        ) : (
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>SAVE</Text>
        )}
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 28 }]}>
        SECURITY
      </Text>
      <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
        Changing your password signs out every other device.
      </Text>
      <TextInput
        style={[styles.textInput, inputBase, styles.passwordInput]}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New password"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        testID="input-new-password"
      />
      <TextInput
        style={[styles.textInput, inputBase, styles.passwordInput]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleChangePassword}
        testID="input-confirm-new-password"
      />
      {!!passwordError && <Text style={[styles.feedbackText, { color: colors.destructive }]}>{passwordError}</Text>}
      {passwordChanged && <Text style={[styles.feedbackText, { color: colors.success }]}>Password changed. You are still signed in.</Text>}
      <Pressable
        style={({ pressed }) => [
          styles.passwordBtn,
          { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={handleChangePassword}
        disabled={changePassword.isPending}
        testID="button-change-password"
      >
        {changePassword.isPending
          ? <ActivityIndicator color={colors.foreground} size="small" />
          : <Text style={[styles.passwordBtnText, { color: colors.foreground }]}>CHANGE PASSWORD</Text>}
      </Pressable>

      <Pressable
        style={[styles.logoutBtn, { borderColor: colors.border }]}
        onPress={handleLogout}
        disabled={logout.isPending}
        testID="button-logout"
      >
        <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>
          {logout.isPending ? 'SIGNING OUT…' : 'SIGN OUT'}
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10, marginTop: -6 },
  textInput: {
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
  },
  passwordInput: { marginBottom: 10 },
  feedbackText: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 10 },
  passwordBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  passwordBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pbLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  pbInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pbInput: {
    padding: 10,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    borderWidth: 1,
    width: 88,
    textAlign: 'right',
  },
  pbUnit: { fontSize: 14, fontFamily: 'Inter_400Regular', width: 22 },
  incrementRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  incrementBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  incrementText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  logoutBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  logoutText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
});
