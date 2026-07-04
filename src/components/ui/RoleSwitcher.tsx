import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { UserRole } from '../../models/user';

interface RoleSwitcherProps {
  currentRole: UserRole | null;
  onRoleChange: (role: UserRole) => void;
}

export default function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const role = currentRole || 'customer';
  
  // Slide shared value (0 = customer, 1 = runner)
  const offset = useSharedValue(role === 'customer' ? 0 : 1);

  React.useEffect(() => {
    offset.value = withSpring(role === 'customer' ? 0 : 1, {
      damping: 15,
      stiffness: 120,
    });
  }, [role]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: offset.value * 140, // width of tab is 140
        },
      ],
      backgroundColor: offset.value === 0 ? '#0c831f' : '#4f46e5',
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
      
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onRoleChange('customer')}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, role === 'customer' && styles.activeLabel]}>
          🛍️ Customer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onRoleChange('runner')}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, role === 'runner' && styles.activeLabel]}>
          ⚡ Runner
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: 280,
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    padding: 4,
    position: 'relative',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    width: 136,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6b7280',
  },
  activeLabel: {
    color: '#ffffff',
  },
});
