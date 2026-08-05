import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useAuthStore } from '@/store/authStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { isValidEmail } from '@/utils/validation';
import { uploadService } from '@/services/upload.service';

export default function RestaurantProfileScreen() {
  const theme = 'light';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { restaurants, updateRestaurant } = useRestaurantStore();
  const myRestaurant = restaurants[0];

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingRestaurantImage, setUploadingRestaurantImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingLocation, setSettingLocation] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');

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
        if (myRestaurant) {
          updateRestaurant(myRestaurant.id, { image: url });
        }
      } catch {
        Alert.alert('Error', 'Failed to upload avatar');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const pickRestaurantImage = async () => {
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
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingRestaurantImage(true);
      try {
        const url = await uploadService.uploadImage(result.assets[0].uri);
        if (myRestaurant) {
          updateRestaurant(myRestaurant.id, { image: url });
        }
      } catch {
        Alert.alert('Error', 'Failed to upload restaurant image');
      } finally {
        setUploadingRestaurantImage(false);
      }
    }
  };

  const openManualLocation = () => {
    setEditLat(myRestaurant?.location?.latitude?.toString() || '');
    setEditLng(myRestaurant?.location?.longitude?.toString() || '');
    setShowLocationModal(true);
  };

  const saveManualLocation = async () => {
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid', 'Please enter valid latitude and longitude numbers.');
      return;
    }
    if (lat < -90 || lat > 90) {
      Alert.alert('Invalid', 'Latitude must be between -90 and 90.');
      return;
    }
    if (lng < -180 || lng > 180) {
      Alert.alert('Invalid', 'Longitude must be between -180 and 180.');
      return;
    }
    setSettingLocation(true);
    try {
      if (myRestaurant) {
        await updateRestaurant(myRestaurant.id, { latitude: lat, longitude: lng } as any);
        setLocationSet(true);
        setTimeout(() => setLocationSet(false), 3000);
        setShowLocationModal(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to save location.');
    } finally {
      setSettingLocation(false);
    }
  };

  const setRestaurantLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is needed to set your restaurant location.');
      return;
    }
    setSettingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (myRestaurant) {
        await updateRestaurant(myRestaurant.id, {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        } as any);
        setLocationSet(true);
        setTimeout(() => setLocationSet(false), 3000);
      }
    } catch {
      Alert.alert('Error', 'Failed to get your location. Make sure GPS is enabled.');
    } finally {
      setSettingLocation(false);
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
      <View style={[styles.header, { backgroundColor: Colors[theme].surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors[theme]['on-surface']} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[theme]['on-surface'] }]}>Profile</Text>
        <TouchableOpacity onPress={openEditModal}>
          <MaterialCommunityIcons name="account-edit" size={24} color={Colors[theme].primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: Colors[theme]['primary-container'] }]}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : user?.avatar ? (
                <OptimizedImage uri={user.avatar || ''} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="store" size={36} color="#ffffff" />
              )}
            </View>
            <View style={[styles.editBadge, { backgroundColor: Colors[theme].primary }]}>
              <MaterialCommunityIcons name="camera" size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: Colors[theme]['on-surface'] }]}>{user?.name || 'Restaurant Owner'}</Text>
          <Text style={[styles.email, { color: Colors[theme]['on-surface-variant'] }]}>{user?.email || ''}</Text>
          {myRestaurant && (
            <View style={[styles.restaurantInfo, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="store-outline" size={18} color={Colors[theme].primary} />
              <Text style={[styles.restaurantName, { color: Colors[theme]['on-surface'] }]}>{myRestaurant.name}</Text>
              <Text style={[styles.restaurantStatus, { color: myRestaurant.isOpen ? Colors[theme].primary : Colors[theme]['on-surface-variant'] }]}>
                {myRestaurant.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        {myRestaurant && (
          <View style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
            <View style={styles.restaurantImageHeader}>
              <MaterialCommunityIcons name="storefront" size={20} color={Colors[theme].primary} />
              <Text style={[styles.restaurantImageTitle, { color: Colors[theme]['on-surface'] }]}>Restaurant Image</Text>
            </View>
            <TouchableOpacity onPress={pickRestaurantImage} disabled={uploadingRestaurantImage} style={styles.restaurantImageWrap}>
              {uploadingRestaurantImage ? (
                <ActivityIndicator size="small" color={Colors[theme].primary} style={{ height: 160 }} />
              ) : myRestaurant.image ? (
                <OptimizedImage uri={myRestaurant.image} style={styles.restaurantPreviewImage} />
              ) : (
                <View style={[styles.restaurantImagePlaceholder, { backgroundColor: Colors[theme]['surface-container'] }]}>
                  <MaterialCommunityIcons name="image-plus" size={40} color={Colors[theme]['on-surface-variant']} />
                  <Text style={[styles.restaurantImageHint, { color: Colors[theme]['on-surface-variant'] }]}>Tap to set restaurant image</Text>
                  <Text style={[styles.restaurantImageSub, { color: Colors[theme]['surface-variant'] }]}>Customers will see this on the restaurant card</Text>
                </View>
              )}
            </TouchableOpacity>
            {myRestaurant.image && (
              <TouchableOpacity style={styles.restaurantImageChange} onPress={pickRestaurantImage}>
                <MaterialCommunityIcons name="camera" size={16} color={Colors[theme].primary} />
                <Text style={[styles.restaurantImageChangeText, { color: Colors[theme].primary }]}>Change Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

          {myRestaurant && (
          <View style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
            <View style={styles.restaurantImageHeader}>
              <MaterialCommunityIcons name="map-marker" size={20} color={Colors[theme].primary} />
              <Text style={[styles.restaurantImageTitle, { color: Colors[theme]['on-surface'] }]}>Restaurant Location</Text>
            </View>
            <TouchableOpacity
              onPress={setRestaurantLocation}
              disabled={settingLocation}
              style={[styles.locationBtn, { backgroundColor: Colors[theme]['surface-container'] }]}
            >
              {settingLocation ? (
                <ActivityIndicator size="small" color={Colors[theme].primary} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color={Colors[theme].primary} />
              )}
              <View style={styles.locationBtnTextCol}>
                <Text style={[styles.locationBtnText, { color: Colors[theme]['on-surface'] }]}>
                  {settingLocation ? 'Getting location...' : 'Use Current Location'}
                </Text>
                <Text style={[styles.locationBtnSub, { color: Colors[theme]['on-surface-variant'] }]}>
                  Capture your current GPS position
                </Text>
              </View>
              {locationSet && (
                <MaterialCommunityIcons name="check-circle" size={20} color={Colors[theme].primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openManualLocation}
              style={[styles.locationBtn, { backgroundColor: Colors[theme]['surface-container'] }]}
            >
              <MaterialCommunityIcons name="keyboard" size={24} color={Colors[theme].primary} />
              <View style={styles.locationBtnTextCol}>
                <Text style={[styles.locationBtnText, { color: Colors[theme]['on-surface'] }]}>
                  Enter Manually
                </Text>
                <Text style={[styles.locationBtnSub, { color: Colors[theme]['on-surface-variant'] }]}>
                  Type latitude and longitude
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]} onPress={() => router.push('/restaurant/menu-management')}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="food" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Manage Menu</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Business Hours</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="bank" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Payout Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: Colors[theme]['surface-variant'] }]}>
            <View style={[styles.menuIcon, { backgroundColor: Colors[theme]['surface-container'] }]}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={Colors[theme].primary} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors[theme]['on-surface'] }]}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors[theme].outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, {}]}>
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

      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[theme].surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[theme]['on-surface'] }]}>Set Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors[theme]['on-surface-variant']} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'] }]}>Latitude</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Colors[theme]['surface-container-low'], color: Colors[theme]['on-surface'], borderColor: Colors[theme]['outline-variant'] }]}
              value={editLat}
              onChangeText={setEditLat}
              placeholder="-6.7924"
              placeholderTextColor={Colors[theme]['on-surface-variant']}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'], marginTop: Spacing.md }]}>Longitude</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Colors[theme]['surface-container-low'], color: Colors[theme]['on-surface'], borderColor: Colors[theme]['outline-variant'] }]}
              value={editLng}
              onChangeText={setEditLng}
              placeholder="39.2083"
              placeholderTextColor={Colors[theme]['on-surface-variant']}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors[theme].primary, opacity: settingLocation ? 0.7 : 1 }]}
              onPress={saveManualLocation}
              disabled={settingLocation}
            >
              {settingLocation ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
      </Modal>
    </View>
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
  avatarImage: { width: '100%', height: '100%' },
  name: { ...Typography.h1 },
  email: { ...Typography['body-sm'], marginTop: 2 },
  restaurantInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  restaurantName: { ...Typography['label-md'], fontWeight: '600' },
  restaurantStatus: { ...Typography['label-sm'] },
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
  saveBtnText: { ...Typography['body-md'], color: '#ffffff', fontWeight: '700' },
  restaurantImageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, paddingBottom: 0,
  },
  restaurantImageTitle: { ...Typography['label-md'], fontWeight: '600' },
  restaurantImageWrap: { padding: Spacing.md },
  restaurantPreviewImage: { width: '100%', height: 160, borderRadius: BorderRadius.lg },
  restaurantImagePlaceholder: {
    width: '100%', height: 160, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  restaurantImageHint: { ...Typography['body-sm'] },
  restaurantImageSub: { ...Typography['label-sm'], textAlign: 'center', paddingHorizontal: Spacing.lg },
  restaurantImageChange: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  restaurantImageChangeText: { ...Typography['label-sm'], fontWeight: '600' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    margin: Spacing.md, padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  locationBtnTextCol: { flex: 1 },
  locationBtnText: { ...Typography['label-md'], fontWeight: '600' },
  locationBtnSub: { ...Typography['label-sm'], marginTop: 2 },
});
