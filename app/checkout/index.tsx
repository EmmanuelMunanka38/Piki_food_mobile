import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { ordersService } from '@/services/orders.service';
import { paymentService } from '@/services/payment.service';
import { PaymentMethod } from '@/types';

type PaymentOption = 'airtel_money' | 'mixx_by_yas' | 'halopesa' | 'mpesa' | 'card' | 'cash';

interface PaymentMethodOption {
  id: PaymentOption;
  name: string;
  detail: string;
  color?: string;
  logo?: number;
  icon?: string;
  active: boolean;
}

const GREEN_TINT = '#E8F5EE';

const PAYMENT_MAP: Record<PaymentOption, PaymentMethod> = {
  airtel_money: 'airtel_money',
  mixx_by_yas: 'mixx_by_yas',
  halopesa: 'halopesa',
  mpesa: 'mpesa',
  card: 'card',
  cash: 'cash',
};

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    detail: 'Pay via USSD push',
    logo: require('@/assets/images/payment/airtel-money.png'),
    active: true,
  },
  {
    id: 'mixx_by_yas',
    name: 'Mixx by Yas',
    detail: 'Pay via USSD push',
    logo: require('@/assets/images/payment/mixx-by-yas.png'),
    active: true,
  },
  {
    id: 'halopesa',
    name: 'HaloPesa',
    detail: 'Pay via USSD push',
    logo: require('@/assets/images/payment/halopesa.png'),
    active: true,
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    detail: 'Pay when your order arrives',
    icon: 'cash',
    active: true,
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    detail: 'Mobile money',
    logo: require('@/assets/images/payment/mpesa.png'),
    active: false,
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    detail: 'Visa, Mastercard',
    icon: 'credit-card',
    active: false,
  },
];

