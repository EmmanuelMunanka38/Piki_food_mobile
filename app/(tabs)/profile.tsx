import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice, formatDate } from '@/utils/format';
import { isValidEmail } from '@/utils/validation';
import { uploadService } from '@/services/upload.service';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const generalMenu: { icon: IconName; label: string; route: string }[] = [
  { icon: 'map-marker-radius', label: 'Saved Addresses', route: '/saved-addresses' },
  { icon: 'receipt', label: 'Order History', route: '/(tabs)/orders' },
  { icon: 'credit-card-outline', label: 'Payment Methods', route: '/payment-methods' },
  { icon: 'bell-outline', label: 'Notifications', route: '/notifications' },
];

const supportMenu: { icon: IconName; label: string; route: string }[] = [
  { icon: 'help-circle-outline', label: 'Help Center', route: '/help-center' },
];

function MenuGroup({
  title,
  items,
  theme,
}: {
  title: string;
  items: { icon: IconName; label: string; route: string }[];
  theme: 'light' | 'dark';
}) {
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface-variant'] }]}>{title}</Text>
      <View style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              { borderBottomWidth: index < items.length - 1 ? 1 : 0, borderBottomColor: Colors[theme]['surface-variant'] },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name={item.icon} size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme: 'light' | 'dark' = 'light';
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { orders, loadOrders } = useOrderStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const appVersion = Constants.expoConfig?.version;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/onboarding'); } },
    ]);
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  const pickAvatar = async () => {
    let ImagePicker: typeof import('expo-image-picker');
    try {
      ImagePicker = await import('expo-image-picker');
    } catch {
      Alert.alert('Unavailable', 'Image picker is not available');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const url = await uploadService.uploadImage(result.assets[0].uri);
        await updateProfile({ avatar: url });
      } catch {
        Alert.alert('Error', 'Failed to upload avatar');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty');
      return;
    }
    if (editEmail.trim() && !isValidEmail(editEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: editName.trim(), email: editEmail.trim() });
      setShowEditModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { backgroundColor: Colors[theme].primary, paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />

          <Text style={[styles.heroTitle, { color: Colors[theme]['on-primary'] }]}>My Profile</Text>

          <View style={styles.heroRow}>
            <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} disabled={uploadingAvatar} activeOpacity={0.8}>
              <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : user?.avatar ? (
                  <OptimizedImage uri={user.avatar} style={styles.avatarImage} />
                ) : (
                  <MaterialCommunityIcons name="account" size={40} color="#ffffff" />
                )}
              </View>
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera" size={13} color={Colors[theme].primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={[styles.heroGreeting, { color: 'rgba(255,255,255,0.85)' }]}>
                Welcome back,
              </Text>
              <View style={styles.heroNameRow}>
                <Text style={[styles.heroName, { color: Colors[theme]['on-primary'] }]} numberOfLines={1}>
                  {user?.name || 'User'}
                </Text>
                <TouchableOpacity onPress={openEditModal} hitSlop={8}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.heroEmail, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                {user?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <View style={styles.statCol}>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="wallet" size={18} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.statValue, { color: Colors[theme]['on-surface'] }]}>
              {formatPrice(totalSpent)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[theme]['on-surface-variant'] }]}>Total Spent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors[theme]['surface-variant'] }]} />
          <View style={styles.statCol}>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="receipt" size={18} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.statValue, { color: Colors[theme]['on-surface'] }]}>{orderCount}</Text>
            <Text style={[styles.statLabel, { color: Colors[theme]['on-surface-variant'] }]}>Orders</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors[theme]['surface-variant'] }]} />
          <View style={styles.statCol}>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="calendar-star" size={18} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.statValue, { color: Colors[theme]['on-surface'] }]}>
              {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[theme]['on-surface-variant'] }]}>Member Since</Text>
          </View>
        </View>

        <MenuGroup title="Account" items={generalMenu} theme={theme} />
        <MenuGroup title="Support" items={supportMenu} theme={theme} />

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: Colors[theme]['error-container'] }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={20} color={Colors[theme]['on-error-container']} />
          <Text style={[styles.logoutText, { color: Colors[theme]['on-error-container'] }]}>Logout</Text>
        </TouchableOpacity>

        {appVersion && (
          <Text style={[styles.versionText, { color: Colors[theme]['on-surface-variant'] }]}>
            Zup v{appVersion}
          </Text>
        )}
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[theme].surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[theme]['on-surface'] }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors[theme]['on-surface-variant']} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'] }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Colors[theme]['surface-container-low'], color: Colors[theme]['on-surface'], borderColor: Colors[theme]['outline-variant'] }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={Colors[theme]['on-surface-variant']}
            />

            <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'], marginTop: Spacing.md }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Colors[theme]['surface-container-low'], color: Colors[theme]['on-surface'], borderColor: editEmail ? (isValidEmail(editEmail.trim()) ? Colors[theme].primary : Colors[theme].tertiary) : Colors[theme]['outline-variant'] }]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors[theme]['on-surface-variant']}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors[theme].primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  hero: {
    paddingHorizontal: Spacing['container-padding'],
    paddingBottom: Spacing.xl + 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroCircleLarge: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCircleSmall: {
    position: 'absolute',
    bottom: -24,
    left: -28,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroTitle: { ...Typography.h2, marginBottom: Spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: BorderRadius.full },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  heroInfo: { flex: 1 },
  heroGreeting: { ...Typography['label-md'] },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  heroName: { ...Typography.h1, flexShrink: 1 },
  heroEmail: { ...Typography['body-sm'], marginTop: 2 },
  statsCard: {
    marginHorizontal: Spacing['container-padding'],
    marginTop: -28,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: Spacing.xs },
  statChip: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: '#e7f6ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { ...Typography['label-md'], fontWeight: '700', textAlign: 'center' },
  statLabel: { ...Typography['label-sm'], fontSize: 10, textAlign: 'center' },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: Spacing.xs },
  sectionTitle: {
    ...Typography['label-md'],
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  menuCard: {
    marginHorizontal: Spacing['container-padding'],
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, ...Typography['body-md'] },
  logoutBtn: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing['container-padding'],
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  logoutText: { ...Typography['label-md'], fontWeight: '700' },
  versionText: {
    ...Typography['label-sm'],
    textAlign: 'center',
    marginTop: Spacing.lg,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing['container-padding'],
    paddingBottom: 40,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.light['outline-variant'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { ...Typography.h1 },
  inputLabel: { ...Typography['label-md'], fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Typography['body-md'],
  },
  saveBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  saveBtnText: { ...Typography['body-md'], color: '#ffffff', fontWeight: '700' },
});
