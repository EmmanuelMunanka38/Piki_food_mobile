export function formatPrice(amount: number): string {
  return `TSh ${amount.toLocaleString('en-TZ')}`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mpesa: 'M-Pesa',
  tigo_pesa: 'Tigo Pesa',
  airtel_money: 'Airtel Money',
  mixx_by_yas: 'Mixx by Yas',
  halopesa: 'HaloPesa',
  card: 'Credit / Debit Card',
  cash: 'Cash on Delivery',
};

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    restaurant_accepted: 'Restaurant Accepted',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup',
    driver_assigned: 'Driver Assigned',
    picked_up: 'Picked Up',
    on_the_way: 'On the Way',
    arrived: 'Arrived',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status.replace(/_/g, ' ');
}