const DELIVERY_ETA = '25 - 35 min';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption>('airtel_money');
  const [isPlacing, setIsPlacing] = useState(false);

  // USSD payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { items, restaurantId, restaurantName, subtotal, deliveryFee, serviceFee, clearCart } =
    useCartStore();
  const { currentAddress, savedAddresses, reverseGeocodeCurrent, currentLocation } =
    useLocationStore();

  const deliveryAddress = currentAddress || savedAddresses.find((a) => a.isDefault);
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPayment);

  useEffect(() => {
    if (!currentAddress && currentLocation) {
      reverseGeocodeCurrent();
    }
  }, [currentAddress, currentLocation, reverseGeocodeCurrent]);

  const total = subtotal() + deliveryFee + serviceFee;

  const handleSelectPayment = (method: PaymentMethodOption) => {
    if (!method.active) return;
    Haptics.selectionAsync().catch(() => {});
    setSelectedPayment(method.id);
  };

  const buildDeliveryAddress = () =>
    deliveryAddress || {
      id: 'current',
      label: 'Current Location',
      street: currentLocation
        ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
        : 'Chole Road',
      area: 'Masaki',
      city: 'Dar es Salaam',
      isDefault: true,
    };

  const placeOrder = async (paymentMethod: PaymentOption) => {
    const address = buildDeliveryAddress();
    return ordersService.placeOrder({
      restaurantId: restaurantId!,
      items: items,
      paymentMethod: PAYMENT_MAP[paymentMethod],
      deliveryAddress: {
        id: address.id,
        label: address.label,
        street: address.street,
        area: address.area || 'Masaki',
        city: address.city || 'Dar es Salaam',
        isDefault: address.isDefault,
      },
    });
  };

  const placeOrderAndGo = async () => {
    setIsPlacing(true);
    try {
      const order = await placeOrder(selectedPayment);
      clearCart();
      router.replace(`/checkout/track-order?id=${order.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to place order';
      const details = err?.response?.data ? JSON.stringify(err.response.data).substring(0, 200) : '';
      Alert.alert('Order Failed', `${message}${details ? '\n\n' + details : ''}`);
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!restaurantId || items.length === 0) {
      Alert.alert('Cart Empty', 'Add items to your cart before placing an order.');
      return;
    }

    if (selectedPayment === 'cash') {
      placeOrderAndGo();
      return;
    }

    Haptics.selectionAsync().catch(() => {});
    setPaymentAmount(String(total));
    setPhoneNumber(useAuthStore.getState().user?.phone || '');
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    const amount = parseFloat(paymentAmount);
    const phone = phoneNumber.trim().replace(/\s+/g, '');

    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid amount to pay.');
      return;
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      Alert.alert('Invalid Phone Number', 'Enter the mobile money phone number to receive the USSD push.');
      return;
    }

    setIsPlacing(true);
    try {
      const order = await placeOrder(selectedPayment);

      try {
        await paymentService.initiateUSSDPush({
          orderId: order.id,
          amount,
          phoneNumber: phone,
        });
      } catch {
        clearCart();
        setPaymentModalVisible(false);
        router.replace(`/checkout/track-order?id=${order.id}`);
        Alert.alert(
          'Payment Push Failed',
          'Your order was placed. Please complete payment using the USSD prompt on your phone.',
        );
        return;
      }

      clearCart();
      setPaymentModalVisible(false);
      router.replace(`/checkout/track-order?id=${order.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to place order';
      const details = err?.response?.data ? JSON.stringify(err.response.data).substring(0, 200) : '';
      Alert.alert('Order Failed', `${message}${details ? '\n\n' + details : ''}`);
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={Colors.light.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: Colors.light['on-surface'] }]}>Checkout</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-outline" size={72} color={Colors.light['surface-variant']} />
          <Text style={[styles.emptyTitle, { color: Colors.light['on-surface'] }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.light['on-surface-variant'] }]}>
            Add items from a restaurant to get started
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: Colors.light.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeMethods = paymentMethods.filter((m) => m.active);
  const comingSoonMethods = paymentMethods.filter((m) => !m.active);

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={Colors.light.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: Colors.light['on-surface'] }]}>Checkout</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.addressCard}>
          <View style={styles.addressPin}>
            <MaterialCommunityIcons name="map-marker" size={24} color={Colors.light.primary} />
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>DELIVER TO</Text>
            <Text style={[styles.addressText, { color: Colors.light['on-surface'] }]} numberOfLines={2}>
              {deliveryAddress
                ? [deliveryAddress.street, deliveryAddress.area, deliveryAddress.city]
                    .filter(Boolean)
                    .join(', ')
                : currentLocation
                  ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                  : 'Detecting your location...'}
            </Text>
            <View style={styles.etaRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.light.primary} />
              <Text style={[styles.etaText, { color: Colors.light['on-surface-variant'] }]}>
                {DELIVERY_ETA}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/saved-addresses')} hitSlop={8}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {restaurantName && (
          <View style={styles.restaurantRow}>
            <MaterialCommunityIcons name="store-outline" size={16} color={Colors.light.primary} />
            <Text style={[styles.restaurantName, { color: Colors.light['on-surface-variant'] }]} numberOfLines={1}>
              {restaurantName}
            </Text>
          </View>
        )}

        {/* Payment Method */}
        <Text style={[styles.sectionTitle, { color: Colors.light['on-surface'] }]}>Payment Method</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.groupLabel}>Available now</Text>
          {activeMethods.map((method, index) => {
            const isSelected = selectedPayment === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => handleSelectPayment(method)}
                activeOpacity={0.7}
                style={[
                  styles.paymentRow,
                  index < activeMethods.length - 1 && styles.paymentRowBorder,
                  isSelected && styles.paymentRowSelected,
                ]}
              >
                {method.logo ? (
                  <View style={[styles.paymentIcon, styles.paymentIconWhite]}>
                    <Image source={method.logo} style={styles.paymentLogo} resizeMode="contain" />
                  </View>
                ) : (
                  <View style={[styles.paymentIcon, styles.paymentIconGlyph]}>
                    <MaterialCommunityIcons name={method.icon as any} size={22} color={Colors.light.primary} />
                  </View>
                )}
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: Colors.light['on-surface'] }]}>
                    {method.name}
                  </Text>
                  <Text style={[styles.paymentDetail, { color: Colors.light['on-surface-variant'] }]}>
                    {method.detail}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: isSelected ? Colors.light.primary : Colors.light['outline-variant'] },
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.groupDivider} />
          <Text style={styles.groupLabel}>Coming soon</Text>
          {comingSoonMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              disabled
              style={[styles.paymentRow, styles.paymentRowDisabled]}
            >
              {method.logo ? (
                <View style={[styles.paymentIcon, styles.paymentIconWhite]}>
                  <Image source={method.logo} style={styles.paymentLogo} resizeMode="contain" />
                </View>
              ) : (
                <View style={[styles.paymentIcon, styles.paymentIconGlyph]}>
                  <MaterialCommunityIcons name={method.icon as any} size={22} color={Colors.light.primary} />
                </View>
              )}
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentName, { color: Colors.light['on-surface-variant'] }]}>
                  {method.name}
                </Text>
                <Text style={[styles.paymentDetail, { color: Colors.light['on-surface-variant'] }]}>
                  {method.detail}
                </Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Cost Summary */}
        <Text style={[styles.sectionTitle, { color: Colors.light['on-surface'] }]}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.light['on-surface-variant'] }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: Colors.light['on-surface'] }]}>{formatPrice(subtotal())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.light['on-surface-variant'] }]}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: Colors.light['on-surface'] }]}>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.light['on-surface-variant'] }]}>Taxes & Fees</Text>
            <Text style={[styles.summaryValue, { color: Colors.light['on-surface'] }]}>{formatPrice(serviceFee)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: Colors.light['surface-variant'] }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: Colors.light['on-surface'] }]}>Total</Text>
            <Text style={[styles.totalValue, { color: Colors.light.primary }]}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom action */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: Colors.light.surface,
            borderTopColor: Colors.light['surface-variant'],
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.placeOrderBtn, { backgroundColor: isPlacing ? '#0A5C2E' : Colors.light.primary }]}
          onPress={handlePlaceOrder}
          disabled={isPlacing}
          activeOpacity={0.85}
        >
          {isPlacing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <View style={styles.placeOrderLeft}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#ffffff" />
                <Text style={styles.placeOrderText}>Place Order</Text>
              </View>
              <View style={styles.placeOrderDivider} />
              <Text style={styles.placeOrderTotal}>{formatPrice(total)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* USSD Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPaymentModalVisible(false)}
          />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {selectedMethod?.logo ? (
                  <View style={[styles.paymentIcon, styles.paymentIconWhite]}>
                    <Image source={selectedMethod.logo} style={styles.paymentLogo} resizeMode="contain" />
                  </View>
                ) : (
                  <View style={[styles.paymentIcon, styles.paymentIconGlyph]}>
                    <MaterialCommunityIcons
                      name={(selectedMethod?.icon || 'wallet') as any}
                      size={22}
                      color={Colors.light.primary}
                    />
                  </View>
                )}
                <View style={styles.modalTitleInfo}>
                  <Text style={[styles.modalTitle, { color: Colors.light['on-surface'] }]}>
                    Pay with {selectedMethod?.name}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: Colors.light['on-surface-variant'] }]}>
                    You will receive a USSD push to approve payment
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setPaymentModalVisible(false)}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="close" size={22} color={Colors.light['on-surface-variant']} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: Colors.light['on-surface-variant'] }]}>Amount</Text>
              <View style={[styles.inputWrap, { borderColor: Colors.light['outline-variant'] }]}>
                <Text style={[styles.inputPrefix, { color: Colors.light['on-surface-variant'] }]}>TSh</Text>
                <TextInput
                  style={[styles.input, { color: Colors.light['on-surface'] }]}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.light['outline-variant']}
                />
              </View>

              <Text style={[styles.inputLabel, { color: Colors.light['on-surface-variant'] }]}>Mobile Money Number</Text>
              <View style={[styles.inputWrap, { borderColor: Colors.light['outline-variant'] }]}>
                <MaterialCommunityIcons name="cellphone" size={20} color={Colors.light.primary} />
                <TextInput
                  style={[styles.input, { color: Colors.light['on-surface'] }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="e.g. 0977 123 456"
                  placeholderTextColor={Colors.light['outline-variant']}
                />
              </View>

              <View style={[styles.ussdNote, { backgroundColor: GREEN_TINT }]}>
                <MaterialCommunityIcons name="cellphone-arrow-down" size={18} color={Colors.light.primary} />
                <Text style={[styles.ussdNoteText, { color: Colors.light['on-surface-variant'] }]}>
                  A USSD prompt will be sent to your phone. Approve it to complete your payment.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: isPlacing ? '#0A5C2E' : Colors.light.primary }]}
                onPress={handleConfirmPayment}
                disabled={isPlacing}
                activeOpacity={0.85}
              >
                {isPlacing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    Confirm & Pay {formatPrice(parseFloat(paymentAmount) || 0)}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPaymentModalVisible(false)}
                disabled={isPlacing}
              >
                <Text style={[styles.cancelBtnText, { color: Colors.light['on-surface-variant'] }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['container-padding'],
    paddingBottom: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light['surface-variant'],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...Typography.h1, fontWeight: '700' },
  headerSpacer: { width: 40 },
  scrollContent: { padding: Spacing['container-padding'], paddingBottom: 180 },

  // Delivery Address
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light['surface-container-lowest'],
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.light['surface-variant'],
  },
  addressPin: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: GREEN_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: { flex: 1, gap: 3 },
  addressLabel: { ...Typography['label-sm'], color: Colors.light.primary, fontWeight: '700', letterSpacing: 0.8 },
  addressText: { ...Typography['body-md'], fontWeight: '600' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  etaText: { ...Typography['label-sm'] },
  editBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: GREEN_TINT,
  },
  editText: { ...Typography['label-md'], color: Colors.light.primary, fontWeight: '700' },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: 4,
  },
  restaurantName: { ...Typography['body-sm'] },

  // Payment Method
  sectionTitle: { ...Typography.h2, fontWeight: '700', marginTop: Spacing.lg, marginBottom: Spacing.md },
  paymentCard: {
    backgroundColor: Colors.light['surface-container-lowest'],
    borderRadius: 16,
    paddingVertical: Spacing.xs,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.light['surface-variant'],
    overflow: 'hidden',
  },
  groupLabel: {
    ...Typography['label-sm'],
    color: Colors.light['on-surface-variant'],
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  paymentRowSelected: { backgroundColor: GREEN_TINT },
  paymentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light['surface-variant'],
  },
  paymentRowDisabled: { opacity: 0.6 },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconWhite: {
    backgroundColor: Colors.light['surface-container-lowest'],
    borderWidth: 1,
    borderColor: Colors.light['surface-variant'],
  },
  paymentIconGlyph: {
    backgroundColor: GREEN_TINT,
  },
  paymentLogo: { width: 34, height: 34 },
  paymentInfo: { flex: 1, gap: 2 },
  paymentName: { ...Typography['label-md'], fontWeight: '600' },
  paymentDetail: { ...Typography['label-sm'] },
  radio: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: BorderRadius.full, backgroundColor: Colors.light.primary },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light['surface-container-high'],
  },
  soonBadgeText: { ...Typography['label-sm'], color: Colors.light['on-surface-variant'], fontWeight: '600' },
  groupDivider: { height: 1, backgroundColor: Colors.light['surface-variant'], marginVertical: Spacing.xs },

  // Order Summary
  summaryCard: {
    backgroundColor: Colors.light['surface-container-lowest'],
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.light['surface-variant'],
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography['body-md'] },
  summaryValue: { ...Typography['body-md'], fontWeight: '600' },
  summaryDivider: { height: 1 },
  totalLabel: { ...Typography.h2, fontWeight: '700' },
  totalValue: { ...Typography.h2, fontWeight: '800' },

  // Sticky bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    ...Shadows.md,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 58,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  placeOrderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  placeOrderText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  placeOrderDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.35)' },
  placeOrderTotal: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  // USSD Payment Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing['container-padding'],
    paddingTop: Spacing.sm,
    ...Shadows.lg,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.light['surface-container-highest'],
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  modalTitleInfo: { flex: 1, gap: 2 },
  modalTitle: { ...Typography.h2, fontWeight: '700' },
  modalSubtitle: { ...Typography['label-sm'] },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light['surface-container-low'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { gap: Spacing.sm, marginBottom: Spacing.lg },
  inputLabel: { ...Typography['label-sm'], fontWeight: '600', marginTop: Spacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    height: 52,
    backgroundColor: Colors.light['surface-container-lowest'],
  },
  inputPrefix: { ...Typography['label-md'], fontWeight: '700' },
  input: { flex: 1, ...Typography['body-md'], fontWeight: '600' },
  ussdNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 14,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  ussdNoteText: { ...Typography['label-sm'], flex: 1 },
  modalFooter: { gap: Spacing.sm },
  confirmBtn: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...Typography['label-md'], fontWeight: '600' },

  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing['container-padding'] },
  emptyTitle: { ...Typography.h1 },
  emptySubtitle: { ...Typography['body-md'], textAlign: 'center', color: Colors.light['on-surface-variant'] },
  emptyBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { ...Typography['label-md'], color: '#ffffff', fontWeight: '700' },
});
