import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const PIZ_IMAGE = require('@/assets/images/piz.png');

interface DealCardProps {
  onOrderPress?: () => void;
}

export default function DealCard({ onOrderPress }: DealCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.patternCircleLarge} />
      <View style={styles.patternCircleMedium} />
      <View style={styles.patternDotTop} />
      <View style={styles.patternDotBottom} />

      <View style={styles.content}>
        <View style={styles.discountPill}>
          <Text style={styles.discountText}>45% OFF</Text>
        </View>
        <Text style={styles.heading}>Grab Our Exclusive Food Discounts Now!</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onOrderPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Order Now</Text>
        </TouchableOpacity>
      </View>

      <Image source={PIZ_IMAGE} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    borderRadius: 16,
    backgroundColor: '#006d36',
    overflow: 'hidden',
    ...Shadows.md,
  },
  patternCircleLarge: {
    position: 'absolute',
    top: -50,
    right: 40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  patternCircleMedium: {
    position: 'absolute',
    bottom: -34,
    right: 8,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  patternDotTop: {
    position: 'absolute',
    top: 14,
    left: 130,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  patternDotBottom: {
    position: 'absolute',
    bottom: 16,
    left: 30,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    padding: Spacing.lg,
    paddingRight: 100,
    zIndex: 1,
  },
  discountPill: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#fdc003',
  },
  discountText: {
    ...Typography['label-sm'],
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#6c5000',
  },
  heading: {
    ...Typography.h2,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: '#1F1F1F',
    ...Shadows.sm,
  },
  ctaText: {
    ...Typography['label-md'],
    fontWeight: '700',
    color: '#ffffff',
  },
  image: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 118,
    height: 118,
    borderRadius: 16,
  },
});
