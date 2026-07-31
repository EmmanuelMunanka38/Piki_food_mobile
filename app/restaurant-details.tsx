import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
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
import RestaurantStatusBanner from '@/components/RestaurantStatusBanner';

const POPULAR_CARD_WIDTH = 156;
const POPULAR_CARD_IMAGE = POPULAR_CARD_WIDTH - Spacing.md * 2;
const LOGO_SIZE = 72;

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = 'light';
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('All');
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [menuOffset, setMenuOffset] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const setRestaurantName = useCartStore((s) => s.setRestaurantName);
  const setDeliveryFee = useCartStore((s) => s.setDeliveryFee);
  const setServiceFee = useCartStore((s) => s.setServiceFee);
  const cartCount = useCartStore((s) => s.itemCount());
  const cartSubtotal = useCartStore((s) => s.subtotal());

  const { data: restaurant, isPending: isLoading } = useRestaurant(id ?? '');
  const needsMenu = Boolean(restaurant && !restaurant.menu?.length);
  const { data: menuItems = [] } = useRestaurantMenu(needsMenu ? (id ?? '') : '');
  const menu = useMemo(
    () => (needsMenu && menuItems.length > 0 ? menuItems : restaurant?.menu ?? []),
    [needsMenu, menuItems, restaurant]
  );

  useEffect(() => {
    if (restaurant) {
      setRestaurantName(restaurant.name);
      setDeliveryFee(restaurant.deliveryFee);
      setServiceFee(Math.round(restaurant.deliveryFee * 0.1));
    }
  }, [restaurant, setRestaurantName, setDeliveryFee, setServiceFee]);

  const menuCategories = useMemo(() => {
    if (!restaurant) return ['All'];
    const cats = new Set(menu.filter((m) => m.isAvailable !== false).map((m) => m.category));
    return ['All', ...Array.from(cats)];
  }, [restaurant, menu]);

  const filteredItems = useMemo(() => {
    if (!restaurant) return [];
    const available = menu.filter((m) => m.isAvailable !== false);
    if (activeCategory === 'All') return available;
    return available.filter((m) => m.category === activeCategory);
  }, [activeCategory, restaurant, menu]);

  const popularItems = useMemo(() => {
    const available = menu.filter((m) => m.isAvailable !== false);
    const popular = available.filter((m) => m.isPopular);
    return popular.length > 0 ? popular : available.slice(0, 6);
  }, [menu]);

  const handleShare = () => {
    if (!restaurant) return;
    try {
      Share.share({
        message: `Check out ${restaurant.name} on Zup! \u{2b50} ${restaurant.rating} \u2014 ${restaurant.address}`,
      });
    } catch {}
  };

  const handleLearnMore = () => {
    Alert.alert(
      restaurant?.name ?? 'Zup Deals',
      'Get 20% off your first order with promo code ZUP20.'
    );
  };

  const handleViewMenu = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, menuOffset - Spacing.md), animated: true });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors[theme].primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.emptyText, { color: Colors[theme]['on-surface-variant'] }]}>
          Restaurant not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.goBack, { color: Colors[theme].primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <StatusBar style="light" />

      <ScrollView ref={scrollRef} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <OptimizedImage
            uri={restaurant.image}
            style={styles.heroImage}
            fallbackIcon="storefront"
            fallbackSize={64}
          />
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

            <View style={styles.heroRightButtons}>
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
              <TouchableOpacity
                onPress={handleShare}
                style={styles.heroButton}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="share-variant" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.metadataSheet, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
          <OptimizedImage
            uri={restaurant.logo || restaurant.image}
            style={styles.logo}
            fallbackIcon="storefront"
            fallbackSize={34}
          />

          <View style={styles.metadataContent}>
            <View style={styles.nameRow}>
              <Text style={[styles.restaurantName, { color: Colors[theme]['on-surface'] }]}>
                {restaurant.name}
              </Text>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={Colors[theme]['on-surface-variant']}
              />
            </View>
            <Text style={[styles.cuisine, { color: Colors[theme]['on-surface-variant'] }]}>
              {restaurant.cuisine}
            </Text>

            <View style={styles.detailsRow}>
              <View style={[styles.detailItem, styles.detailItemAddress]}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors[theme].primary} />
                <Text style={[styles.detailText, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                  {restaurant.address}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="star" size={14} color={Colors[theme].primary} />
                <Text style={[styles.detailText, { color: Colors[theme]['on-surface'] }]}>
                  {restaurant.rating} ({restaurant.ratingCount})
                </Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={Colors[theme].primary} />
                <Text style={[styles.detailText, { color: Colors[theme]['on-surface'] }]}>
                  {restaurant.deliveryTime}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="bike-fast" size={14} color={Colors[theme].primary} />
                <Text style={[styles.detailText, { color: Colors[theme]['on-surface'] }]}>
                  {formatPrice(restaurant.deliveryFee)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <RestaurantStatusBanner
          isOpen={restaurant.isOpen}
          nextOpenTime={restaurant.openingHours}
          onViewMenuPress={handleViewMenu}
        />

        <View style={[styles.promoCard, { backgroundColor: Colors[theme]['primary-fixed-dim'] }]}>
          <View style={styles.promoInfo}>
            <Text style={[styles.promoTitle, { color: Colors[theme]['on-primary-container'] }]}>
              Get 20% off your first order
            </Text>
            <Text style={[styles.promoText, { color: Colors[theme]['on-primary-container'] }]}>
              Use promo code ZUP20 at checkout.
            </Text>
            <TouchableOpacity
              onPress={handleLearnMore}
              style={[styles.promoButton, { backgroundColor: Colors[theme].primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.promoButtonText, { color: Colors[theme]['on-primary'] }]}>
                Learn more
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoImageWrap}>
            <OptimizedImage
              uri={popularItems[0]?.image || restaurant.image}
              style={styles.promoImage}
              fallbackIcon="food"
              fallbackSize={48}
            />
          </View>
        </View>

        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
              Popular Items
            </Text>
          </View>
          <FlatList
            horizontal
            data={popularItems}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularContent}
            renderItem={({ item }) => (
              <View style={[styles.popularCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
                <OptimizedImage
                  uri={item.image}
                  style={styles.popularImage}
                  fallbackIcon="food"
                  fallbackSize={44}
                />
                <Text style={[styles.popularName, { color: Colors[theme]['on-surface'] }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.popularCardFooter}>
                  <Text style={[styles.popularPrice, { color: Colors[theme].primary }]}>
                    {formatPrice(item.price)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.quickAddBtn, { backgroundColor: Colors[theme].primary }]}
                    onPress={() => addItem(item)}
                    activeOpacity={0.85}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={styles.categoryContent}
        >
          {menuCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    activeCategory === cat
                      ? Colors[theme].primary
                      : Colors[theme]['surface-container-high'],
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      activeCategory === cat
                        ? Colors[theme]['on-primary']
                        : Colors[theme]['on-surface-variant'],
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={styles.menuSection}
          onLayout={(e) => setMenuOffset(e.nativeEvent.layout.y)}
        >
          <Text style={[styles.menuSectionTitle, { color: Colors[theme]['on-surface'] }]}>
            {activeCategory === 'All' ? 'Menu' : activeCategory}
          </Text>
          <View style={styles.menuGrid}>
            {filteredItems.length === 0 && (
              <Text style={[styles.emptyMenu, { color: Colors[theme]['on-surface-variant'] }]}>
                No items in this category
              </Text>
            )}
            {filteredItems.map((item) => (
              <View key={item.id} style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}>
                <View style={styles.menuImageContainer}>
                  <OptimizedImage uri={item.image} style={styles.menuImage} fallbackIcon="food" fallbackSize={40} />
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: Colors[theme].primary }]}
                    onPress={() => addItem(item)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.menuInfo}>
                  <View style={styles.menuInfoTop}>
                    <Text style={[styles.menuItemName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.menuItemPrice, { color: Colors[theme].primary }]}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.menuItemDesc, { color: Colors[theme]['on-surface-variant'] }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <View style={[styles.cartBar, { backgroundColor: Colors[theme].surface, paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.xs }]}>
          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: Colors[theme].primary }]}
            onPress={() => router.push('/your-cart')}
            activeOpacity={0.9}
          >
            <View style={styles.checkoutLeft}>
              <View style={[styles.cartBadge, { backgroundColor: Colors[theme]['on-primary'] }]}>
                <Text style={[styles.cartBadgeText, { color: Colors[theme].primary }]}>{cartCount}</Text>
              </View>
              <Text style={styles.checkoutLabel}>View Cart</Text>
            </View>
            <Text style={styles.checkoutTotal}>{formatPrice(cartSubtotal)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  emptyText: { ...Typography['body-md'] },
  goBack: { ...Typography['label-md'], marginTop: Spacing.sm },
  heroSection: { position: 'relative', height: 300 },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroButtonsRow: {
    position: 'absolute',
    left: Spacing['container-padding'],
    right: Spacing['container-padding'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroRightButtons: { flexDirection: 'row', gap: Spacing.sm },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  metadataSheet: {
    paddingBottom: Spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    position: 'absolute',
    top: -(LOGO_SIZE / 2) + 2,
    left: Spacing['container-padding'],
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    zIndex: 2,
    ...Shadows.md,
  },
  metadataContent: { paddingHorizontal: Spacing['container-padding'], paddingTop: LOGO_SIZE / 2 + Spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  restaurantName: { ...Typography.h1, flexShrink: 1 },
  cuisine: { ...Typography['body-sm'], marginTop: 2 },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light['surface-container-low'],
  },
  detailItemAddress: { flexGrow: 1, flexShrink: 1 },
  detailText: { ...Typography['label-sm'], flexShrink: 1 },
  promoCard: {
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  promoInfo: { flex: 1 },
  promoTitle: { ...Typography.h2, fontSize: 17 },
  promoText: { ...Typography['body-sm'], marginTop: 4 },
  promoButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  promoButtonText: { ...Typography['label-md'] },
  promoImageWrap: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  promoImage: { width: '100%', height: '100%' },
  popularSection: { marginTop: Spacing.xl },
  sectionHeader: { paddingHorizontal: Spacing['container-padding'] },
  sectionTitle: { ...Typography.h2 },
  popularContent: { paddingHorizontal: Spacing['container-padding'], paddingTop: Spacing.md, gap: Spacing.md },
  popularCard: {
    width: POPULAR_CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  popularImage: {
    width: POPULAR_CARD_IMAGE,
    height: POPULAR_CARD_IMAGE,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
  },
  popularName: {
    ...Typography['label-md'],
    fontWeight: '700',
    marginTop: Spacing.sm,
    minHeight: 34,
  },
  popularCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  popularPrice: { ...Typography['label-md'], fontWeight: '700' },
  quickAddBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  categoryBar: { marginTop: Spacing.lg },
  categoryContent: { paddingHorizontal: Spacing['container-padding'], gap: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryText: { ...Typography['label-md'] },
  menuSection: { padding: Spacing['container-padding'], paddingBottom: 120 },
  menuSectionTitle: { ...Typography.h2, marginBottom: Spacing.md },
  emptyMenu: { ...Typography['body-md'], textAlign: 'center', paddingVertical: 40 },
  menuGrid: { gap: Spacing.md },
  menuCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuImageContainer: { position: 'relative', height: 192 },
  menuImage: { width: '100%', height: '100%' },
  addBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  menuInfo: { padding: Spacing.md },
  menuInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  menuItemName: { ...Typography.h2, flex: 1 },
  menuItemPrice: { ...Typography.h2 },
  menuItemDesc: { ...Typography['body-sm'] },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  checkoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { ...Typography['label-md'], fontWeight: '700' },
  checkoutLabel: { ...Typography['label-md'], color: '#ffffff' },
  checkoutTotal: { ...Typography.h2, color: '#ffffff' },
});
