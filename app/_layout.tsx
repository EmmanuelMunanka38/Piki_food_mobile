import { useEffect, useState, Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useCartStore } from '@/store/cartStore';
import { setImageCDN } from '@/services/imageOptimizer';

SplashScreen.preventAutoHideAsync();

const FONT_TIMEOUT_MS = 3000;

class ErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>Please restart the app and try again.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    const cdn = process.env.EXPO_PUBLIC_IMAGE_CDN;
    if (cdn) setImageCDN(cdn);
  }, []);

  useEffect(() => {
    useLocationStore.getState().initialize();
    setTimeout(() => {
      useLocationStore.getState().startWatching();
      useLocationStore.getState().reverseGeocodeCurrent();
    }, 2000);
  }, []);

  useEffect(() => {
    if (hydrated && useAuthStore.getState().token) {
      useCartStore.getState().loadCart();
    }
  }, [hydrated]);

  const fontsReady = fontsLoaded || fontError || fontTimedOut;
  const ready = fontsReady && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <Slot />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf9f8', padding: 32 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#3d4a3e', textAlign: 'center' },
});
