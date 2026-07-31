import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/cartStore';
import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurants';

const HERO_HEIGHT = 300;
const SHEET_RADIUS = 28;
const MAX_DESC_LINES = 3;

interface Addon {
  id: string;
  name: string;
  price: number;
}

const ADDONS: Addon[] = [
  { id: 'ham', name: 'More Ham', price: 4500 },
  { id: 'spicy', name: 'Spicy', price: 1500 },
  { id: 'egg', name: 'Add Egg', price: 1000 },
  { id: 'cheese', name: 'Extra Cheese', price: 2500 },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function FoodDetailsScreen() {
  const { id, restaurantId } = useLocalSearchParams<{ id: string; restaurantId?: string }>();
  const theme = 'light';
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const { data: restaurant } = useRestaurant(restaurantId ?? '');
  const needsMenu = Boolean(restaurant && !restaurant.menu?.length);
  const { data: menuItems = [] } = useRestaurantMenu(needsMenu ? (restaurantId ?? '') : '');

  const item = useMemo(() => {
    const menu = needsMenu && menuItems.length > 0 ? menuItems : restaurant?.menu ?? [];
    return menu.find((m) => m.id === id) ?? null;
  }, [id, needsMenu, menuItems, restaurant]);

  const calories = useMemo(() => {
    if (!item) return 0;
    return 250 + (hashString(item.id) % 520);
  }, [item]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const addonsTotal = useMemo(
    () => ADDONS.filter((a) => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0),
    [selectedAddons]
  );

  const total = item ? (item.price + addonsTotal) * quantity : 0;

  const handleNext = () => {
    if (!item) return;
    addItem({ ...item }, quantity);
    router.push('/your-cart');
  };

  if (!item) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.emptyText, { color: Colors[theme]['on-surface-variant'] }]}>
          Item not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.goBack, { color: Colors[theme].primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const description = item.description || 'A delicious freshly prepared meal crafted with quality ingredients.';

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <OptimizedImage uri={item.image} style={styles.heroImage} fallbackIcon="food" fallbackSize={64} />
          <View style={styles.heroGradient} />

          <View style={[styles.heroButtonsRow, { top: insets.top + Spacing.sm }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.heroButton}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsFavorite((prev) => !prev)}
              style={styles.heroButton}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? Colors[theme].tertiary : '#ffffff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.contentSheet, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: Colors[theme]['on-surface'] }]} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={[styles.stepper, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.stepperBtn}
                activeOpacity={0.7}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="minus" size={18} color={Colors[theme]['on-surface-variant']} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: Colors[theme]['on-surface'] }]}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity((q) => q + 1)}
                style={[styles.stepperBtn, styles.stepperPlus, { backgroundColor: Colors[theme].primary }]}
                activeOpacity={0.85}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.metaItem, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
              <MaterialCommunityIcons name="star" size={15} color="#F5A623" />
              <Text style={[styles.metaText, { color: Colors[theme]['on-surface'] }]}>
                {(restaurant?.rating ?? 0).toFixed(1)}
              </Text>
            </View>
            <View style={[styles.metaItem, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
              <MaterialCommunityIcons name="clock-outline" size={15} color={Colors[theme].primary} />
              <Text style={[styles.metaText, { color: Colors[theme]['on-surface'] }]}>
                {restaurant?.deliveryTime ?? 15} min
              </Text>
            </View>
            <View style={[styles.metaItem, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
              <MaterialCommunityIcons name="fire" size={15} color={Colors[theme].tertiary} />
              <Text style={[styles.metaText, { color: Colors[theme]['on-surface'] }]}>
                {calories} kcal
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
              Description
            </Text>
            <Text
              style={[styles.description, { color: Colors[theme]['on-surface-variant'] }]}
              numberOfLines={expanded ? undefined : MAX_DESC_LINES}
            >
              {description}
            </Text>
            <TouchableOpacity onPress={() => setExpanded((prev) => !prev)} hitSlop={8}>
              <Text style={[styles.readMore, { color: Colors[theme].primary }]}>
                {expanded ? 'Read Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
              Add Extra Additional
            </Text>
            <View style={styles.addonsList}>
              {ADDONS.map((addon) => {
                const selected = selectedAddons.has(addon.id);
                return (
                  <TouchableOpacity
                    key={addon.id}
                    style={[styles.addonRow, { backgroundColor: Colors[theme]['surface-container-low'] }]}
                    onPress={() => toggleAddon(addon.id)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: selected ? Colors[theme].primary : Colors[theme]['outline-variant'],
                          backgroundColor: selected ? Colors[theme].primary : 'transparent',
                        },
                      ]}
                    >
                      {selected && <MaterialCommunityIcons name="check" size={14} color="#ffffff" />}
                    </View>
                    <Text style={[styles.addonLabel, { color: Colors[theme]['on-surface'] }]}>
                      {addon.name}
                    </Text>
                    <Text style={[styles.addonPrice, { color: Colors[theme].primary }]}>
                      +{formatPrice(addon.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.section, styles.notesSection]}>
            <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
              Add Notes
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: Colors[theme]['on-surface'],
                  backgroundColor: Colors[theme]['surface-container-low'],
                },
              ]}
              placeholder="Write Notes"
              placeholderTextColor={Colors[theme]['on-surface-variant']}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: Colors[theme].background,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: Colors[theme].primary }]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.nextLabel}>Next</Text>
          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
          <Text style={styles.totalLabel}>{formatPrice(total)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  emptyText: { ...Typography['body-md'] },
  goBack: { ...Typography['label-md'], marginTop: Spacing.sm },
  scrollContent: { paddingBottom: 140 },
  heroSection: { position: 'relative', height: HERO_HEIGHT },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroButtonsRow: {
    position: 'absolute',
    left: Spacing['container-padding'],
    right: Spacing['container-padding'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  contentSheet: {
    marginTop: -SHEET_RADIUS,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: 4,
    borderRadius: BorderRadius.full,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepperPlus: {
    ...Shadows.sm,
  },
  stepperValue: {
    ...Typography['label-md'],
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  metaText: { ...Typography['label-sm'], fontWeight: '600' },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography['body-md'],
    lineHeight: 24,
  },
  readMore: {
    ...Typography['label-md'],
    marginTop: Spacing.xs,
  },
  addonsList: { gap: Spacing.sm },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonLabel: {
    ...Typography['body-md'],
    fontWeight: '600',
    flex: 1,
  },
  addonPrice: {
    ...Typography['label-md'],
    fontWeight: '700',
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    minHeight: 96,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Typography['body-md'],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  nextLabel: {
    ...Typography['label-md'],
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    position: 'absolute',
    left: '50%',
    top: 14,
    bottom: 14,
    width: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    ...Typography.h2,
    color: '#ffffff',
  },
});
