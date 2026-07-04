import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

type Props = {
  targetNodeName: string | null;
  campusName: string | null;
  searchText: string;
  onSearchChange: (text: string) => void;
  onLocationPress: () => void;
  onProfilePress: () => void;
};

export default function Header({
  targetNodeName,
  campusName,
  searchText,
  onSearchChange,
  onLocationPress,
  onProfilePress,
}: Props) {
  const { userRole, userProfile } = useAppStore();
  const isRunner = userRole === 'runner';

  // Dynamic values based on role
  const headerBgColor = isRunner ? '#4f46e5' : '#ffd300';
  const labelColor = isRunner ? '#c7d2fe' : '#4a4a4a';
  const textColor = isRunner ? '#ffffff' : '#1a1a1a';
  const iconColor = isRunner ? '#c7d2fe' : '#0c831f';
  const statusBarStyle = isRunner ? 'light-content' : ('dark-content' as const);

  return (
    <View style={[styles.container, { backgroundColor: headerBgColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={headerBgColor} />
      
      {/* Top row: location + profile */}
      <View style={styles.topRow}>
        {isRunner ? (
          <View style={styles.runnerHeaderTitle}>
            <View style={styles.runnerIconWrap}>
              <Ionicons name="bicycle" size={16} color="#ffffff" />
            </View>
            <View>
              <Text style={[styles.deliveryLabel, { color: labelColor }]}>Hamdard Campus Delivery</Text>
              <Text style={[styles.locationName, { color: textColor }]}>
                Runner Mode · {userProfile.displayName}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onLocationPress}
            style={styles.locationButton}
            activeOpacity={0.8}
          >
            <View style={styles.locationIconWrap}>
              <Ionicons name="location-sharp" size={16} color={iconColor} />
            </View>
            <View style={styles.locationText}>
              <Text style={[styles.deliveryLabel, { color: labelColor }]}>Delivering in 10 Mins</Text>
              <View style={styles.locationRow}>
                <Text style={[styles.locationName, { color: textColor }]} numberOfLines={1}>
                  {targetNodeName
                    ? `${targetNodeName}${campusName ? ', ' + campusName : ''}`
                    : 'Select Delivery Spot'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={textColor} style={{ marginLeft: 2 }} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={onProfilePress}
          style={[styles.profileBadge, isRunner && styles.profileBadgeRunner]}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle" size={28} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Dynamic Action Bar (Search bar for Customer, status chip for Runner) */}
      {!isRunner ? (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            placeholder="Search snacks, printouts, stationery..."
            value={searchText}
            onChangeText={onSearchChange}
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.runnerIndicatorRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.runnerIndicatorText}>
            Listening for active orders in Jamia Hamdard
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  runnerHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  runnerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  profileBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileBadgeRunner: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 0,
  },
  runnerIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  runnerIndicatorText: {
    fontSize: 10,
    color: '#e0e7ff',
    fontWeight: '700',
  },
});
