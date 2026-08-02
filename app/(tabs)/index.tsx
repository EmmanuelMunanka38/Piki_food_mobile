import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import { MenuItem, Restaurant, Category } from '@/types';
import {
  useRestaurants,
  useFeaturedRestaurants,
  useCategories,
  useRestaurantMenus,
  getErrorMessage,
  restaurantKeys,
  categoryKeys,
} from '@/hooks/use-restaurants';
import { CategorySkeleton, RestaurantCardSkeleton } from '@/components/ui/SkeletonLoader';
import BrandedHeader from '@/components/BrandedHeader';
import DealCard from '@/components/DealCard';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { getRecommendationSeed } from '@/utils/recommendations';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const POPULAR_CARD_STEP = CARD_WIDTH + Spacing.lg;
const POPULAR_AUTOPLAY_MS = 3500;
const REC_CARD_WIDTH = Math.round(width * 0.66);
const REC_CARD_GAP = Spacing.md;
const NO_RESTAURANTS: Restaurant[] = [];
const NO_FEATURED: Restaurant[] = [];
const NO_CATEGORIES: Category[] = [];

const RECOMMENDED_COUNT = 4;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}



export default function HomeScreen() {
  const theme = 'light';
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { data: restaurants = NO_RESTAURANTS, isPending: restaurantsPending, error: restaurantsError } = useRestaurants();
  const { data: featured = NO_FEATURED, isPending: featuredPending, error: featuredError } = useFeaturedRestaurants();
  const { data: categories = NO_CATEGORIES, isPending: categoriesPending, error: categoriesError } = useCategories();
  const isLoading = restaurantsPending || (featuredPending && featured.length === 0) || (categoriesPending && categories.length === 0);
  const error = restaurantsError || featuredError || categoriesError;
  useRestaurantMenus(restaurants);
  const popularScrollRef = useRef<ScrollView>(null);
  const popularIndexRef = useRef(0);
  const popularDraggingRef = useRef(false);
  const refreshProgress = useRef(new Animated.Value(0)).current;
  const lastPullRef = useRef(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (refreshing) return;
    const progress = Math.max(0, Math.min(-y, 60));
    lastPullRef.current = progress;
    refreshProgress.setValue(progress);
  };

  const handleScrollEndDrag = () => {
    if (refreshing) return;
    if (lastPullRef.current >= 48) {
      setRefreshing(true);
      Animated.timing(refreshProgress, { toValue: 60, duration: 160, useNativeDriver: true }).start();
      handleRefresh();
    } else {
      Animated.spring(refreshProgress, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 30,
      }).start();
    }
  };

  const refreshOverlayTranslate = refreshProgress.interpolate({
    inputRange: [0, 60],
    outputRange: [-72, 0],
  });
  const refreshOverlayOpacity = refreshProgress.interpolate({
    inputRange: [0, 40, 60],
    outputRange: [0, 0.9, 1],
  });

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      if (popularDraggingRef.current) return;
      popularIndexRef.current = (popularIndexRef.current + 1) % featured.length;
      popularScrollRef.current?.scrollTo({
        x: popularIndexRef.current * POPULAR_CARD_STEP,
        animated: true,
      });
    }, POPULAR_AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [featured.length]);

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

  const [recommendedItems, setRecommendedItems] = useState<Array<MenuItem & { restaurantId: string }>>([]);
  const [recsReady, setRecsReady] = useState(false);

  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    const allItems = restaurants.flatMap((r) => (r.menu || []).map((m) => ({ ...m, restaurantId: r.id })));
    if (allItems.length === 0) {
      setRecommendedItems([]);
      setRecsReady(true);
      return;
    }
    let cancelled = false;
    setRecsReady(false);
    getRecommendationSeed(userId).then((seed) => {
      if (cancelled) return;
      const rand = mulberry32(seed);
      const shuffled = [...allItems];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setRecommendedItems(shuffled.slice(0, RECOMMENDED_COUNT));
      setRecsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurants, userId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    setRefreshing(false);
    Animated.timing(refreshProgress, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [queryClient, refreshProgress]);

  const errorMessage = getErrorMessage(error, 'Failed to load restaurants. Please check your connection and try again.');

  return (
    <BrandedHeader
      flat
      onSearchPress={() => router.push('/search')}
      overlay={
        <Animated.View
          style={[
            styles.refreshOverlay,
            {
              opacity: refreshOverlayOpacity,
              transform: [{ translateY: refreshOverlayTranslate }],
            },
          ]}
        >
          <ActivityIndicator size="large" color="#ffffff" />
        </Animated.View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        overScrollMode="always"
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: Colors[theme]['error-container'] }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={Colors[theme]['on-error-container']} />
            <Text style={[styles.errorText, { color: Colors[theme]['on-error-container'] }]}>{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.homeSearchBar, { backgroundColor: Colors[theme]['surface-container-low'] }]}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={Colors[theme]['on-surface-variant']} />
          <Text
            style={[styles.homeSearchPlaceholder, { color: Colors[theme]['on-surface-variant'] }]}
            numberOfLines={1}
          >
            Search restaurants, dishes & deals...
          </Text>
          <View style={[styles.homeSearchDivider, { backgroundColor: Colors[theme]['outline-variant'] }]} />
          <View style={styles.homeSearchFilter}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={Colors[theme]['on-surface-variant']} />
          </View>
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
        <DealCard onOrderPress={() => router.push('/search')} />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[theme]['on-surface'] }]}>
            Recommended for You
          </Text>
          <TouchableOpacity onPress={() => router.push('/search')} hitSlop={8}>
            <Text style={[styles.seeAll, { color: Colors[theme].primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {recommendedItems.length > 0 ? (
          <FlatList
            horizontal
            data={recommendedItems}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedList}
            snapToInterval={REC_CARD_WIDTH + REC_CARD_GAP}
            decelerationRate="fast"
            renderItem={({ item }) => {
              const restaurant = restaurants.find((r) => r.id === item.restaurantId);
              const rating = restaurant?.rating ?? 0;
              return (
                <TouchableOpacity
                  style={[styles.recommendedCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/food/${item.id}?restaurantId=${item.restaurantId}`)}
                >
                  <View style={styles.recommendedImageWrap}>
                    <OptimizedImage uri={item.image || ''} style={styles.recommendedImage} />
                    <View style={[styles.recRatingBadge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                      <MaterialCommunityIcons name="star" size={12} color="#F5A623" />
                      <Text style={[styles.recRatingText, { color: Colors[theme]['on-surface'] }]}>
                        {rating.toFixed(1)}
                      </Text>
                    </View>
                    {restaurant?.deliveryTime ? (
                      <View style={styles.timeBadge}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color="#ffffff" />
                        <Text style={styles.timeText}>{restaurant.deliveryTime} min</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.recommendedInfo}>
                    <Text style={[styles.recommendedName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.recommendedMeta, { color: Colors[theme]['on-surface-variant'] }]} numberOfLines={1}>
                      {restaurant?.cuisine || item.category}
                    </Text>
                    <View style={styles.recommendedFooter}>
                      <Text style={[styles.recommendedPrice, { color: Colors[theme]['on-surface'] }]}>
                        {formatPrice(item.price)}
                      </Text>
                      <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.85}
                        hitSlop={6}
                        onPress={() => addItem({ ...item })}
                      >
                        <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : recsReady ? (
          <View style={styles.emptyRecommendation}>
            <MaterialCommunityIcons name="food" size={40} color={Colors[theme]['surface-variant']} />
            <Text style={[styles.emptyRecText, { color: Colors[theme]['on-surface-variant'] }]}>
              No recommendations yet
            </Text>
          </View>
        ) : null}

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
          ref={popularScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.restaurantsRow}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            popularDraggingRef.current = true;
          }}
          onScrollEndDrag={() => {
            popularDraggingRef.current = false;
          }}
          onScroll={(e) => {
            popularIndexRef.current = Math.round(
              e.nativeEvent.contentOffset.x / POPULAR_CARD_STEP
            );
          }}
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
          </>
        )}
      </ScrollView>
    </BrandedHeader>
  );
}

const styles = StyleSheet.create({
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
  homeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 52,
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  homeSearchPlaceholder: {
    flex: 1,
    ...Typography['body-md'],
  },
  homeSearchDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    marginLeft: Spacing.xs,
  },
  homeSearchFilter: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshOverlay: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: BorderRadius.full,
  },
  scrollContent: { paddingBottom: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['container-padding'],
    marginTop: Spacing.sm,
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

  recommendedList: {
    paddingHorizontal: Spacing['container-padding'],
  },
  recommendedCard: {
    width: REC_CARD_WIDTH,
    marginRight: REC_CARD_GAP,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  recommendedImageWrap: { position: 'relative' },
  recommendedImage: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.light['surface-container'],
  },
  recRatingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  recRatingText: { ...Typography['label-sm'], fontWeight: '700' },
  timeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  timeText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  recommendedInfo: {
    padding: Spacing.sm,
  },
  recommendedName: { ...Typography['label-md'], fontWeight: '700' },
  recommendedMeta: { ...Typography['body-sm'], marginTop: 2 },
  recommendedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  recommendedPrice: { ...Typography['label-md'], fontWeight: '700' },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
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
