import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../models/order';

interface RunnerJobCardProps {
  job: Order;
  onAccept: (orderId: string) => Promise<void>;
}

export default function RunnerJobCard({ job, onAccept }: RunnerJobCardProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const handlePress = async () => {
    setSubmitting(true);
    try {
      await onAccept(job.id);
    } catch (e) {
      console.warn(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.canteenInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={16} color="#4f46e5" />
          </View>
          <View>
            <Text style={styles.canteenName}>{job.canteenName}</Text>
            <Text style={styles.canteenBuilding}>📍 pickup location</Text>
          </View>
        </View>
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsText}>₹{job.deliveryFee}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Items List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ITEMS TO PICK UP</Text>
        {job.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dottedDivider} />

      {/* Delivery Destination */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DELIVER TO</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#ef4444" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>{job.targetNodeName}</Text>
            {job.deliveryLocation && (
              <Text style={styles.locationDetailText}>
                {job.deliveryLocation.buildingName} · Floor {job.deliveryLocation.floorName}
                {job.deliveryLocation.details ? ` (${job.deliveryLocation.details})` : ''}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Accept Button */}
      <TouchableOpacity
        style={[styles.acceptBtn, submitting && styles.disabledBtn]}
        disabled={submitting}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="bicycle" size={16} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept Job & Earn ₹{job.deliveryFee}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canteenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canteenName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  canteenBuilding: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  earningsBadge: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  earningsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4f46e5',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  dottedDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 1,
    marginVertical: 12,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4f46e5',
    width: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  locationDetailText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#9ca3af',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
