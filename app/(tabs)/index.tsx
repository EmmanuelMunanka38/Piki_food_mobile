import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import { useRestaurantStore } from '@/store/restaurantStore';
import { MenuItem } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { CategorySkeleton, RestaurantCardSkeleton } from '@/components/ui/SkeletonLoader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;


export default function HomeScreen() {
  const theme = 'light';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { restaurants, categories, featured, isLoading, error, loadRestaurants, loadCategories, loadFeatured, loadAllMenus } = useRestaurantStore();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const user = useAuthStore((s) => s.user);
  const getGreeting = () => {
    const h = new Date(Date.now() + 3 * 3600000).getUTCHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const [greetingText, setGreetingText] = useState(getGreeting);
  useEffect(() => {
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    const tick = () => setGreetingText(getGreeting());
    const timer = setTimeout(() => {
      tick();
      setInterval(tick, 60000);
    }, msToNextMinute);
    return () => clearTimeout(timer);
  }, []);

  const filteredRestaurants = selectedCategory
    ? restaurants.filter((r) =>
        (r.categories as string[]).some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
      )
    : [];

  const filteredMenuItems = selectedCategory
    ? restaurants
        .flatMap((r) => r.menu || [])
        .filter((m) => m.category.toLowerCase() === selectedCategory.toLowerCase())
    : [];

  const showFiltered = selectedCategory !== null;

  useEffect(() => {
    const init = async () => {
      await loadRestaurants();
      await Promise.all([loadCategories(), loadFeatured()]);
    };
    init();
  }, [loadRestaurants, loadCategories, loadFeatured]);

  useEffect(() => {
    if (restaurants.length > 0) {
      const timer = setTimeout(() => loadAllMenus(), 500);
      return () => clearTimeout(timer);
    }
  }, [restaurants, loadAllMenus]);

  const [recommendedItems, setRecommendedItems] = useState<Array<MenuItem & { restaurantId: string }>>([]);

  useEffect(() => {
    const shuffle = () => {
      const allItems = restaurants.flatMap((r) => (r.menu || []).map((m) => ({ ...m, restaurantId: r.id })));
      const shuffled = [...allItems].sort(() => 0.5 - Math.random());
      setRecommendedItems(shuffled.slice(0, 4));
    };
    shuffle();
    const interval = setInterval(shuffle, 15000);
    return () => clearInterval(interval);
  }, [restaurants]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRestaurants(), loadCategories(), loadFeatured()]);
    setRefreshing(false);
  }, [loadRestaurants, loadCategories, loadFeatured]);

  useEffect(() => {
    loadRestaurants();
    loadCategories();
    loadFeatured();
  }, [loadRestaurants, loadCategories, loadFeatured]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.header, { backgroundColor: Colors[theme].surface, borderBottomColor: Colors[theme]['surface-container'] }]}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextCol}>
            <Text style={[styles.greeting, { color: Colors[theme]['on-surface-variant'] }]}>
              {greetingText},
            </Text>
            <Text style={[styles.greetingName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
              {user?.name || 'Guest'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: Colors[theme]['surface-container-low'] }]}
          onPress={() => router.push('/your-cart')}
        >
          <MaterialCommunityIcons name="cart-outline" size={22} color={Colors[theme]['on-surface']} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors[theme].primary} />
        }
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: Colors[theme]['error-container'] }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={Colors[theme]['on-error-container']} />
            <Text style={[styles.errorText, { color: Colors[theme]['on-error-container'] }]}>{error}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: Colors[theme]['surface-container-lowest'], borderColor: Colors[theme]['surface-container'] }]}
          onPress={() => router.push('/search')}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={Colors[theme]['on-surface-variant']} />
          <Text style={[styles.searchPlaceholder, { color: Colors[theme]['on-surface-variant'] }]}>
            Search for food, restaurants...
          </Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
            Categories
          </Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={[styles.seeAll, { color: Colors[theme].primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoading && categories.length === 0 ? (
          <CategorySkeleton />
        ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => setSelectedCategory(isSelected ? null : cat.name)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: isSelected
                        ? Colors[theme].primary
                        : Colors[theme]['surface-container-high'],
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={32}
                    color={isSelected ? '#ffffff' : Colors[theme]['on-surface']}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    {
                      color: isSelected ? Colors[theme].primary : Colors[theme]['on-surface'],
                      fontWeight: isSelected ? '700' : '400',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}

        {showFiltered && (
          <View style={styles.filteredSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
                {selectedCategory}
              </Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.seeAll, { color: Colors[theme].primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {filteredRestaurants.length > 0 && (
              <>
                <Text style={[styles.filteredSubtitle, { color: Colors[theme]['on-surface-variant'] }]}>
                  Restaurants
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.restaurantsRow}
                >
                  {filteredRestaurants.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/restaurant-details?id=${r.id}`)}
                      style={[styles.restaurantCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
                    >
                      <View style={styles.restaurantImageContainer}>
                        <OptimizedImage uri={r.image} style={styles.restaurantImage} />
                        <View style={[styles.ratingBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                          <MaterialCommunityIcons name="star" size={16} color={Colors[theme]['secondary-container']} />
                          <Text style={[styles.ratingText, { color: Colors[theme]['on-surface'] }]}>{r.rating}</Text>
                        </View>
                      </View>
                      <View style={styles.restaurantInfo}>
                        <Text style={[styles.restaurantName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                          {r.name}
                        </Text>
                        <Text style={[styles.restaurantMeta, { color: Colors[theme]['on-surface-variant'] }]}>
                          {r.cuisine} · {r.deliveryTime}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </> 
            )}

            {filteredMenuItems.length > 0 && (
              <>
                <Text style={[styles.filteredSubtitle, { color: Colors[theme]['on-surface-variant'] }]}>
                  Menu Items
                </Text>
                <View style={styles.filteredMenuGrid}>
                  {filteredMenuItems.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.filteredMenuItem, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
                      onPress={() => router.push(`/restaurant-details?id=${m.restaurantId}`)}
                      activeOpacity={0.7}
                    >
                      <OptimizedImage uri={m.image} style={styles.filteredMenuImage} />
                      <View style={styles.filteredMenuInfo}>
                        <Text style={[styles.filteredMenuName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                          {m.name}
                        </Text>
                        <Text style={[styles.filteredMenuDesc, { color: Colors[theme]['on-surface-variant'] }]} numberOfLines={2}>
                          {m.description}
                        </Text>
                        <Text style={[styles.filteredMenuPrice, { color: Colors[theme].primary }]}>
                          {formatPrice(m.price)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filteredRestaurants.length === 0 && filteredMenuItems.length === 0 && (
              <View style={styles.filteredEmpty}>
                <MaterialCommunityIcons name="food-off" size={32} color={Colors[theme]['on-surface-variant']} />
                <Text style={[styles.filteredEmptyText, { color: Colors[theme]['on-surface-variant'] }]}>
                  No items found in {selectedCategory}
                </Text>
              </View>
            )}
          </View>
        )}

        {!showFiltered && (
          <>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
            Popular Restaurants
          </Text>
        </View>

        {isLoading && featured.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantsRow}
          >
            {[1, 2, 3].map((i) => <RestaurantCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.restaurantsRow}
        >
          {featured.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              activeOpacity={0.9}
              onPress={() => router.push(`/restaurant-details?id=${restaurant.id}`)}
              style={[styles.restaurantCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
            >
              <View style={styles.restaurantImageContainer}>
                <OptimizedImage uri={restaurant.image} style={styles.restaurantImage} />
                <View style={[styles.ratingBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                  <MaterialCommunityIcons name="star" size={16} color={Colors[theme]['secondary-container']} />
                  <Text style={[styles.ratingText, { color: Colors[theme]['on-surface'] }]}>{restaurant.rating}</Text>
                </View>
              </View>
              <View style={styles.restaurantInfo}>
                <Text
                  style={[styles.restaurantName, { color: Colors[theme]['on-surface'] }]}
                  numberOfLines={1}
                >
                  {restaurant.name}
                </Text>
                <Text style={[styles.restaurantMeta, { color: Colors[theme]['on-surface-variant'] }]}>
                  {restaurant.cuisine} · {restaurant.deliveryTime}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        )}
        {/*This is were we will be updating deals for the customers  */}
        <View style={styles.dealSection}>
          <View style={[styles.dealBanner, { backgroundColor: Colors[theme].primary }]}>
            <View style={styles.dealContent}>
              <View style={[styles.dealTagWrapper, { backgroundColor: Colors[theme]['secondary-container'] }]}>
                <Text style={[styles.dealTagText, { color: Colors[theme]['on-secondary-container'] }]}>
                  Flash Deal
                </Text>
              </View>
              <Text style={styles.dealTitle}>50% OFF on{'\n'}Your First Order</Text>
              <Text style={styles.dealSubtitle}>Valid for the next 2 hours!</Text>
              <TouchableOpacity style={[styles.dealButton, { backgroundColor: Colors[theme].surface }]}>
                <Text style={[styles.dealButtonText, { color: Colors[theme].primary }]}>Claim Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>



        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
            Recommended for You
          </Text>
        </View>

        <View style={styles.recommendedGrid}>
          {recommendedItems.length > 0 ? (
            recommendedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.recommendedCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
                activeOpacity={0.8}
                onPress={() => router.push(`/restaurant-details?id=${item.restaurantId}`)}
              >
                <OptimizedImage uri={item.image || ''} style={styles.recommendedImage} />
                <View style={styles.recommendedInfo}>
                  <Text style={[styles.recommendedName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.recommendedPrice, { color: Colors[theme].primary }]}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyRecommendation}>
              <MaterialCommunityIcons name="food" size={40} color={Colors[theme]['surface-variant']} />
              <Text style={[styles.emptyRecText, { color: Colors[theme]['on-surface-variant'] }]}>
                No recommendations yet
              </Text>
            </View>
          )}
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: { flex: 1, ...Typography['body-sm'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingTextCol: { flex: 1 },
  greeting: { ...Typography['label-md'] },
  greetingName: { ...Typography.h2 },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: { paddingBottom: 100 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    ...Shadows.sm,
  },
  searchPlaceholder: { ...Typography['body-md'] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['container-padding'],
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h2 },
  seeAll: { ...Typography['label-md'] },
  categoriesRow: {
    paddingHorizontal: Spacing['container-padding'],
    gap: Spacing.md,
  },
  categoryItem: { alignItems: 'center', gap: Spacing.sm, width: 72 },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { ...Typography['label-md'], textAlign: 'center' },
  restaurantsRow: {
    paddingHorizontal: Spacing['container-padding'],
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  restaurantCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  restaurantImageContainer: { position: 'relative' },
  restaurantImage: { width: CARD_WIDTH, height: 160 },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  ratingText: { ...Typography['label-sm'], fontWeight: '700' },
  restaurantInfo: { padding: Spacing.md },
  restaurantName: { ...Typography['label-md'] },
  restaurantMeta: { ...Typography['body-sm'], marginTop: 4 },
  dealSection: {
    paddingHorizontal: Spacing['container-padding'],
    marginTop: Spacing.xl,
  },
  dealBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  dealContent: { gap: Spacing.sm },
  dealTagWrapper: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dealTagText: { ...Typography['label-sm'] },
  dealTitle: {
    ...Typography.display,
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 34,
  },
  dealSubtitle: {
    ...Typography['body-sm'],
    color: 'rgba(255,255,255,0.8)',
  },
  dealButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  dealButtonText: {
    ...Typography['label-md'],
  },

  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing['container-padding'],
    gap: Spacing.md,
  },
  recommendedCard: {
    width: (width - Spacing['container-padding'] * 2 - Spacing.md) / 2,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  recommendedImage: {
    width: '100%',
    height: (width - Spacing['container-padding'] * 2 - Spacing.md) / 2,
  },
  recommendedInfo: {
    padding: Spacing.sm,
  },
  recommendedName: { ...Typography['label-md'] },
  recommendedPrice: { ...Typography['label-sm'] },
  emptyRecommendation: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, width: '100%' },
  emptyRecText: { ...Typography['body-md'] },
  filteredSection: {
    paddingTop: Spacing.md,
  },
  filteredSubtitle: {
    ...Typography['label-md'],
    fontWeight: '600',
    paddingHorizontal: Spacing['container-padding'],
    marginBottom: Spacing.md,
  },
  filteredMenuGrid: {
    paddingHorizontal: Spacing['container-padding'],
    gap: Spacing.md,
  },
  filteredMenuItem: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  filteredMenuImage: {
    width: 80,
    height: 80,
  },
  filteredMenuInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: 2,
  },
  filteredMenuName: { ...Typography.h2 },
  filteredMenuDesc: { ...Typography['body-sm'] },
  filteredMenuPrice: { ...Typography.h2, marginTop: 4 },
  filteredEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: Spacing.sm,
  },
  filteredEmptyText: { ...Typography['body-md'] },
});
