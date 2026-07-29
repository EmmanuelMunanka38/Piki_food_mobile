import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Typography, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const routeByRole = (role: string) => {
  switch (role) {
    case 'driver':
      router.replace('/driver');
      break;
    case 'restaurant_owner':
      router.replace('/restaurant');
      break;
    default:
      router.replace('/(tabs)');
  }
};

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;
  const navigatedRef = useRef(false);

  useEffect(() => {
    const { user: u } = useAuthStore.getState();
    if (u && !navigatedRef.current) {
      navigatedRef.current = true;
      routeByRole(u.role);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(circleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(barAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace('/onboarding');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />

      <Animated.View
        style={[
          styles.bgCircle1,
          {
            opacity: circleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.12],
            }),
            transform: [{
              scale: circleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle2,
          {
            opacity: circleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
            transform: [{
              scale: circleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle3,
          {
            opacity: circleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.06],
            }),
          },
        ]}
      />

      <View style={styles.topDecoration}>
        <View style={styles.topBar} />
      </View>

      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoStack}>
          <Text style={styles.logoPiki}>PIKI</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoFood}>FOOD</Text>
        </View>
        <Text style={styles.tagline}>Haraka Sana</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.footerText}>Brought to you by Piki Tech</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['container-padding'],
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0fa958',
  },
  gradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#006d36',
    opacity: 0.85,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#006d36',
  },
  bgCircle1: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#fdc003',
  },
  bgCircle2: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#ffffff',
  },
  bgCircle3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.35,
    left: SCREEN_WIDTH * 0.5,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fdc003',
  },
  topDecoration: {
    width: '100%',
    alignItems: 'center',
    opacity: 0.2,
    marginTop: Spacing.md,
  },
  topBar: {
    width: 64,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  brandWrapper: {
    alignItems: 'center',
  },
  logoStack: {
    alignItems: 'center',
    gap: 4,
  },
  logoDivider: {
    width: 40,
    height: 3,
    backgroundColor: '#fdc003',
    borderRadius: 2,
    marginVertical: 2,
  },
  logoPiki: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fdc003',
    letterSpacing: 8,
    lineHeight: 60,
  },
  logoFood: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 12,
    lineHeight: 32,
  },
  tagline: {
    ...Typography['label-md'],
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
    maxWidth: 320,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fdc003',
    borderRadius: 3,
    shadowColor: '#fdc003',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  footerText: {
    ...Typography['body-sm'],
    color: 'rgba(255,255,255,0.5)',
  },
});
