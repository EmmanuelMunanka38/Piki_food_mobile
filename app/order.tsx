import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Images } from '@/constants/images';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Category {
  id: string;
  name: string;
  image: string;
  icon: IconName;
}

const categories: Category[] = [
  { id: '1', name: 'Sweets & Treats', image: Images.menuManagement.appetizers[0], icon: 'cupcake' },
  { id: '2', name: 'Breakfast & Brunch', image: Images.restaurantDetails.menuItems[1], icon: 'silverware-fork-knife' },
  { id: '3', name: 'Salads & Bowls', image: Images.login.salad, icon: 'leaf' },
  { id: '4', name: 'Sandwiches & Wraps', image: Images.restaurantDetails.menuItems[2], icon: 'bread-slice' },
  { id: '5', name: 'Pizza & Pasta', image: Images.home.restaurants[1].image, icon: 'pizza' },
  { id: '6', name: 'Burgers & Fries', image: Images.restaurantDetails.menuItems[4], icon: 'hamburger' },
  { id: '7', name: 'Drinks & Smoothies', image: Images.home.drinks[0], icon: 'glass-cocktail' },
  { id: '8', name: 'Sushi & Seafood', image: Images.cart.items[0], icon: 'fish' },
];

const ACTIVE_ROW_BG = '#FDE047';

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const [activeId, setActiveId] = useState<string>(categories[0].id);
  const [query, setQuery] = useState<string>('');

  const filteredCategories = query.trim()
    ? categories.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()))
    : categories;

  const renderItem = ({ item }: { item: Category }) => {
    const isActive = activeId === item.id;

    return (
      <TouchableOpacity
        onPress={() => setActiveId(item.id)}
        activeOpacity={0.85}
        style={[styles.row, { backgroundColor: Colors.light['surface-container-lowest'] }, isActive && styles.rowActive]}
      >
        <OptimizedImage uri={item.image} style={styles.thumb} fallbackIcon={item.icon} fallbackSize={26} />

        <Text
          style={[styles.name, { color: Colors.light['on-surface'] }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {isActive ? (
          <View style={styles.activeRight}>
            <View style={styles.activeCurve} />
            <View style={styles.activeCircle}>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#ffffff" />
            </View>
          </View>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.outline} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.title, { color: Colors.light['on-surface'] }]}>Order</Text>
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={22} color={Colors.light['on-surface-variant']} />
        <TextInput
          style={[styles.searchInput, { color: Colors.light['on-surface'] }]}
          placeholder="Search Food, groceries, drink, etc."
          placeholderTextColor={Colors.light['on-surface-variant']}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <View style={[styles.searchDivider, { backgroundColor: Colors.light['outline-variant'] }]} />
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color={Colors.light['on-surface-variant']} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCategories}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="text-search" size={40} color={Colors.light['outline-variant']} />
            <Text style={[styles.emptyText, { color: Colors.light['on-surface-variant'] }]}>
              No categories found
            </Text>
          </View>
        }
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        windowSize={5}
      />
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
  },
  title: { ...Typography.display },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 52,
    marginHorizontal: Spacing['container-padding'],
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light['surface-container-low'],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  searchDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    marginLeft: Spacing.xs,
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography['body-md'],
  },
  listContent: {
    paddingHorizontal: Spacing['container-padding'],
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    minHeight: 76,
  },
  rowActive: {
    backgroundColor: ACTIVE_ROW_BG,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  name: {
    flex: 1,
    ...Typography.h2,
  },
  activeRight: {
    position: 'relative',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCurve: {
    position: 'absolute',
    right: -4,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  activeCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
});
