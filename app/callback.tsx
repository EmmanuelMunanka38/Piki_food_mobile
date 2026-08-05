import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const POLL_INTERVAL_MS = 200;
const POLL_TIMEOUT_MS = 20000;

export default function CallbackScreen() {
  const params = useLocalSearchParams<{ error?: string }>();
  const navigated = useRef(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    const redirect = (href: string) => {
      if (navigated.current) return;
      navigated.current = true;
      router.replace(href as any);
    };

    if (params.error) {
      redirect('/(auth)/login');
      return;
    }

    const state = useAuthStore.getState();
    if (state.token) {
      redirect('/(tabs)');
      return;
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const s = useAuthStore.getState();
      if (s.token) {
        clearInterval(interval);
        s.setSocialError(null);
        redirect('/(tabs)');
      } else if (s.socialError) {
        clearInterval(interval);
        setFailure(s.socialError);
      } else if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(interval);
        setFailure('Something went wrong while signing you in. Please try again.');
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [params.error]);

  if (failure) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sign in failed</Text>
        <Text style={styles.message}>{failure}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(auth)/login' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light['surface-container-lowest'],
    gap: 16,
    padding: Spacing['container-padding'],
  },
  text: {
    ...Typography['body-md'],
    color: Colors.light['on-surface-variant'],
  },
  title: {
    ...Typography.h1,
    color: Colors.light['on-surface'],
    fontSize: 22,
    textAlign: 'center',
  },
  message: {
    ...Typography['body-md'],
    color: Colors.light['on-surface-variant'],
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    minWidth: 180,
  },
  buttonText: {
    ...Typography['label-md'],
    color: '#ffffff',
    fontWeight: '700',
  },
});
