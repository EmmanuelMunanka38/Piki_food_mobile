import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { PikiButton } from '@/components/ui/PikiButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Images } from '@/constants/images';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - Spacing['container-padding'] * 2;

const slides = [
  {
    id: '1',
    image: Images.onboarding[0],
    title: 'Premium Dining at Home',
    subtitle: 'Explore a curated selection of the finest restaurants across Dar es Salaam and Arusha.',
  },
  {
    id: '2',
    image: Images.onboarding[1],
    title: 'Fast delivery across Tanzania',
    subtitle: 'Your favorite local delicacies delivered to your doorstep in record time, every day.',
  },
  {
    id: '3',
    image: Images.onboarding[2],
    title: 'Real-time tracking',
    subtitle: "Watch your meal's journey from the kitchen to your hand with precision GPS tracking.",
  },
];

export default function OnboardingScreen() {
  const theme = 'light';
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleSignUp = () => {
    router.replace('/login?mode=sign-up');
  };

  const handleLogin = () => {
    router.replace('/login?mode=sign-in');
  };

  const handleGuest = () => {
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <View style={[styles.imageWrapper, { width: IMAGE_SIZE, height: IMAGE_SIZE }]}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </View>
      <View style={styles.slideContent}>
        <Text style={[styles.title, { color: Colors[theme]['on-surface'] }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { color: Colors[theme]['on-surface-variant'] }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].surface }]}>
      <View style={styles.header}>
        <Text style={[styles.brandName, { color: Colors[theme].primary }]}>
          Piki Food
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? Colors[theme].primary
                      : Colors[theme]['surface-variant'],
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <PikiButton
            title="Sign Up"
            onPress={handleSignUp}
            fullWidth
          />
          <PikiButton
            title="Login"
            variant="outline"
            onPress={handleLogin}
            fullWidth
          />
        </View>

        <TouchableOpacity onPress={handleGuest} style={styles.guestButton}>
          <Text style={[styles.guestText, { color: Colors[theme]['on-surface-variant'] }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  brandName: {
    ...Typography.display,
    fontSize: 28,
    letterSpacing: -0.3,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  imageWrapper: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  slideContent: {
    paddingHorizontal: Spacing['container-padding'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography['body-md'],
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: Spacing['container-padding'],
    paddingBottom: 60,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    gap: Spacing.sm,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  guestText: {
    ...Typography['label-sm'],
    fontWeight: '500',
  },
});
