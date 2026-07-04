import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../hooks/useOrders';
import { useCartStore } from '../../store/useCartStore';

type Props = {
  onGoShopping: () => void;
};

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  delivered:        { bg: '#f0fdf4', border: '#bbf7d0', text: 'Delivered',        color: '#15803d', icon: 'checkmark-circle' },
  out_for_delivery: { bg: '#eff6ff', border: '#bfdbfe', text: 'Out for Delivery',  color: '#1d4ed8', icon: 'bicycle' },
  preparing:        { bg: '#fefce8', border: '#fde68a', text: 'Preparing',         color: '#b45309', icon: 'flame' },
  placed:           { bg: '#f9fafb', border: '#e5e7eb', text: 'Order Placed',      color: '#6b7280', icon: 'time' },
  offline_pending:  { bg: '#fff7ed', border: '#fed7aa', text: 'Offline (Queued)',  color: '#c2410c', icon: 'cloud-offline' },
};

function formatDate(createdAt: any): string {
  if (!createdAt) return 'Just now';
  const ms =
    typeof createdAt === 'object' && 'seconds' in createdAt
      ? createdAt.seconds * 1000
      : typeof createdAt === 'number'
      ? createdAt
      : Date.now();
  return new Date(ms).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersScreen({ onGoShopping }: Props) {
  const { useOrdersQuery } = useOrders();
  const { data: onlineOrders, isLoading } = useOrdersQuery();
  const { pendingOrders } = useCartStore();

  const allOrders = [
    ...pendingOrders.map((o) => ({ ...o, status: 'offline_pending' as const })),
    ...(onlineOrders || []),
  ];

  if (isLoading && allOrders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0c831f" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (allOrders.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
        </View>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySub}>
          Place your first 10-minute delivery order and it'll show up here.
        </Text>
        <TouchableOpacity onPress={onGoShopping} style={styles.shopBtn} activeOpacity={0.85}>
          <Ionicons name="storefront-outline" size={15} color="#fff" />
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Your Orders</Text>
        <Text style={styles.pageSubtitle}>{allOrders.length} order{allOrders.length !== 1 ? 's' : ''} total</Text>
      </View>

      {allOrders.map((order) => {
        const status = order.status ?? 'placed';
        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.placed;
        const orderId = order.isOffline
          ? 'OFFLINE'
          : `#${String(order.id).slice(0, 8).toUpperCase()}`;

        return (
          <View key={order.id} style={[styles.card, order.isOffline && styles.offlineCard]}>

            {/* ── Top Row: ID + Status Badge ── */}
            <View style={styles.cardTopRow}>
              <View style={styles.orderIdWrap}>
                <Text style={styles.orderId}>{orderId}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.text}</Text>
              </View>
            </View>

            {/* ── Canteen / Shop Name ── */}
            {order.canteenName && (
              <View style={styles.canteenRow}>
                <Ionicons name="storefront-outline" size={12} color="#6b7280" />
                <Text style={styles.canteenName} numberOfLines={1}>{order.canteenName}</Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* ── Items List ── */}
            <View style={styles.itemsSection}>
              {(order.items || []).map((item: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemQtyBadge}>
                    <Text style={styles.itemQtyText}>{item.quantity ?? 1}×</Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{((item.price ?? 0) * (item.quantity ?? 1)).toFixed(0)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* ── Footer: Location + Total ── */}
            <View style={styles.cardFooter}>
              <View style={styles.deliveryInfo}>
                <Ionicons name="location-sharp" size={12} color="#9ca3af" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {order.targetNodeName ?? 'Campus Desk'}
                </Text>
              </View>
              <View style={styles.totalWrap}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{Number(order.totalAmount ?? 0).toFixed(0)}</Text>
              </View>
            </View>

          </View>
        );
      })}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f5f7' },
  content: { padding: 16 },

  // ─── Center States ────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f4f5f7',
  },
  loadingText: { color: '#9ca3af', fontWeight: '600', marginTop: 14, fontSize: 13 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
  emptySub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 260,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0c831f',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ─── Page Header ──────────────────────────────────────────────
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  pageSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontWeight: '500' },

  // ─── Order Card ───────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ebebeb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offlineCard: { borderColor: '#fcd34d', borderWidth: 1.5 },

  // ─── Card Top Row ─────────────────────────────────────────────
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderIdWrap: { flex: 1, marginRight: 10 },
  orderId: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 3, fontWeight: '500' },

  // ─── Status Badge ─────────────────────────────────────────────
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '800' },

  // ─── Canteen Row ──────────────────────────────────────────────
  canteenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  canteenName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    flex: 1,
  },

  // ─── Divider ──────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },

  // ─── Items ────────────────────────────────────────────────────
  itemsSection: { gap: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemQtyBadge: {
    minWidth: 28,
    height: 22,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  itemQtyText: { fontSize: 11, fontWeight: '900', color: '#374151' },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },

  // ─── Card Footer ──────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  totalWrap: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 1 },
  totalAmount: { fontSize: 18, fontWeight: '900', color: '#0c831f' },
});
