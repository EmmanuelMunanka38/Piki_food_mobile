import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import { useDriverStore } from '@/store/driverStore';
import { useDriverSocketStore } from '@/store/driverSocketStore';
import { useLocationStore } from '@/store/locationStore';
import { mapService } from '@/services/map.service';
import { MapboxMap } from '@/components/map/MapboxMap';
import { MapControls } from '@/components/map/MapControls';
import { Coordinate } from '@/types';

const DAR_CENTER = { latitude: -6.7924, longitude: 39.2083 };


export default function DriverDashboardScreen() {
  const theme = 'light';
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const {
    isOnline, earnings, totalDeliveries, requests, activeDelivery,
    toggleOnline, fetchRequests, acceptDelivery, ignoreDelivery, addRequest,
  } = useDriverStore();
  const {
    connect: connectSocket,
    disconnect: disconnectSocket,
    setOnline: setSocketOnline,
    requestQueue,
  } = useDriverSocketStore();
  const [sheetIndex, setSheetIndex] = useState(0);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [hasFittedBounds, setHasFittedBounds] = useState(false);

  const request = requests[0];
  const restaurantLoc = request?.restaurant?.location;

  useEffect(() => {
    fetchRequests();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchRequests, connectSocket, disconnectSocket]);

  useEffect(() => {
    if (activeDelivery) {
      router.push('/driver/active-delivery');
    }
  }, [activeDelivery]);

  useEffect(() => {
    if (requestQueue.length > 0) {
      requestQueue.forEach((r) => addRequest(r));
      useDriverSocketStore.getState().clearQueue();
    }
  }, [requestQueue, addRequest]);

  useEffect(() => {
    if (!currentLocation || !restaurantLoc) return;
    setIsLoadingRoute(true);
    let cancelled = false;
    const fetchRoute = async () => {
      try {
        const result = await mapService.fetchRoute(
          [currentLocation.longitude, currentLocation.latitude],
          [restaurantLoc.longitude, restaurantLoc.latitude],
        );
        if (result && !cancelled) {
          setRouteCoords(result.coordinates);
        }
      } catch {
        // route fetch failed
      } finally {
        if (!cancelled) setIsLoadingRoute(false);
      }
    };
    fetchRoute();
    return () => { cancelled = true; };
  }, [currentLocation?.latitude, currentLocation?.longitude, restaurantLoc?.latitude, restaurantLoc?.longitude]);

  const handleRecenter = useCallback(() => {
    const target = currentLocation || DAR_CENTER;
    mapRef.current?.flyTo(target, 14);
  }, [currentLocation]);

  const handleMyLocation = useCallback(() => {
    if (currentLocation) {
      mapRef.current?.flyTo(currentLocation, 16);
    }
  }, [currentLocation]);

  const handleFitBounds = useCallback(() => {
    if (!currentLocation && !restaurantLoc) return;
    const points = [currentLocation, restaurantLoc].filter(Boolean) as Coordinate[];
    if (points.length < 2) {
      mapRef.current?.flyTo(currentLocation || DAR_CENTER, 14);
      return;
    }
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    mapRef.current?.fitBounds(
      { latitude: Math.max(...lats), longitude: Math.max(...lngs) },
      { latitude: Math.min(...lats), longitude: Math.min(...lngs) },
      80,
    );
  }, [currentLocation, restaurantLoc]);

  useEffect(() => {
    if (currentLocation && !hasFittedBounds) {
      handleFitBounds();
      setHasFittedBounds(true);
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  useEffect(() => {
    handleFitBounds();
  }, [restaurantLoc?.latitude, restaurantLoc?.longitude]);

  const displayLoc = currentLocation || DAR_CENTER;

  const markers = useMemo(() => {
    const m: any[] = [
      { id: 'driver', latitude: displayLoc.latitude, longitude: displayLoc.longitude, title: 'Driver', icon: 'bike', color: Colors[theme].primary },
    ];
    if (restaurantLoc) {
      m.push({ id: 'restaurant', latitude: restaurantLoc.latitude, longitude: restaurantLoc.longitude, title: request?.restaurant.name || 'Restaurant', icon: 'store', color: Colors[theme].primary });
    }
    return m;
  }, [displayLoc, restaurantLoc, request?.restaurant.name]);

  const snapPoints = useMemo(() => ['25%', '55%'], []);

  const handleSheetChange = useCallback((index: number) => {
    setSheetIndex(index);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <MapboxMap
          ref={mapRef}
          initialCamera={{ latitude: displayLoc.latitude, longitude: displayLoc.longitude, zoom: 14 }}
          style={StyleSheet.absoluteFillObject}
          markers={markers}
          routePolyline={routeCoords && routeCoords.length >= 2 ? {
            coordinates: routeCoords,
            color: Colors[theme].primary,
            width: 4,
          } : undefined}
        />

        <View style={[styles.headerOverlay, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoIcon, { backgroundColor: Colors[theme]['primary-container'] }]}>
              <MaterialCommunityIcons name="bike" size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={[styles.greeting, { color: Colors[theme]['on-surface-variant'] }]}>Good to see you</Text>
              <Text style={[styles.driverName, { color: Colors[theme]['on-surface'] }]}>Driver</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={Colors[theme]['on-surface']} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: isOnline ? Colors[theme].primary : Colors[theme]['surface-container-high'] }]}
              onPress={() => { toggleOnline(); setSocketOnline(!isOnline); }}
            >
              <View style={[styles.statusDot, { backgroundColor: '#ffffff' }]} />
              <Text style={[styles.statusBadgeText, { color: '#ffffff' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <MapControls
          onRecenter={handleRecenter}
          onMyLocation={handleMyLocation}
        />

        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChange}
          handleIndicatorStyle={styles.handleIndicator}
          handleStyle={styles.handleContainer}
          backgroundStyle={[styles.sheetBackground, { backgroundColor: Colors[theme].surface }]}
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} opacity={0.3} />
          )}
          enablePanDownToClose={false}
          animateOnMount
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Collapsed row */}
            <TouchableOpacity
              style={styles.collapsedRow}
              onPress={() => bottomSheetRef.current?.snapToIndex(1)}
              activeOpacity={0.7}
            >
              <View style={styles.collapsedLeft}>
                <View style={[styles.collapsedDot, { backgroundColor: isOnline ? Colors[theme].primary : Colors[theme]['on-surface-variant'] }]} />
                <View>
                  <Text style={[styles.collapsedStatus, { color: Colors[theme]['on-surface'] }]}>
                    {isOnline ? 'Accepting orders' : 'Offline'}
                  </Text>
                  <Text style={[styles.collapsedEta, { color: Colors[theme]['on-surface-variant'] }]}>
                    {isOnline ? `${formatPrice(earnings)} earned today` : 'Go online to receive orders'}
                  </Text>
                </View>
              </View>
              <View style={styles.collapsedRight}>
                <Text style={[styles.earningsMini, { color: Colors[theme].primary }]}>{totalDeliveries}</Text>
                <Text style={[styles.earningsMiniLabel, { color: Colors[theme]['on-surface-variant'] }]}>orders</Text>
              </View>
            </TouchableOpacity>

            {/* Earnings card */}
            <View style={[styles.earningsCard, { backgroundColor: Colors[theme]['surface-container-lowest'], borderColor: Colors[theme]['surface-variant'] }]}>
              <View style={styles.earningsRow}>
                <View style={styles.earningsItem}>
                  <Text style={[styles.earningsLabel, { color: Colors[theme]['on-surface-variant'] }]}>Earnings Today</Text>
                  <Text style={[styles.earningsValue, { color: Colors[theme].primary }]}>{formatPrice(earnings)}</Text>
                </View>
                <View style={[styles.earningsDivider, { backgroundColor: Colors[theme]['surface-variant'] }]} />
                <View style={styles.earningsItem}>
                  <Text style={[styles.earningsLabel, { color: Colors[theme]['on-surface-variant'] }]}>Total Orders</Text>
                  <Text style={[styles.earningsValue, { color: Colors[theme]['on-surface'] }]}>{totalDeliveries}</Text>
                </View>
              </View>
            </View>

            {/* Incoming request or empty state */}
            {request ? (
              <View style={[styles.requestCard, { backgroundColor: Colors[theme].surface, borderColor: 'rgba(15,169,88,0.15)' }]}>
                <View style={[styles.requestHeader, { backgroundColor: Colors[theme]['surface-container-low'], borderBottomColor: Colors[theme]['surface-container'] }]}>
                  <View style={styles.requestHeaderLeft}>
                    <View style={[styles.pulseDot, { backgroundColor: Colors[theme].primary }]} />
                    <Text style={[styles.requestTitle, { color: Colors[theme].primary }]}>New Request</Text>
                  </View>
                  <View style={[styles.timerBadge, { backgroundColor: Colors[theme]['surface-container-high'] }]}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={Colors[theme]['on-surface-variant']} />
                    <Text style={[styles.requestTimer, { color: Colors[theme]['on-surface-variant'] }]}>
                      {`${String(Math.floor(request.timeLeft / 60)).padStart(2, '0')}:${String(request.timeLeft % 60).padStart(2, '0')}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestBody}>
                  <View style={styles.requestRestaurant}>
                    <View style={[styles.requestIcon, { backgroundColor: Colors[theme]['surface-container-high'] }]}>
                      <OptimizedImage uri={request.restaurant.image} style={styles.requestImage} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requestName, { color: Colors[theme]['on-surface'] }]}>{request.restaurant.name}</Text>
                      <View style={styles.distanceRow}>
                        <MaterialCommunityIcons name="crosshairs-gps" size={14} color={Colors[theme]['on-surface-variant']} />
                        <Text style={[styles.requestDistance, { color: Colors[theme]['on-surface-variant'] }]}>{request.distance} km away</Text>
                      </View>
                    </View>
                    <View style={styles.feeBox}>
                      <Text style={[styles.feeValue, { color: Colors[theme]['secondary-container'] }]}>{formatPrice(request.deliveryFee)}</Text>
                      <Text style={[styles.feeLabel, { color: Colors[theme]['on-surface-variant'] }]}>Delivery fee</Text>
                    </View>
                  </View>

                  {isLoadingRoute ? (
                    <View style={styles.routeLoading}>
                      <ActivityIndicator size="small" color={Colors[theme].primary} />
                      <Text style={[styles.routeLoadingText, { color: Colors[theme]['on-surface-variant'] }]}>Calculating route...</Text>
                    </View>
                  ) : (
                    <View style={styles.routeSection}>
                      <View style={styles.routeLine}>
                        <View style={[styles.routeDot, { backgroundColor: Colors[theme].primary }]} />
                        <View style={[styles.routeDash, { borderColor: Colors[theme]['outline-variant'] }]} />
                        <View style={[styles.routeDot, { backgroundColor: Colors[theme]['secondary-container'] }]} />
                      </View>
                      <View style={styles.routeInfo}>
                        <View>
                          <Text style={[styles.routeLabel, { color: Colors[theme]['on-surface-variant'] }]}>PICKUP</Text>
                          <Text style={[styles.routeAddress, { color: Colors[theme]['on-surface'] }]}>{request.pickup}</Text>
                        </View>
                        <View>
                          <Text style={[styles.routeLabel, { color: Colors[theme]['on-surface-variant'] }]}>DROP-OFF</Text>
                          <Text style={[styles.routeAddress, { color: Colors[theme]['on-surface'] }]}>{request.dropoff}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.itemsPreview}>
                    <MaterialCommunityIcons name="shopping-outline" size={16} color={Colors[theme]['on-surface-variant']} />
                    <Text style={[styles.itemsPreviewText, { color: Colors[theme]['on-surface-variant'] }]} numberOfLines={1}>
                      {request.items.join(', ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.ignoreBtn, { borderColor: Colors[theme]['outline-variant'] }]}
                    onPress={() => ignoreDelivery(request.id)}
                  >
                    <Text style={[styles.ignoreBtnText, { color: Colors[theme]['on-surface-variant'] }]}>Ignore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: Colors[theme]['primary-container'] }]}
                    onPress={async () => {
                      await acceptDelivery(request.id);
                      router.push('/driver/active-delivery');
                    }}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
                  <MaterialCommunityIcons name="bike" size={40} color={Colors[theme]['on-surface-variant']} />
                </View>
                <Text style={[styles.emptyTitle, { color: Colors[theme]['on-surface'] }]}>No incoming requests</Text>
                <Text style={[styles.emptySubtitle, { color: Colors[theme]['on-surface-variant'] }]}>
                  {isOnline ? 'Waiting for nearby orders...' : 'Go online to start receiving requests'}
                </Text>
                {!isOnline && (
                  <TouchableOpacity
                    style={[styles.goOnlineBtn, { backgroundColor: Colors[theme].primary }]}
                    onPress={() => { toggleOnline(); setSocketOnline(true); }}
                  >
                    <Text style={styles.goOnlineBtnText}>Go Online</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bottom nav spacer */}
            <View style={{ height: 80 }} />
          </BottomSheetScrollView>
        </BottomSheet>

        <View style={[styles.bottomNav, { backgroundColor: Colors[theme].surface }]}>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="home" size={24} color={Colors[theme].primary} />
            <Text style={[styles.navLabel, { color: Colors[theme].primary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/driver/search')}>
            <MaterialCommunityIcons name="magnify" size={24} color={Colors[theme]['on-surface-variant']} />
            <Text style={[styles.navLabel, { color: Colors[theme]['on-surface-variant'] }]}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/driver/orders')}>
            <MaterialCommunityIcons name="receipt" size={24} color={Colors[theme]['on-surface-variant']} />
            <Text style={[styles.navLabel, { color: Colors[theme]['on-surface-variant'] }]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/driver/profile')}>
            <MaterialCommunityIcons name="account" size={24} color={Colors[theme]['on-surface-variant']} />
            <Text style={[styles.navLabel, { color: Colors[theme]['on-surface-variant'] }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handleContainer: { paddingTop: Spacing.sm },
  handleIndicator: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: Colors.light['surface-container-highest'],
  },
  sheetBackground: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 16,
  },
  sheetScrollContent: { paddingHorizontal: Spacing['container-padding'], paddingTop: Spacing.sm },

  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['container-padding'], paddingTop: 54, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logoIcon: { width: 36, height: 36, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  greeting: { ...Typography['label-sm'] },
  driverName: { ...Typography.h2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { ...Typography['label-sm'], fontWeight: '700' },

  collapsedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
  },
  collapsedLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  collapsedDot: { width: 10, height: 10, borderRadius: 5 },
  collapsedStatus: { ...Typography.h2 },
  collapsedEta: { ...Typography['body-sm'], marginTop: 1 },
  collapsedRight: { alignItems: 'center' },
  earningsMini: { ...Typography.h2, fontWeight: '700' },
  earningsMiniLabel: { ...Typography['label-sm'] },

  earningsCard: {
    borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  earningsRow: { flexDirection: 'row', alignItems: 'center' },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsDivider: { width: 1, height: 40, marginHorizontal: Spacing.md },
  earningsLabel: { ...Typography['label-sm'], textTransform: 'uppercase', letterSpacing: 0.5 },
  earningsValue: { ...Typography.h2, marginTop: 4 },

  requestCard: {
    borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md,
    ...Shadows.lg, borderWidth: 1,
  },
  requestHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
  },
  requestHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  requestTitle: { ...Typography['label-md'], fontWeight: '700' },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  requestTimer: { ...Typography['label-sm'] },
  requestBody: { padding: Spacing.md },
  requestRestaurant: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  requestIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, overflow: 'hidden' },
  requestImage: { width: '100%', height: '100%' },
  requestName: { ...Typography.h2 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  requestDistance: { ...Typography['body-sm'] },
  feeBox: { alignItems: 'flex-end' },
  feeValue: { ...Typography.h2 },
  feeLabel: { ...Typography['label-sm'] },
  routeLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  routeLoadingText: { ...Typography['body-sm'] },
  routeSection: { flexDirection: 'row', gap: Spacing.md },
  routeLine: { alignItems: 'center', width: 8, gap: 2 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeDash: { flex: 1, width: 0, borderLeftWidth: 2, borderStyle: 'dashed', marginVertical: 2 },
  routeInfo: { flex: 1, justifyContent: 'space-between', gap: Spacing.md },
  routeLabel: { ...Typography['label-sm'], letterSpacing: 1 },
  routeAddress: { ...Typography['body-md'] },
  itemsPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  itemsPreviewText: { ...Typography['body-sm'], flex: 1 },
  requestActions: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.light['surface-container'],
  },
  ignoreBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1.5, alignItems: 'center' },
  ignoreBtnText: { ...Typography['label-md'] },
  acceptBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, alignItems: 'center' },
  acceptBtnText: { ...Typography['label-md'], color: '#ffffff' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyIcon: { width: 80, height: 80, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Typography.h2 },
  emptySubtitle: { ...Typography['body-md'], textAlign: 'center' },
  goOnlineBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl },
  goOnlineBtnText: { ...Typography['label-md'], color: '#ffffff', fontWeight: '700' },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 32,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    shadowColor: '#0fa958', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 8,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { ...Typography['label-sm'] },
});
