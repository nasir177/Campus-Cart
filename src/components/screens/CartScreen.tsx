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
import { LocationPicker } from '../LocationPicker';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';

type Props = {
  showLocationPicker: boolean;
  submitting: boolean;
  onToggleLocationPicker: () => void;
  onPlaceOrder: () => void;
  onGoShopping: () => void;
};

export default function CartScreen({
  showLocationPicker,
  submitting,
  onToggleLocationPicker,
  onPlaceOrder,
  onGoShopping,
}: Props) {
  const { currentCampus } = useAppStore();
  const {
    items: cart,
    addItem,
    removeItem,
    targetNodeId,
    targetNodeName,
    setTargetNode,
  } = useCartStore();

  const getSubtotal = () => cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const subtotal = getSubtotal();
  const platformFee = cart.length > 0 ? 3 : 0;
  const deliveryFee = cart.length > 0 ? 15 : 0;
  const totalAmount = subtotal + platformFee + deliveryFee;

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="cart-outline" size={52} color="#9ca3af" />
        </View>
        <Text style={styles.emptyTitle}>Your basket is empty</Text>
        <Text style={styles.emptySub}>
          Add delicious snacks, beverages, or custom print jobs to complete your order.
        </Text>
        <TouchableOpacity onPress={onGoShopping} style={styles.shopBtn} activeOpacity={0.85}>
          <Ionicons name="storefront-outline" size={16} color="#fff" />
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Cart Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Review Basket</Text>
        {cart.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={styles.divider} />}
            <View style={styles.itemRow}>
              {/* Icon */}
              <View style={styles.itemIconWrap}>
                <Ionicons
                  name={item.category === 'Services' ? 'print' : 'fast-food'}
                  size={18}
                  color={item.category === 'Services' ? '#b45309' : '#0c831f'}
                />
              </View>

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.weightOrQty}</Text>
              </View>

              {/* Price + Stepper */}
              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.stepBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => addItem(item)} style={styles.stepBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery Location */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <View>
            <Text style={styles.cardTitle}>Delivery Location</Text>
            <Text style={styles.locationSub}>Specify exactly where to deliver</Text>
          </View>
          <TouchableOpacity onPress={onToggleLocationPicker} style={styles.changeBtn} activeOpacity={0.8}>
            <Ionicons name="location-outline" size={13} color="#0c831f" />
            <Text style={styles.changeBtnText}>{showLocationPicker ? 'Minimize' : 'Change'}</Text>
          </TouchableOpacity>
        </View>

        {targetNodeName ? (
          <View style={styles.selectedLocation}>
            <Ionicons name="location-sharp" size={16} color="#0c831f" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.selectedLocationName}>{targetNodeName}</Text>
              {currentCampus && <Text style={styles.selectedLocationSub}>{currentCampus.name}</Text>}
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#0c831f" />
          </View>
        ) : (
          <View style={styles.noLocation}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.noLocationText}>Location required – select building & room below</Text>
          </View>
        )}

        {(showLocationPicker || !targetNodeId) && (
          <LocationPicker
            onSelectNode={(nodeId, nodeName) => {
              setTargetNode(nodeId, nodeName);
              if (showLocationPicker) {
                onToggleLocationPicker();
              }
            }}
          />
        )}
      </View>

      {/* Bill Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bill Summary</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item subtotal</Text>
          <Text style={styles.billValue}>₹{subtotal.toFixed(0)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Platform fee</Text>
          <Text style={styles.billValue}>₹{platformFee.toFixed(0)}</Text>
        </View>
        <View style={styles.billRow}>
          <View style={styles.deliveryRow}>
            <Text style={styles.billLabel}>Delivery charge</Text>
            <View style={styles.fastBadge}>
              <Ionicons name="flash" size={10} color="#0c831f" />
              <Text style={styles.fastBadgeText}>10 Min</Text>
            </View>
          </View>
          <Text style={styles.billValue}>₹{deliveryFee.toFixed(0)}</Text>
        </View>
        <View style={styles.billDivider} />
        <View style={styles.billRow}>
          <Text style={styles.billTotal}>Grand Total</Text>
          <Text style={styles.billTotalAmount}>₹{totalAmount.toFixed(0)}</Text>
        </View>
      </View>

      {/* Place Order */}
      <TouchableOpacity
        disabled={submitting}
        onPress={onPlaceOrder}
        style={[styles.placeOrderBtn, submitting && styles.placeOrderBtnDisabled]}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.placeOrderBtnText}>Proceed to Pay · ₹{totalAmount.toFixed(0)}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f5f5f5' },
  emptyIconWrap: { width: 96, height: 96, backgroundColor: '#fff', borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, gap: 8 },
  shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemIconWrap: { width: 40, height: 40, backgroundColor: '#f9fafb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 12, fontWeight: '700', color: '#1a1a1a', lineHeight: 16 },
  itemQty: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  itemPrice: { fontSize: 13, fontWeight: '900', color: '#1a1a1a' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: 10, paddingHorizontal: 4, paddingVertical: 4 },
  stepBtn: { paddingHorizontal: 6 },
  stepBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', lineHeight: 16 },
  stepCount: { color: '#fff', fontSize: 12, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  locationSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  changeBtnText: { color: '#0c831f', fontSize: 11, fontWeight: '700' },
  selectedLocation: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  selectedLocationName: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  selectedLocationSub: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  noLocation: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#fecaca', gap: 8 },
  noLocationText: { flex: 1, fontSize: 12, color: '#ef4444', fontWeight: '500' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  billLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  billValue: { fontSize: 12, fontWeight: '600', color: '#1a1a1a' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fastBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, gap: 2 },
  fastBadgeText: { fontSize: 9, fontWeight: '800', color: '#0c831f' },
  billDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  billTotal: { fontSize: 14, fontWeight: '900', color: '#1a1a1a' },
  billTotalAmount: { fontSize: 18, fontWeight: '900', color: '#0c831f' },
  placeOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c831f', borderRadius: 18, paddingVertical: 17, gap: 8, shadowColor: '#0c831f', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 7 },
  placeOrderBtnDisabled: { backgroundColor: '#9ca3af' },
  placeOrderBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
