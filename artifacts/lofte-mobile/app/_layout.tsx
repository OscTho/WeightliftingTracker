import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setAuthTokenGetter, setBaseUrl, useGetCurrentSession, useLogin, useSignup } from '@workspace/api-client-react';

// Expo runs outside the web proxy — absolute URL required for API calls.
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
const SESSION_KEY = 'lofte.session.token';
setAuthTokenGetter(() => SecureStore.getItemAsync(SESSION_KEY));

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// React 19.2's JSX types do not expose the children/style inherited by the
// gesture-handler declaration, although the native component supports both.
type GestureRootViewProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;
const GestureHandlerRootViewCompat =
  GestureHandlerRootView as unknown as React.ComponentType<GestureRootViewProps>;

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="workout/[id]"
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="programme/[id]"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack>
  );
}

function NativeAuthGate() {
  const session = useGetCurrentSession();
  const login = useLogin();
  const signup = useSignup();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginValue, setLoginValue] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const acceptSession = async (value: { token?: string }) => {
    if (!value.token) {
      setError('Could not create a persistent session. Please try again.');
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, value.token);
    await session.refetch();
  };

  const submit = () => {
    setError('');
    if (mode === 'signup') {
      signup.mutate(
        { data: { username: username.trim(), email: email.trim(), password } },
        { onSuccess: acceptSession, onError: () => setError('Could not create your account. Check your details and try again.') },
      );
      return;
    }
    login.mutate(
      { data: { login: loginValue.trim(), password } },
      { onSuccess: acceptSession, onError: () => setError('Those details did not match. Please try again.') },
    );
  };

  if (session.isLoading || session.isFetching) {
    return <View style={styles.authScreen}><ActivityIndicator color="#e94f37" /></View>;
  }
  if (session.data) return <RootLayoutNav />;

  const pending = login.isPending || signup.isPending;
  return (
    <View style={styles.authScreen}>
      <View style={styles.authCard}>
        <Text style={styles.brand}>LOFTE</Text>
        <Text style={styles.authTitle}>{mode === 'login' ? 'WELCOME BACK.' : 'CREATE ACCOUNT.'}</Text>
        {mode === 'signup' ? (
          <>
            <TextInput style={styles.authInput} placeholder="Username" placeholderTextColor="#777" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <TextInput style={styles.authInput} placeholder="Email" placeholderTextColor="#777" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </>
        ) : (
          <TextInput style={styles.authInput} placeholder="Username or email" placeholderTextColor="#777" value={loginValue} onChangeText={setLoginValue} autoCapitalize="none" />
        )}
        <TextInput style={styles.authInput} placeholder="Password" placeholderTextColor="#777" value={password} onChangeText={setPassword} secureTextEntry />
        {!!error && <Text style={styles.authError}>{error}</Text>}
        <Pressable style={styles.authButton} onPress={submit} disabled={pending}>
          <Text style={styles.authButtonText}>{pending ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
        </Pressable>
        <Pressable onPress={() => { setError(''); setMode(mode === 'login' ? 'signup' : 'login'); }}>
          <Text style={styles.authSwitch}>{mode === 'login' ? 'New to Lofte? Create an account' : 'Already have an account? Sign in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootViewCompat style={styles.root}>
            <KeyboardProvider>
              <NativeAuthGate />
            </KeyboardProvider>
          </GestureHandlerRootViewCompat>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  authScreen: { flex: 1, justifyContent: 'center', backgroundColor: '#101112', padding: 20 },
  authCard: { gap: 14 },
  brand: { color: '#e94f37', fontSize: 20, fontWeight: '700', marginBottom: 26 },
  authTitle: { color: '#f5f5f2', fontSize: 36, fontWeight: '700', marginBottom: 10 },
  authInput: { minHeight: 52, borderWidth: 1, borderColor: '#34383d', borderRadius: 12, backgroundColor: '#1b1e21', color: '#f5f5f2', paddingHorizontal: 16 },
  authButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e94f37', marginTop: 4 },
  authButtonText: { color: '#fff', fontWeight: '700' },
  authSwitch: { color: '#a4a8ad', textAlign: 'center', marginTop: 8 },
  authError: { color: '#ff7b6b' },
});
