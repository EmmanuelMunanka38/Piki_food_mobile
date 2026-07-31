import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface RestaurantStatusBannerProps {
  isOpen: boolean;
  customMessage?: string;
  nextOpenTime?: string;
  onViewMenuPress?: () => void;
}

export default function RestaurantStatusBanner({
  isOpen,
  customMessage,
  nextOpenTime,
  onViewMenuPress,
}: RestaurantStatusBannerProps) {
  if (isOpen) return null;

  const subtitle =
    customMessage?.trim() ||
    (nextOpenTime
      ? `We're closed right now. We open again at ${nextOpenTime}.`
      : 'Please check back during our opening hours.');

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="clock-outline" size={22} color="#D97706" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Restaurant is currently closed</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {onViewMenuPress && (
        <TouchableOpacity
          style={styles.footer}
          onPress={onViewMenuPress}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Text style={styles.footerText}>View Menu & Pre-order</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#92400E" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: {
    ...Typography['label-md'],
    fontWeight: '700',
    color: '#92400E',
  },
  subtitle: {
    ...Typography['body-sm'],
    color: '#B45309',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
  },
  footerText: {
    ...Typography['label-md'],
    fontWeight: '700',
    color: '#92400E',
  },
});
