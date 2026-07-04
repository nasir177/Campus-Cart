import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: string;
  weightOrQty?: string;
  description?: string;
}

interface CartItem extends Product {
  quantity: number;
}

type Props = {
  product: Product;
  cartItem?: CartItem;
  onAdd: () => void;
  onRemove: () => void;
};

const CATEGORY_ICONS: Record<string, { name: string; lib: 'ionicons' | 'mci'; color: string; bg: string }> = {
  snacks:     { name: 'fast-food',          lib: 'ionicons', color: '#f97316', bg: '#fff7ed' },
  drinks:     { name: 'cup',                lib: 'mci',      color: '#3b82f6', bg: '#eff6ff' },
  stationery: { name: 'pencil',             lib: 'ionicons', color: '#8b5cf6', bg: '#f5f3ff' },
  meal:       { name: 'restaurant',         lib: 'ionicons', color: '#0c831f', bg: '#f0fdf4' },
  default:    { name: 'cube-outline',       lib: 'ionicons', color: '#6b7280', bg: '#f9fafb' },
};

function ProductIcon({ category }: { category: string }) {
  const cfg = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.default;
  return (
    <View style={[styles.iconContainerFallback, { backgroundColor: cfg.bg }]}>
      {cfg.lib === 'ionicons' ? (
        <Ionicons name={cfg.name as any} size={32} color={cfg.color} />
      ) : (
        <MaterialCommunityIcons name={cfg.name as any} size={32} color={cfg.color} />
      )}
    </View>
  );
}

export default function ProductCard({ product, cartItem, onAdd, onRemove }: Props) {
  const hasDiscount =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <View style={styles.card}>
      {hasDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPct}% OFF</Text>
        </View>
      )}

      {product.image ? (
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <ProductIcon category={product.category} />
      )}

      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productQty}>{product.weightOrQty}</Text>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.price}>₹{product.price}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
          )}
        </View>

        {cartItem ? (
          <View style={styles.stepper}>
            <TouchableOpacity onPress={onRemove} style={styles.stepBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepCount}>{cartItem.quantity}</Text>
            <TouchableOpacity onPress={onAdd} style={styles.stepBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={onAdd} style={styles.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={14} color="#0c831f" />
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0c831f',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  productImage: {
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  iconContainerFallback: {
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 3,
  },
  productQty: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  originalPrice: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0c831f',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  addBtnText: {
    color: '#0c831f',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c831f',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 68,
    justifyContent: 'space-between',
  },
  stepBtn: {
    paddingHorizontal: 4,
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  stepCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
