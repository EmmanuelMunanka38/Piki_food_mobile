import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        } as any,
        style,
      ]}
    />
  );
}

export function MapSkeleton() {
  return (
    <View style={styles.mapSkeleton}>
      <SkeletonLoader width="100%" height={800} borderRadius={0} />
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View style={styles.categoryRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.categoryItem}>
          <SkeletonLoader width={56} height={56} borderRadius={BorderRadius.full} />
          <SkeletonLoader width={48} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <View style={styles.restaurantCard}>
      <SkeletonLoader width="100%" height={120} borderRadius={BorderRadius.md} />
      <View style={styles.restaurantCardInfo}>
        <SkeletonLoader width="70%" height={18} />
        <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
        <View style={styles.restaurantCardMeta}>
          <SkeletonLoader width={60} height={12} />
          <SkeletonLoader width={80} height={12} />
        </View>
      </View>
    </View>
  );
}

export function DealCardSkeleton() {
  return (
    <View style={styles.dealCard}>
      <SkeletonLoader width={96} height={24} borderRadius={BorderRadius.full} />
      <SkeletonLoader width="80%" height={20} style={{ marginTop: Spacing.md }} />
      <SkeletonLoader width="55%" height={14} style={{ marginTop: Spacing.sm }} />
      <SkeletonLoader width={112} height={38} borderRadius={BorderRadius.full} style={{ marginTop: Spacing.md }} />
    </View>
  );
}

export function BottomSheetSkeleton() {
  return (
    <View style={styles.bottomSheetSkeleton}>
      <SkeletonLoader width={48} height={4} borderRadius={2} style={styles.pullHandle} />
      <View style={styles.riderRow}>
        <SkeletonLoader width={56} height={56} borderRadius={BorderRadius.md} />
        <View style={styles.riderInfo}>
          <SkeletonLoader width={140} height={18} />
          <SkeletonLoader width={100} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={3} borderRadius={1.5} style={{ marginVertical: Spacing.md }} />
      <View style={styles.stepsRow}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={i} width={60} height={14} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.light['surface-container-high'],
  },
  mapSkeleton: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 2,
  },
  restaurantCard: {
    width: 240,
    marginRight: Spacing.md,
  },
  dealCard: {
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  restaurantCardInfo: {
    padding: Spacing.sm,
  },
  restaurantCardMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  bottomSheetSkeleton: {
    padding: Spacing['container-padding'],
    paddingBottom: 40,
  },
  pullHandle: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  riderInfo: {
    flex: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
});
