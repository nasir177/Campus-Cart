import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import RoleSwitcher from '../ui/RoleSwitcher';
import { UserRole } from '../../models/user';

interface ProfileScreenProps {
  onSwitchTab: (tab: any) => void;
}

export default function ProfileScreen({ onSwitchTab }: ProfileScreenProps) {
  const { userProfile, setUserProfile, userRole, setUserRole } = useAppStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [hostelBlock, setHostelBlock] = useState(userProfile.hostelBlock);
  const [upiId, setUpiId] = useState(userProfile.upiId);
  const [phone, setPhone] = useState(userProfile.phone);

  const handleSave = () => {
    setUserProfile({
      displayName,
      hostelBlock,
      upiId,
      phone,
    });
    setIsEditing(false);
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    if (role === 'runner') {
      onSwitchTab('runner_dashboard');
    } else {
      onSwitchTab('home');
    }
  };

  const activeColor = userRole === 'runner' ? '#4f46e5' : '#0c831f';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Role Toggle Header */}
        <View style={styles.switcherContainer}>
          <Text style={styles.switcherLabel}>Active Persona</Text>
          <RoleSwitcher currentRole={userRole} onRoleChange={handleRoleChange} />
        </View>

        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarWrap, { backgroundColor: activeColor + '15' }]}>
              <Ionicons name="person" size={36} color={activeColor} />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{userProfile.displayName}</Text>
                {userProfile.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#0c831f" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userSub}>{userProfile.collegeId}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Form Fields */}
          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Hostel / Department</Text>
                <TextInput
                  style={styles.textInput}
                  value={hostelBlock}
                  onChangeText={setHostelBlock}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>UPI ID for Payments</Text>
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={[styles.btn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.btn, styles.saveBtn, { backgroundColor: activeColor }]}
                >
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={16} color="#6b7280" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Contact Phone</Text>
                  <Text style={styles.detailValue}>{userProfile.phone}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={16} color="#6b7280" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Hostel / Location</Text>
                  <Text style={styles.detailValue}>{userProfile.hostelBlock}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={16} color="#6b7280" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>UPI Virtual ID</Text>
                  <Text style={styles.detailValue}>{userProfile.upiId}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={[styles.editBtn, { borderColor: activeColor }]}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={15} color={activeColor} />
                <Text style={[styles.editBtnText, { color: activeColor }]}>Edit Profile Info</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Runner Earnings Statistics Section */}
        {userRole === 'runner' && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>⚡ Runner Dashboard Performance</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userProfile.totalJobsDone ?? 0}</Text>
                <Text style={styles.statLabel}>Deliveries Done</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#4f46e5' }]}>
                  ₹{userProfile.totalEarnings ?? 0}
                </Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
            </View>

            <View style={styles.statsHelpAlert}>
              <Ionicons name="information-circle" size={16} color="#4f46e5" />
              <Text style={styles.statsHelpText}>
                Your earnings are transferred directly to your registered UPI ID after each successful campus delivery.
              </Text>
            </View>
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  switcherContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  switcherLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0c831f',
  },
  userSub: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    marginTop: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  form: {
    gap: 14,
  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4b5563',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4b5563',
  },
  saveBtn: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 4,
  },
  statsHelpAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#e0e7ff30',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: '#c7d2fe80',
  },
  statsHelpText: {
    flex: 1,
    fontSize: 10,
    color: '#4f46e5',
    fontWeight: '600',
    lineHeight: 14,
  },
});
