import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';
import { formatPrice } from '@/utils/format';
import { isValidEmail } from '@/utils/validation';
import { uploadService } from '@/services/upload.service';
export default function DriverProfileScreen() {
  const theme = 'light';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { earnings, totalDeliveries } = useDriverStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);  const handleLogout = () => {
    logout();
    router.replace('/onboarding');
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
  };  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.header, { backgroundColor: Colors[theme].surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors[theme]['on-surface']} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[theme]['on-surface'] }]}>Driver Profile</Text>
        <TouchableOpacity onPress={openEditModal}>
          <MaterialCommunityIcons name="account-edit" size={24} color={Colors[theme].primary} />
        </TouchableOpacity>      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: Colors[theme]['primary-container'] }]}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : user?.avatar ? (
                <OptimizedImage uri={user.avatar || ''} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="bike" size={32} color="#ffffff" />
              )}
            </View>
            <View style={[styles.editBadge, { backgroundColor: Colors[theme].primary }]}>
              <MaterialCommunityIcons name="camera" size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>          <Text style={[styles.name, { color: Colors[theme]['on-surface'] }]}>{user?.name || 'Driver'}</Text>
          <Text style={[styles.email, { color: Colors[theme]['on-surface-variant'] }]}>{user?.email || ''}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors[theme].primary }]}>{totalDeliveries}</Text>
              <Text style={[styles.statLabel, { color: Colors[theme]['on-surface-variant'] }]}>Deliveries</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: Colors[theme]['surface-variant'] }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors[theme].primary }]}>{formatPrice(earnings)}</Text>
              <Text style={[styles.statLabel, { color: Colors[theme]['on-surface-variant'] }]}>Earnings</Text>
            </View>
          </View>
        </View>

        <View style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="bike" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Vehicle Info</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="bank" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Payment Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="help-circle" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Help Center</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: Colors[theme]['surface-container-highest'] }]} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors[theme].error} />
          <Text style={[styles.logoutText, { color: Colors[theme].error }]}>Logout</Text>
        </TouchableOpacity>
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
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['container-padding'], paddingTop: 56, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2 },
  scrollContent: { padding: Spacing['container-padding'], paddingBottom: 100 },
  profileCard: {
    alignItems: 'center', borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginBottom: Spacing.lg, ...Shadows.sm,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#ffffff',
  },
  avatarImage: { width: '100%', height: '100%' },  name: { ...Typography.h1 },
  email: { ...Typography['body-sm'], marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: Spacing.lg, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h2, fontWeight: '700' },
  statLabel: { ...Typography['label-sm'] },
  statDivider: { width: 1, height: 30 },
  menuCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg, ...Shadows.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md,
    borderBottomWidth: 1,
  },
  menuIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, ...Typography['label-md'] },
  logoutBtn: {
    borderRadius: BorderRadius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  logoutText: { ...Typography['label-md'] },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing['container-padding'],
    paddingBottom: 40,
    maxHeight: '90%',
    borderWidth: 1, borderColor: Colors.light['outline-variant'],
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { ...Typography.h1 },
  inputLabel: { ...Typography['label-md'], fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Typography['body-md'],
  },
  saveBtn: {
    marginTop: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl, alignItems: 'center', ...Shadows.sm,
  },
  saveBtnText: { ...Typography['body-md'], color: '#ffffff', fontWeight: '700' },});
