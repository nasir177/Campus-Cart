import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

export type Tab = 'home' | 'xerox' | 'cart' | 'orders' | 'profile' | 'runner_dashboard';

type Props = {
  activeTab: Tab;
  cartCount: number;
  totalAmount: number;
  onChangeTab: (tab: Tab) => void;
};

interface TabConfig {
  id: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const CUSTOMER_TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'xerox', label: 'Xerox', icon: 'print-outline', activeIcon: 'print' },
  { id: 'cart', label: 'Cart', icon: 'cart-outline', activeIcon: 'cart' },
  { id: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt' },
];

const RUNNER_TABS: TabConfig[] = [
  { id: 'runner_dashboard', label: 'Dashboard', icon: 'speedometer-outline', activeIcon: 'speedometer' },
];

export default function BottomBar({ activeTab, cartCount, totalAmount, onChangeTab }: Props) {
  const { userRole } = useAppStore();
  const tabs = userRole === 'runner' ? RUNNER_TABS : CUSTOMER_TABS;
  const isRunner = userRole === 'runner';

  // Highlight color based on role
  const tintColor = isRunner ? '#4f46e5' : '#0c831f';
  const bgHighlightColor = isRunner ? '#4f46e512' : '#0c831f12';

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCart = tab.id === 'cart';
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChangeTab(tab.id)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && { backgroundColor: bgHighlightColor }]}>
              {isCart && cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: tintColor }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? tintColor : '#9ca3af'}
              />
            </View>
            <Text style={[styles.label, isActive && { color: tintColor, fontWeight: '800' }]}>
              {isCart && cartCount > 0 ? `₹${Math.round(totalAmount)}` : tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
