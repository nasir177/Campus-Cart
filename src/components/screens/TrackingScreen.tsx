import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface OrderLive {
  id: string;
  status?: string;
  campusLocation?: { latitude: number; longitude: number };
  targetNodeName?: string;
  totalAmount?: number;
}

const STEPS = [
  { id: 1, key: 'placed',           label: 'Order Confirmed',    sub: 'Assigned campus runner',       icon: 'checkmark-circle-outline' },
  { id: 2, key: 'preparing',        label: 'Preparing Items',    sub: 'Packing your order securely',  icon: 'restaurant-outline' },
  { id: 3, key: 'out_for_delivery', label: 'Out for Delivery',   sub: 'Runner heading to your desk',  icon: 'bicycle' },
  { id: 4, key: 'delivered',        label: 'Delivered!',         sub: 'Items at your desk – Enjoy!',  icon: 'gift-outline' },
];

const STATUS_TO_STEP: Record<string, number> = {
  placed: 1, preparing: 2, out_for_delivery: 3, delivered: 4,
};

type Props = {
  orderLive: OrderLive | null;
  latestOrderId: string | null;
  currentCampus: { latitude: number; longitude: number; name: string } | null;
  trackingError: string | null;
  onReturnHome: () => void;
};

export default function TrackingScreen({
  orderLive,
  latestOrderId,
  currentCampus,
  trackingError,
  onReturnHome,
}: Props) {
  const activeStep = STATUS_TO_STEP[orderLive?.status ?? 'placed'] ?? 1;
  const mapCenter = orderLive?.campusLocation ?? {
    latitude: currentCampus?.latitude ?? 28.5439,
    longitude: currentCampus?.longitude ?? 77.2514,
  };

  // Pulse animation for active step dot
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="bicycle" size={44} color="#0c831f" />
        </View>
        <Text style={styles.heroTitle}>Campus Express</Text>
        <View style={styles.etaBadge}>
          <Ionicons name="flash" size={13} color="#0c831f" />
          <Text style={styles.etaText}>Estimated: 10 Minutes</Text>
        </View>
        <Text style={styles.orderId}>Order #{latestOrderId?.slice(0, 10).toUpperCase()}</Text>
      </View>

      {/* Map */}
      <View style={styles.mapCard}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          region={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
        >
          <Marker
            coordinate={mapCenter}
            title="Campus Hub"
            description={currentCampus?.name ?? 'Campus'}
          />
        </MapView>
        <View style={styles.mapFooter}>
          <Ionicons name="location-sharp" size={14} color="#0c831f" />
          <Text style={styles.mapFooterText}>
            {trackingError
              ? trackingError
              : `Status: ${(orderLive?.status ?? 'placed').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`}
          </Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepperCard}>
        <Text style={styles.stepperTitle}>Delivery Progress</Text>
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < activeStep;
          const isActive = step.id === activeStep;
          const isPending = step.id > activeStep;

          return (
            <View key={step.id} style={styles.stepRow}>
              {/* Left: dot + connector */}
              <View style={styles.stepLeft}>
                <Animated.View
                  style={[
                    styles.stepDot,
                    isCompleted && styles.stepDotCompleted,
                    isActive && styles.stepDotActive,
                    isPending && styles.stepDotPending,
                    isActive && { transform: [{ scale: pulse }] },
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : isActive ? (
                    <View style={styles.innerDot} />
                  ) : null}
                </Animated.View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepConnector, isCompleted && styles.stepConnectorDone]} />
                )}
              </View>

              {/* Right: label */}
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isPending && styles.stepLabelPending]}>
                    {step.label}
                  </Text>
                  {isActive && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Delivery Partner */}
      <View style={styles.partnerCard}>
        <View style={styles.partnerAvatar}>
          <Ionicons name="person" size={24} color="#0c831f" />
        </View>
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>Aman Preet Singh</Text>
          <Text style={styles.partnerRole}>Express Delivery Partner</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Calling Partner', 'Connecting to Aman Preet Singh...')}
          style={styles.callBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={18} color="#0c831f" />
        </TouchableOpacity>
      </View>

      {/* Return CTA */}
      <TouchableOpacity onPress={onReturnHome} style={styles.returnBtn} activeOpacity={0.85}>
        <Ionicons name="storefront-outline" size={16} color="#fff" />
        <Text style={styles.returnBtnText}>Return to Shop</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  hero: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  heroIcon: { width: 80, height: 80, backgroundColor: '#f0fdf4', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#bbf7d0' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', marginBottom: 6 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5, marginBottom: 6 },
  etaText: { fontSize: 12, fontWeight: '800', color: '#0c831f' },
  orderId: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },
  mapCard: { margin: 14, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  map: { width: '100%', height: 180 },
  mapFooter: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 6 },
  mapFooterText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  stepperCard: { marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#f0f0f0' },
  stepperTitle: { fontSize: 14, fontWeight: '900', color: '#1a1a1a', marginBottom: 18 },
  stepRow: { flexDirection: 'row', marginBottom: 0 },
  stepLeft: { alignItems: 'center', marginRight: 16, width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  stepDotCompleted: { backgroundColor: '#0c831f', borderColor: '#0c831f' },
  stepDotActive: { backgroundColor: '#0c831f', borderColor: '#0c831f', shadowColor: '#0c831f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  stepDotPending: { backgroundColor: '#fff', borderColor: '#d1d5db' },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  stepConnector: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginVertical: 3, minHeight: 36 },
  stepConnectorDone: { backgroundColor: '#0c831f' },
  stepContent: { flex: 1, paddingBottom: 24 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  stepLabelActive: { fontWeight: '900' },
  stepLabelPending: { color: '#9ca3af', fontWeight: '600' },
  stepSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  nowBadge: { backgroundColor: '#ffd300', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  nowBadgeText: { fontSize: 9, fontWeight: '900', color: '#92400e' },
  partnerCard: { marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#f0f0f0' },
  partnerAvatar: { width: 48, height: 48, backgroundColor: '#f0fdf4', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  partnerRole: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  callBtn: { width: 44, height: 44, backgroundColor: '#f0fdf4', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  returnBtn: { marginHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c831f', borderRadius: 18, paddingVertical: 16, gap: 8, shadowColor: '#0c831f', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  returnBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
