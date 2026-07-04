import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  itemCount: number;
  totalAmount: number;
  onPress: () => void;
};

export default function CartFloatingBar({ itemCount, totalAmount, onPress }: Props) {
  const translateY = useRef(new Animated.Value(100)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (itemCount > 0) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }, { scale }] },
      ]}
    >
      <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.9}>
        <View style={styles.left}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{itemCount}</Text>
          </View>
          <View>
            <Text style={styles.itemsLabel}>{itemCount} item{itemCount > 1 ? 's' : ''} added</Text>
            <Text style={styles.feeLabel}>Incl. platform & delivery fees</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>₹{Math.round(totalAmount)}</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 72,
    left: 12,
    right: 12,
    zIndex: 30,
    shadowColor: '#0c831f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  button: {
    backgroundColor: '#0c831f',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  itemsLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  feeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  amount: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
