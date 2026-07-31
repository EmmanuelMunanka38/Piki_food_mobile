import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

interface BrandedHeaderProps {
  userName?: string;
  unreadNotifications?: number;
  flat?: boolean;
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
  overlay?: ReactNode;
  children?: ReactNode;
}

function getGreeting(): string {
  const h = new Date(Date.now() + 3 * 3600000).getUTCHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function BrandedHeader({
  userName,
  unreadNotifications = 0,
  flat = false,
  onNotificationsPress,
  onSearchPress,
  overlay,
  children,
}: BrandedHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const displayName = userName || user?.name || 'Guest';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors.light.primary, paddingTop: insets.top + Spacing.sm },
      ]}
    >
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.greetingName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationsPress}
            activeOpacity={0.8}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#ffffff" />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSearchPress}
            activeOpacity={0.8}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="magnify" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.contentSheet,
          { backgroundColor: Colors.light.background },
          flat ? styles.contentSheetFlat : styles.contentSheetRounded,
        ]}
      >
        {children}
      </View>

      {overlay && (
        <View style={[styles.overlayWrap, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
          {overlay}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing['container-padding'],
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircleSmall: {
    position: 'absolute',
    top: 70,
    right: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.light.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    ...Typography['label-md'],
    color: 'rgba(255,255,255,0.8)',
  },
  greetingName: {
    ...Typography.h1,
    fontWeight: '700',
    color: '#ffffff',
  },
  contentSheet: {
    flex: 1,
    marginHorizontal: -Spacing['container-padding'],
    overflow: 'hidden',
  },
  contentSheetRounded: {
    marginTop: -Spacing.md,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contentSheetFlat: {
    marginTop: Spacing.sm,
  },
  overlayWrap: {
    position: 'absolute',
    left: -Spacing['container-padding'],
    right: -Spacing['container-padding'],
    alignItems: 'center',
    zIndex: 100,
  },
});
