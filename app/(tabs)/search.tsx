import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useRestaurants } from '@/hooks/use-restaurants';

const { width } = Dimensions.get('window');
const GRID_GAP = Spacing.md;
const GRID_PADDING = Spacing['container-padding'] * 2;
const GRID_CARD_WIDTH = (width - GRID_PADDING - GRID_GAP) / 2;

const popularSearches = ['Pizza', 'Swahili', 'Burgers', 'Juice', 'Pilau', 'Seafood'];

export default function SearchScreen() {
  const theme = 'light';
  const [query, setQuery] = useState('');
  const { data: restaurants = [] } = useRestaurants();

  const allMenuItems = useMemo(
    () => restaurants.flatMap((r) => r.menu || []),
    [restaurants]
  );

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        restaurants,
        menuItems: allMenuItems.slice(0, 6),
      };
    }

    const filteredRes = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        (r.categories as string[]).some((c) => c.toLowerCase().includes(q))
    );

    const filteredMenu = allMenuItems.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );

    return { restaurants: filteredRes, menuItems: filteredMenu };
  }, [query, restaurants, allMenuItems]);

  const hasQuery = query.trim().length > 0;
  const hasActualResults = results.restaurants.length > 0 || results.menuItems.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme]['surface'] }]}>
      <View style={[styles.header, { backgroundColor: Colors[theme].surface, borderBottomColor: Colors[theme]['surface-container'] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors[theme]['on-surface']} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[theme]['on-surface'] }]}>Search</Text>
        <TouchableOpacity style={[styles.cartButton, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
          <MaterialCommunityIcons name="cart-outline" size={20} color={Colors[theme]['on-surface']} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.searchBar, { backgroundColor: Colors[theme]['surface-container-lowest'], borderColor: Colors[theme]['surface-container'] }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={Colors[theme]['on-surface-variant']} />
          <TextInput
            style={[styles.searchInput, { color: Colors[theme]['on-surface'] }]}
            placeholder="Search restaurants, dishes..."
            placeholderTextColor={Colors[theme]['on-surface-variant']}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <MaterialCommunityIcons name="close-circle" size={22} color={Colors[theme]['on-surface-variant']} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.browseSection}>
          <View style={styles.browseHeader}>
            <MaterialCommunityIcons name="trending-up" size={20} color={Colors[theme].primary} />
            <Text style={[styles.browseTitle, { color: Colors[theme]['on-surface'] }]}>
              Popular Searches
            </Text>
          </View>
          <View style={styles.chipsRow}>
            {popularSearches.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, { backgroundColor: Colors[theme]['surface-container-high'] }]}
                onPress={() => setQuery(item)}
              >
                <MaterialCommunityIcons
                  name={
                    item === 'Pizza' ? 'pizza' :
                    item === 'Swahili' ? 'silverware' :
                    item === 'Burgers' ? 'hamburger' :
                    item === 'Juice' ? 'cup' :
                    item === 'Pilau' ? 'rice' :
                    'food-apple'
                  }
                  size={16}
                  color={Colors[theme].primary}
                />
                <Text style={[styles.chipText, { color: Colors[theme]['on-surface'] }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {hasQuery && !hasActualResults && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="food-off" size={64} color={Colors[theme]['surface-container']} />
            <Text style={[styles.emptyTitle, { color: Colors[theme]['on-surface'] }]}>
              {`No results for "${query}"`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: Colors[theme]['on-surface-variant'] }]}>
              Try a different search term or browse categories
            </Text>
          </View>
        )}

        {hasActualResults && (
          <View style={styles.resultsSection}>
            {results.restaurants.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupHeaderLeft}>
                    <MaterialCommunityIcons name="store-outline" size={20} color={Colors[theme].primary} />
                    <Text style={[styles.groupTitle, { color: Colors[theme]['on-surface'] }]}>
                      Restaurants
                    </Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: Colors[theme]['surface-container'] }]}>
                    <Text style={[styles.countText, { color: Colors[theme]['on-surface-variant'] }]}>
                      {results.restaurants.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.restaurantsGrid}>
                  {results.restaurants.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/restaurant-details?id=${r.id}`)}
                      style={[styles.restaurantCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
                    >
                      <View style={styles.restaurantImageContainer}>
                        <OptimizedImage uri={r.image} style={styles.restaurantImage} />
                        <View style={[styles.statusBadge, { backgroundColor: r.isOpen ? Colors[theme].primary : Colors[theme].error }]}>
                          <Text style={styles.statusText}>{r.isOpen ? 'Open' : 'Closed'}</Text>
                        </View>
                        <View style={[styles.ratingBadge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                          <MaterialCommunityIcons name="star" size={14} color={Colors[theme]['secondary-container']} />
                          <Text style={[styles.ratingText, { color: Colors[theme]['on-surface'] }]}>{r.rating}</Text>
                        </View>
                      </View>
                      <View style={styles.restaurantInfo}>
                        <Text style={[styles.restaurantName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                          {r.name}
                        </Text>
                        <Text style={[styles.restaurantCuisine, { color: Colors[theme]['on-surface-variant'] }]}>
                          {r.cuisine}
                        </Text>
                        <View style={styles.restaurantMeta}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors[theme]['on-surface-variant']} />
                          <Text style={[styles.restaurantMetaText, { color: Colors[theme]['on-surface-variant'] }]}>
                            {r.deliveryTime}
                          </Text>
                          <View style={[styles.metaDot, { backgroundColor: Colors[theme]['on-surface-variant'] }]} />
                          <MaterialCommunityIcons name="bike" size={14} color={Colors[theme]['on-surface-variant']} />
                          <Text style={[styles.restaurantMetaText, { color: Colors[theme]['on-surface-variant'] }]}>
                            {formatPrice(r.deliveryFee)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {results.menuItems.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupHeaderLeft}>
                    <MaterialCommunityIcons name="food-outline" size={20} color={Colors[theme].primary} />
                    <Text style={[styles.groupTitle, { color: Colors[theme]['on-surface'] }]}>
                      Menu Items
                    </Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: Colors[theme]['surface-container'] }]}>
                    <Text style={[styles.countText, { color: Colors[theme]['on-surface-variant'] }]}>
                      {results.menuItems.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.menuGrid}>
                  {results.menuItems.map((m) => {
                    const restaurant = restaurants.find((r) => r.id === m.restaurantId);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.menuCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
                        onPress={() => router.push(`/restaurant-details?id=${m.restaurantId}`)}
                        activeOpacity={0.7}
                      >
                        <OptimizedImage uri={m.image} style={styles.menuImage} />
                        <View style={styles.menuInfo}>
                          <Text style={[styles.menuName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                            {m.name}
                          </Text>
                          <Text style={[styles.menuDesc, { color: Colors[theme]['on-surface-variant'] }]} numberOfLines={2}>
                            {m.description}
                          </Text>
                          {restaurant && (
                            <Text style={[styles.menuRestaurant, { color: Colors[theme]['primary'] }]} numberOfLines={1}>
                              {restaurant.name}
                            </Text>
                          )}
                          <Text style={[styles.menuPrice, { color: Colors[theme]['on-surface'] }]}>
                            {formatPrice(m.price)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerBack: { padding: 4, marginRight: Spacing.sm },
  headerTitle: { ...Typography.h2, flex: 1 },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 100 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    ...Shadows.sm,
  },
  searchInput: { flex: 1, ...Typography['body-lg'] },
  clearBtn: { padding: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.h1, textAlign: 'center', marginTop: Spacing.lg },
  emptySubtitle: { ...Typography['body-md'], textAlign: 'center', marginTop: Spacing.sm },

  resultsSection: { paddingTop: Spacing.lg, gap: 48 },
  group: { gap: Spacing.md },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['container-padding'],
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  groupTitle: { ...Typography.h2 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: { ...Typography['label-sm'], fontWeight: '600' },

  restaurantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing['container-padding'],
    gap: GRID_GAP,
  },
  restaurantCard: {
    width: GRID_CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  restaurantImageContainer: { position: 'relative' },
  restaurantImage: { width: GRID_CARD_WIDTH, height: 130 },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  ratingText: { ...Typography['label-sm'], fontWeight: '700' },
  restaurantInfo: { padding: Spacing.md },
  restaurantName: { ...Typography.h2 },
  restaurantCuisine: { ...Typography['body-sm'], marginTop: 2 },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  restaurantMetaText: { ...Typography['label-sm'] },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing['container-padding'],
    gap: GRID_GAP,
  },
  menuCard: {
    width: GRID_CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuImage: { width: '100%', height: GRID_CARD_WIDTH, backgroundColor: Colors.light['surface-container'] },
  menuInfo: { padding: Spacing.sm, gap: 2 },
  menuName: { ...Typography.h2 },
  menuDesc: { ...Typography['body-sm'] },
  menuRestaurant: { ...Typography['label-sm'], marginTop: 2 },
  menuPrice: { ...Typography['label-md'], fontWeight: '700', marginTop: 4 },

  browseSection: {
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.lg,
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  browseTitle: { ...Typography.h2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: { ...Typography['label-md'] },
});
