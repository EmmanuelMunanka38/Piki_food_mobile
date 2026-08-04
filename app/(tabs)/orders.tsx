import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice, formatDateTime, getStatusLabel } from '@/utils/format';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function OrdersScreen() {
  const theme = 'light';
  const insets = useSafeAreaInsets();
  const { orders, isLoading, loadOrders, cancelOrder, deleteOrders } = useOrderStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allSelected = orders.length > 0 && selectedIds.length === orders.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : orders.map((o) => o.id));
  };

  const handleCancel = (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancellingId(orderId);
          try {
            await cancelOrder(orderId);
          } catch {
            Alert.alert('Error', 'Failed to cancel order');
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Delete Orders',
      `Delete ${selectedIds.length} selected order${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteOrders(selectedIds);
              setSelectMode(false);
              setSelectedIds([]);
            } catch {
              Alert.alert('Error', 'Failed to delete orders. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleReorder = () => {};

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: Colors[theme].background }]}>
        <ActivityIndicator size="large" color={Colors[theme].primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <View style={[styles.header, { backgroundColor: Colors[theme].surface, borderBottomColor: Colors[theme]['surface-container'] }]}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="map-marker" size={24} color={Colors[theme].primary} />
            <Text style={[styles.headerTitle, { color: Colors[theme].primary }]}>Orders</Text>
          </View>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
            <MaterialCommunityIcons name="cart-outline" size={20} color={Colors[theme].primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <MaterialCommunityIcons name="receipt" size={64} color={Colors[theme]['surface-variant']} />
          <Text style={[styles.emptyText, { color: Colors[theme]['on-surface-variant'] }]}>No orders yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.header, { backgroundColor: Colors[theme].surface, borderBottomColor: Colors[theme]['surface-container'] }]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="map-marker" size={24} color={Colors[theme].primary} />
          <Text style={[styles.headerTitle, { color: Colors[theme].primary }]}>Orders</Text>
        </View>
        {selectMode ? (
          <TouchableOpacity style={[styles.selectBtn, { backgroundColor: Colors[theme]['surface-container-low'] }]} onPress={toggleSelectMode} activeOpacity={0.7} hitSlop={8}>
            <Text style={[styles.selectBtnText, { color: Colors[theme]['on-surface-variant'] }]}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.selectBtn, { backgroundColor: Colors[theme]['surface-container-low'] }]} onPress={toggleSelectMode} activeOpacity={0.7} hitSlop={8}>
            <MaterialCommunityIcons name="checkbox-multiple-blank-outline" size={18} color={Colors[theme].primary} />
            <Text style={[styles.selectBtnText, { color: Colors[theme].primary }]}>Select</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, selectMode && styles.scrollContentSelect]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors[theme].primary} />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: Colors[theme]['on-surface'] }]}>Recent Orders</Text>
          <Text style={[styles.pageSubtitle, { color: Colors[theme]['on-surface-variant'] }]}>
            View and manage your previous meal selections.
          </Text>
        </View>

        <View style={styles.ordersList}>
          {orders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            const isDelivered = order.status === 'delivered';
            const canCancel = !isCancelled && !isDelivered;
            const itemSummary = order.items.map((i) => i.name).join(', ');
            const foodImage = order.items[0]?.image || order.restaurant?.image || '';
            const isSelected = selectedIds.includes(order.id);

            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (selectMode) {
                    toggleOrderSelection(order.id);
                  } else {
                    router.push(`/checkout/track-order?id=${order.id}`);
                  }
                }}
              >
                <View style={[styles.orderCard, { backgroundColor: Colors[theme]['surface-container-lowest'] }, isSelected && styles.orderCardSelected]}>
                  <View style={styles.orderMain}>
                    {selectMode && (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <MaterialCommunityIcons name="check" size={16} color="#ffffff" />}
                      </View>
                    )}
                    <OptimizedImage uri={foodImage} style={styles.foodImage} fallbackIcon="food" />
                    <View style={styles.orderInfo}>
                      <Text style={[styles.restaurantName, { color: Colors[theme]['on-surface'] }]} numberOfLines={1}>
                        {order.restaurant.name}
                      </Text>
                      <Text style={[styles.orderItems, { color: Colors[theme]['on-surface-variant'] }]} numberOfLines={1}>
                        {itemSummary}
                      </Text>
                      <View style={styles.orderDateRow}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={Colors[theme]['on-surface-variant']} />
                        <Text style={[styles.orderDate, { color: Colors[theme]['on-surface-variant'] }]}>
                          {formatDateTime(order.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isDelivered ? 'rgba(15, 169, 88, 0.1)' : isCancelled ? Colors[theme]['error-container'] : 'rgba(253, 192, 3, 0.1)' }]}>
                      <Text style={[styles.statusText, { color: isDelivered ? Colors[theme]['primary-container'] : isCancelled ? Colors[theme].error : Colors[theme].tertiary }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.orderDivider, { backgroundColor: Colors[theme]['surface-container'] }]} />

                  <View style={styles.orderBottom}>
                    <View style={styles.amountBlock}>
                      <Text style={[styles.amountLabel, { color: Colors[theme]['on-surface-variant'] }]}>Total</Text>
                      <Text style={[styles.amountValue, { color: isCancelled ? Colors[theme].tertiary : Colors[theme].primary }]}>
                        {formatPrice(order.total)}
                      </Text>
                    </View>
                    {!selectMode && (canCancel ? (
                      <TouchableOpacity
                        onPress={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        style={[
                          styles.actionButton,
                          { backgroundColor: Colors[theme]['error-container'], borderWidth: 0 },
                        ]}
                      >
                        <Text style={[styles.actionButtonText, { color: Colors[theme].error }]}>
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                        </Text>
                      </TouchableOpacity>
                    ) : isDelivered ? (
                      <TouchableOpacity
                        onPress={handleReorder}
                        style={[
                          styles.actionButton,
                          { backgroundColor: Colors[theme]['primary-container'], borderWidth: 0 },
                        ]}
                      >
                        <Text style={[styles.actionButtonText, { color: Colors[theme]['on-primary'] }]}>
                          Reorder
                        </Text>
                      </TouchableOpacity>
                    ) : null)}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Select-mode bottom bar */}
      {selectMode && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: Colors[theme].surface,
              borderTopColor: Colors[theme]['surface-container'],
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll} activeOpacity={0.7} hitSlop={8}>
            <MaterialCommunityIcons
              name={allSelected ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
              size={22}
              color={Colors[theme].primary}
            />
            <Text style={[styles.selectAllText, { color: Colors[theme].primary }]}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              { backgroundColor: selectedIds.length > 0 ? Colors[theme].error : Colors[theme]['surface-container-high'] },
            ]}
            onPress={handleDeleteSelected}
            disabled={selectedIds.length === 0 || deleting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ffffff" />
                <Text style={styles.deleteBtnText}>Delete ({selectedIds.length})</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  emptyText: { ...Typography['body-lg'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle: { ...Typography.h2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  selectBtnText: { ...Typography['label-md'], fontWeight: '600' },
  scrollContent: { padding: Spacing['container-padding'], paddingBottom: 100 },
  scrollContentSelect: { paddingBottom: 160 },
  pageHeader: { marginBottom: Spacing.lg },
  pageTitle: { ...Typography.h1, marginBottom: Spacing.xs },
  pageSubtitle: { ...Typography['body-sm'] },
  ordersList: { gap: Spacing.md },
  orderCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.light['surface-container'],
  },
  orderCardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  orderMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.light['outline-variant'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  foodImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  orderInfo: { flex: 1, gap: 3 },
  restaurantName: { ...Typography['label-md'], fontWeight: '700' },
  orderItems: { ...Typography['body-sm'] },
  orderDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  orderDate: { ...Typography['label-sm'] },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { ...Typography['label-sm'] },
  orderDivider: { height: 1, marginVertical: Spacing.md },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountBlock: { gap: 2 },
  amountLabel: { ...Typography['label-sm'] },
  amountValue: { ...Typography.h2, fontWeight: '800' },
  actionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  actionButtonText: { ...Typography['label-md'] },

  // Select-mode bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    ...Shadows.md,
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  selectAllText: { ...Typography['label-md'], fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  deleteBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
