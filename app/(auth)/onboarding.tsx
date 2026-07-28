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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

const logo = require('@/assets/images/logo.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'map-marker' as const,
    title: 'Discover Restaurants Nearby',
    subtitle: 'Find top-rated local food, explore curated dining spots, and track locations near you in real-time.',
  },
  {
    id: '2',
    icon: 'food-variant' as const,
    title: 'Premium Dining at Home',
    subtitle: 'Explore a curated selection of the finest restaurants across Dar es Salaam and Arusha.',
  },
  {
    id: '3',
    icon: 'silverware-fork-knife' as const,
    title: 'Fast Delivery Across Tanzania',
    subtitle: 'Your favorite local delicacies delivered to your doorstep in record time, every day.',
  },
];

const allIcons = ['map-marker', 'food-variant', 'silverware-fork-knife'] as const;

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLastSlide = currentIndex === slides.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (isLastSlide) {
      router.replace('/login?mode=sign-up');
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = () => {
    router.replace('/login?mode=sign-in');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.heroSection}>
          {allIcons.map((iconName, i) => {
            const isHero = iconName === item.icon;
            const size = isHero ? 64 : 28;
            const containerSize = isHero ? 120 : 56;

            return (
              <Animated.View
                key={iconName}
                entering={isHero ? FadeIn.duration(400) : undefined}
                style={[
                  styles.iconBadge,
                  {
                    width: containerSize,
                    height: containerSize,
                    borderRadius: containerSize / 2,
                    backgroundColor: isHero
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.08)',
                    borderColor: isHero
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(255,255,255,0.12)',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={size}
                  color={isHero ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                />
              </Animated.View>
            );
          })}
        </View>

        <Animated.View
          key={`text-${item.id}`}
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.textContent}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
        <Text style={[styles.skipText, { opacity: isLastSlide ? 0 : 1 }]}>
          Skip
        </Text>
      </TouchableOpacity>

      <View style={styles.brandTop}>
        <Image source={logo} style={styles.brandLogo} contentFit="contain" />
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
        keyExtractor={(item) => item.id}
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
                      ? '#ffffff'
                      : 'rgba(255,255,255,0.3)',
                  width: index === currentIndex ? 28 : 10,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          {!isLastSlide && (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#006d36" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006d36',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing['container-padding'],
    zIndex: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    ...Typography['label-md'],
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  brandTop: {
    position: 'absolute',
    top: 56,
    left: Spacing['container-padding'],
    zIndex: 20,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['container-padding'],
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl + 16,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  textContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    ...Typography['body-md'],
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: Spacing['container-padding'],
    paddingBottom: 64,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#ffffff',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  nextButtonText: {
    ...Typography['label-md'],
    fontSize: 16,
    fontWeight: '700',
    color: '#006d36',
  },
});
