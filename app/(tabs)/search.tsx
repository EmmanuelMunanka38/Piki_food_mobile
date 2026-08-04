import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { usePopularFoods, useFoodSearch } from '@/hooks/use-restaurants';
import { useCartStore } from '@/store/cartStore';
import { FoodItem } from '@/types';

const FILTERS = ['All', 'Fast Delivery', 'Rating 4.5+', 'Free Delivery'] as const;

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rating' },
  { value: 'fastest', label: 'Fastest Delivery' },
] as const;

type FilterValue = (typeof FILTERS)[number];
type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const SEARCH_DEBOUNCE_MS = 350;
const POPULAR_LIMIT = 8;

function parseMinutes(deliveryTime: string): number {
  const match = /(\d+)/.exec(deliveryTime);
  return match ? parseInt(match[1], 10) : 60;
}

export default function SearchScreen() {
  const theme = 'light';
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('All');
  const [sortOrder, setSortOrder] = useState<SortValue>('recommended');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const isSearching = debouncedQuery.trim().length >= 2;

  const { data: popularFoods = [], isPending: popularPending } = usePopularFoods(POPULAR_LIMIT);
  const { data: searchResults = [], isFetching: searchFetching } = useFoodSearch(debouncedQuery);

  const baseItems: FoodItem[] = isSearching ? searchResults : popularFoods;
  const isLoading = isSearching ? searchFetching && searchResults.length === 0 : popularPending;

  const filteredItems = useMemo(() => {
    let list = baseItems;
    if (activeFilter === 'Fast Delivery') {
      list = list.filter((m) => parseMinutes(m.restaurant.deliveryTime) <= 30);
    } else if (activeFilter === 'Rating 4.5+') {
      list = list.filter((m) => m.restaurant.rating >= 4.5);
    } else if (activeFilter === 'Free Delivery') {
      list = list.filter((m) => m.restaurant.deliveryFee === 0);
    }

    const sorted = [...list];
    if (sortOrder === 'rating') {
      sorted.sort((a, b) => b.restaurant.rating - a.restaurant.rating);
    } else if (sortOrder === 'fastest') {
      sorted.sort(
        (a, b) => parseMinutes(a.restaurant.deliveryTime) - parseMinutes(b.restaurant.deliveryTime)
      );
    }
    return sorted;
  }, [baseItems, activeFilter, sortOrder]);

  const renderFoodCard = ({ item }: { item: FoodItem }) => {
    const { restaurant } = item;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: Colors[theme]['surface-container-lowest'] }]}
        activeOpacity={0.9}
        onPress={() => router.push(`/food/${item.id}?restaurantId=${item.restaurantId}`)}
      >
        <View style={styles.cardImageWrap}>
          <OptimizedImage uri={item.image} style={styles.cardImage} fallbackIcon="food" fallbackSize={34} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardSubtitle, { color: Colors[theme].primary }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.cardMetaRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={Colors[theme]['on-surface-variant']} />
            <Text style={[styles.cardMetaText, { color: Colors[theme]['on-surface-variant'] }]}>
              {restaurant.deliveryTime}
            </Text>
            <View style={[styles.metaDot, { backgroundColor: Colors[theme]['on-surface-variant'] }]} />
            <MaterialCommunityIcons name="bike" size={13} color={Colors[theme]['on-surface-variant']} />
            <Text style={[styles.cardMetaText, { color: Colors[theme]['on-surface-variant'] }]}>
              {formatPrice(restaurant.deliveryFee)}
            </Text>
          </View>
        </View>

        <View style={[styles.ratingBadge, { backgroundColor: Colors[theme].primary }]}>
          <MaterialCommunityIcons name="star" size={12} color="#ffffff" />
          <Text style={styles.ratingText}>{restaurant.rating}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors[theme].primary }]}
          onPress={() => addItem(item)}
          activeOpacity={0.8}
          hitSlop={6}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme]['surface'] }]}>
      <View style={[styles.header, { backgroundColor: Colors[theme].primary, paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerDecorLarge} />
        <View style={styles.headerDecorSmall} />
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon} activeOpacity={0.7} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Food</Text>
        <TouchableOpacity
          onPress={() => setShowSearch((v) => !v)}
          style={styles.headerIcon}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="magnify" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors[theme].primary} />
          <TextInput
            style={[styles.searchInput, { color: Colors[theme]['on-surface'] }]}
            placeholder="Search food, dishes..."
            placeholderTextColor={Colors[theme]['on-surface-variant']}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={6} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close-circle" size={20} color={Colors[theme]['on-surface-variant']} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          keyboardShouldPersistTaps="handled"
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive
                      ? Colors[theme].primary
                      : Colors[theme]['surface-container-low'],
                  },
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isActive ? '#ffffff' : Colors[theme]['on-surface'] },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          onPress={() => setSortOpen(true)}
          style={[styles.filterButton, { backgroundColor: Colors[theme]['surface-container-low'] }]}
          activeOpacity={0.75}
          hitSlop={6}
        >
          <MaterialCommunityIcons name="tune-variant" size={22} color={Colors[theme].primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderFoodCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors[theme].primary} />
              <Text style={[styles.loadingText, { color: Colors[theme]['on-surface-variant'] }]}>
                Searching food...
              </Text>
            </View>
          ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
              <MaterialCommunityIcons name="food-off" size={40} color={Colors[theme]['on-surface-variant']} />
            </View>
            <Text style={[styles.emptyTitle, { color: Colors[theme]['on-surface'] }]}>
              {isSearching ? 'No food found' : 'No food yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: Colors[theme]['on-surface-variant'] }]}>
              {isSearching
                ? 'Try changing your search or filters'
                : 'Check back later for available food'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setDebouncedQuery('');
                setActiveFilter('All');
                setShowSearch(false);
              }}
              style={[styles.emptyReset, { backgroundColor: Colors[theme].primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyResetText}>Reset filters</Text>
            </TouchableOpacity>
          </View>
          )
        }
      />

      <Modal
        visible={sortOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSortOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSortOpen(false)}>
          <View style={[styles.modalCard, { backgroundColor: Colors[theme].surface, paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: Colors[theme]['on-surface'] }]}>Sort Food</Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = sortOrder === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    setSortOrder(option.value);
                    setSortOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: isSelected ? Colors[theme].primary : Colors[theme]['on-surface'] },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={Colors[theme].primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: Spacing.md,
    overflow: 'hidden',
  },
  headerDecorLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDecorSmall: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    fontWeight: '700',
    textAlign: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    marginHorizontal: Spacing['container-padding'],
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  searchInput: {
    flex: 1,
    ...Typography['body-md'],
    paddingVertical: 0,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['container-padding'],
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pillsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  pillText: { ...Typography['label-md'], fontWeight: '600' },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: Spacing['container-padding'],
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 16,
    ...Shadows.sm,
  },
  cardImageWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light['surface-container'],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingRight: 44,
    gap: 2,
  },
  cardName: {
    ...Typography['label-md'],
    fontWeight: '700',
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography['body-sm'],
    fontWeight: '600',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  cardMetaText: { ...Typography['label-sm'] },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 2 },

  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  ratingText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: Spacing.xl,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: Spacing.md,
  },
  loadingText: { ...Typography['body-md'] },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { ...Typography.h1, textAlign: 'center' },
  emptySubtitle: {
    ...Typography['body-md'],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyReset: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyResetText: { ...Typography['label-md'], fontWeight: '700', color: '#ffffff' },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light['surface-container-high'],
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { ...Typography.h2, fontWeight: '700', marginBottom: Spacing.sm },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  modalOptionText: { ...Typography['body-lg'] },
});
