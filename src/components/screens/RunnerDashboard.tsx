import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRunnerStore } from '../../store/useRunnerStore';
import { useAppStore } from '../../store/useAppStore';
import { useRunnerJobs } from '../../hooks/useRunnerJobs';
import { useGeofence } from '../../hooks/useGeofence';
import RunnerJobCard from '../ui/RunnerJobCard';

export default function RunnerDashboard() {
  // Call geofence tracking hook (auto runs when runner isActive is true)
  useGeofence();

  const { isActive, toggleActive, nearbyJobs, activeJob, setActiveJob } = useRunnerStore();
  const { userProfile, setUserProfile } = useAppStore();
  const { useAcceptJobMutation, useUpdateJobStatusMutation } = useRunnerJobs();

  const acceptJobMutation = useAcceptJobMutation();
  const updateJobStatusMutation = useUpdateJobStatusMutation();

  const handleToggleActive = () => {
    toggleActive();
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(console.warn);
  };

  const handleUpdateStatus = async (status: 'preparing' | 'out_for_delivery' | 'delivered') => {
    if (!activeJob) return;

    try {
      await updateJobStatusMutation.mutateAsync({
        orderId: activeJob.id,
        status,
      });

      // If delivered, credit earnings & clear active order
      if (status === 'delivered') {
        const fee = activeJob.deliveryFee || 15;
        setUserProfile({
          totalJobsDone: (userProfile.totalJobsDone || 0) + 1,
          totalEarnings: (userProfile.totalEarnings || 0) + fee,
        });
        setActiveJob(null);
      }
    } catch (e) {
      console.warn('Status update failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Status Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <View style={[styles.pulseDot, isActive ? styles.pulseDotActive : styles.pulseDotInactive]} />
          <View>
            <Text style={styles.bannerTitle}>Runner Service Status</Text>
            <Text style={styles.bannerSub}>
              {isActive ? 'Online · Receiving campus jobs' : 'Offline · Go active to receive orders'}
            </Text>
          </View>
        </View>
        <Switch
          value={isActive}
          onValueChange={handleToggleActive}
          trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
          thumbColor={isActive ? '#4f46e5' : '#f3f4f6'}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Accepted Delivery Tracker */}
        {activeJob ? (
          <View style={styles.activeJobContainer}>
            <View style={styles.activeJobHeader}>
              <Ionicons name="flash" size={16} color="#4f46e5" />
              <Text style={styles.activeJobTitle}>CURRENT ACTIVE DELIVERY</Text>
              <View style={styles.activeStatusBadge}>
                <Text style={styles.activeStatusText}>
                  {activeJob.status === 'preparing'
                    ? '🎒 Preparing'
                    : activeJob.status === 'out_for_delivery'
                    ? '🚴 Out for Delivery'
                    : 'Delivered'}
                </Text>
              </View>
            </View>

            <View style={styles.activeJobCard}>
              <Text style={styles.canteenTitle}>{activeJob.canteenName}</Text>
              <Text style={styles.pickupInstruction}>📍 Pickup items from canteen</Text>
              
              <View style={styles.itemsList}>
                {activeJob.items?.map((item, idx) => (
                  <View key={idx} style={styles.activeItemRow}>
                    <Text style={styles.activeItemQty}>{item.quantity}x</Text>
                    <Text style={styles.activeItemName}>{item.name}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={styles.customerHeader}>DELIVER TO CUSTOMER</Text>
              <Text style={styles.customerName}>{activeJob.customerName}</Text>
              <Text style={styles.customerLocation}>{activeJob.targetNodeName}</Text>
              {activeJob.deliveryLocation && (
                <Text style={styles.customerLocationSub}>
                  {activeJob.deliveryLocation.buildingName} · Floor {activeJob.deliveryLocation.floorName}
                  {activeJob.deliveryLocation.details ? ` (${activeJob.deliveryLocation.details})` : ''}
                </Text>
              )}

              {/* Call Customer Button */}
              <TouchableOpacity
                onPress={() => handleCall(activeJob.customerPhone)}
                style={styles.callBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="#4f46e5" />
                <Text style={styles.callBtnText}>Call Customer ({activeJob.customerPhone})</Text>
              </TouchableOpacity>

              {/* Progress Actions */}
              <View style={styles.actionBlock}>
                {activeJob.status === 'preparing' && (
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus('out_for_delivery')}
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="bicycle" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Mark Picked Up & Out for Delivery</Text>
                  </TouchableOpacity>
                )}

                {activeJob.status === 'out_for_delivery' && (
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus('delivered')}
                    style={[styles.actionBtn, styles.deliveredBtn]}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Mark Delivered & Earn ₹{activeJob.deliveryFee}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : isActive ? (
          // Available Jobs Feed
          <View style={styles.feedContainer}>
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Available Delivery Jobs ({nearbyJobs.length})</Text>
              <Text style={styles.feedSubtitle}>Based on proximity and campus canteens</Text>
            </View>

            {nearbyJobs.length === 0 ? (
              <View style={styles.emptyFeed}>
                <View style={styles.radarCircle}>
                  <Ionicons name="navigate" size={32} color="#4f46e5" />
                </View>
                <Text style={styles.emptyTitle}>Scanning Jamia Hamdard...</Text>
                <Text style={styles.emptySubtitleText}>
                  Waiting for customers to place new food orders. You will be alerted when a job is available!
                </Text>
              </View>
            ) : (
              nearbyJobs.map((job) => (
                <RunnerJobCard
                  key={job.id}
                  job={job}
                  onAccept={async (orderId) => {
                    await acceptJobMutation.mutateAsync(orderId);
                  }}
                />
              ))
            )}
          </View>
        ) : (
          // Inactive Dashboard State
          <View style={styles.inactiveState}>
            <View style={styles.inactiveIconWrap}>
              <Ionicons name="bicycle-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.inactiveTitle}>You are currently offline</Text>
            <Text style={styles.inactiveSub}>
              Toggle the status button at the top to go active. You will start receiving local delivery jobs and geofence notifications near canteens.
            </Text>
            <TouchableOpacity onPress={handleToggleActive} style={styles.goActiveBtn} activeOpacity={0.85}>
              <Text style={styles.goActiveText}>Go Active Now</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDotActive: {
    backgroundColor: '#10b981',
  },
  pulseDotInactive: {
    backgroundColor: '#9ca3af',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  bannerSub: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inactiveState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 60,
  },
  inactiveIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inactiveTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  inactiveSub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  goActiveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 13,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  goActiveText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  feedContainer: {
    gap: 10,
  },
  feedHeader: {
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  feedSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginTop: 10,
  },
  radarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 6,
  },
  emptySubtitleText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  activeJobContainer: {
    gap: 10,
  },
  activeJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeJobTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4f46e5',
    letterSpacing: 0.5,
  },
  activeStatusBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4f46e5',
  },
  activeJobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  canteenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  pickupInstruction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 2,
  },
  itemsList: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  activeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeItemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4f46e5',
  },
  activeItemName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 14,
  },
  customerHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  customerLocation: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 2,
  },
  customerLocationSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    marginTop: 14,
  },
  callBtnText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBlock: {
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  deliveredBtn: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
});
