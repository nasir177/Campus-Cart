import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ProductCard from '../ui/ProductCard';
import { useSearchFilter } from '../../hooks/useSearchFilter';

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

interface Canteen {
  id: string;
  name: string;
  building: string;
  description: string;
  menu: Product[];
}

interface XeroxShop {
  id: string;
  name: string;
  building: string;
}

interface CartItem extends Product {
  quantity: number;
}

type Category = 'All' | 'Lunch' | 'Snacks' | 'Namkeen' | 'Beverages' | 'Services';

const CATEGORIES: { id: Category; label: string; icon: string; lib: 'ionicons' | 'mci' }[] = [
  { id: 'All',        label: 'All',        icon: 'grid',            lib: 'ionicons' },
  { id: 'Lunch',      label: 'Lunch',      icon: 'restaurant',      lib: 'ionicons' },
  { id: 'Snacks',     label: 'Munchies',   icon: 'fast-food',       lib: 'ionicons' },
  { id: 'Namkeen',    label: 'Namkeen',    icon: 'leaf-outline',    lib: 'ionicons' },
  { id: 'Beverages',  label: 'Beverages',  icon: 'cup',             lib: 'mci' },
  { id: 'Services',   label: 'Xerox',      icon: 'print',           lib: 'ionicons' },
];

type Props = {
  campusData: { canteens: Canteen[]; xeroxShops: XeroxShop[] } | null;
  cart: { id: string; quantity: number; category?: string }[];
  searchText: string;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onXeroxPress: () => void;
  selectedCanteenId: string | null;
  onSelectCanteen: (id: string) => void;
};

export default function HomeScreen({
  campusData,
  cart,
  searchText,
  onAddToCart,
  onRemoveFromCart,
  onXeroxPress,
  selectedCanteenId,
  onSelectCanteen,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  // Perform multi-attribute cross-canteen search query
  const searchResults = useSearchFilter(
    searchText,
    selectedCategory,
    0 // maxPrice slider (0 = disabled)
  );

  const selectedCanteen = campusData?.canteens.find((c) => c.id === selectedCanteenId) ?? null;
  const isSearching = searchText.trim().length > 0 || selectedCategory !== 'All';

  // If searching/filtering, show search results; otherwise, show selected canteen menu
  const displayProducts = isSearching
    ? searchResults
    : (selectedCanteen?.menu || []);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Canteen Selector (only show if not typing a search query to keep UI clean) */}
      {!isSearching && campusData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Campus Canteen</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {campusData.canteens.map((c) => {
              const active = c.id === selectedCanteenId;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => onSelectCanteen(c.id)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                  <Text style={[styles.chipSub, active && styles.chipSubActive]}>{c.building}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Xerox Promo Banner */}
      <TouchableOpacity onPress={onXeroxPress} style={styles.xeroxBanner} activeOpacity={0.9}>
        <View style={styles.xeroxBannerLeft}>
          <View style={styles.hotTag}>
            <Text style={styles.hotTagText}>HOT SERVICE</Text>
          </View>
          <Text style={styles.xeroxTitle}>Print Assignments & Resumes</Text>
          <Text style={styles.xeroxSub}>Delivered to your desk · from ₹2/page</Text>
        </View>
        <View style={styles.xeroxIcon}>
          <Ionicons name="print" size={28} color="#b45309" />
        </View>
      </TouchableOpacity>

      {/* Category Filter */}
      <Text style={styles.sectionTitle}>Explore Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.catChip, active && styles.catChipActive]}
              activeOpacity={0.8}
            >
              {cat.lib === 'ionicons' ? (
                <Ionicons name={cat.icon as any} size={14} color={active ? '#fff' : '#6b7280'} />
              ) : (
                <MaterialCommunityIcons name={cat.icon as any} size={14} color={active ? '#fff' : '#6b7280'} />
              )}
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Products Header */}
      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>
          {isSearching ? `Search Results (${displayProducts.length})` : `${selectedCanteen?.name || 'Featured'} Menu`}
        </Text>
        <View style={styles.deliveryBadge}>
          <Ionicons name="flash" size={12} color="#0c831f" />
          <Text style={styles.deliveryBadgeText}>10 Min</Text>
        </View>
      </View>

      {/* Product Grid */}
      <View style={styles.grid}>
        {displayProducts.length === 0 ? (
          <View style={styles.emptySearch}>
            <Ionicons name="search" size={40} color="#d1d5db" />
            <Text style={styles.emptySearchText}>No products found matching your search</Text>
          </View>
        ) : (
          displayProducts.map((product) => {
            const cartItem = cart.find((i) => i.id === product.id) as CartItem | undefined;
            return (
              <ProductCard
                key={product.id}
                product={product}
                cartItem={cartItem}
                onAdd={() => onAddToCart(product)}
                onRemove={() => onRemoveFromCart(product.id)}
              />
            );
          })
        )}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 14 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#0c831f', borderColor: '#0c831f' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: '#fff' },
  chipSub: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  chipSubActive: { color: 'rgba(255,255,255,0.75)' },
  xeroxBanner: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  xeroxBannerLeft: { flex: 1, paddingRight: 12 },
  hotTag: {
    backgroundColor: '#ffd300',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  hotTagText: { fontSize: 9, fontWeight: '900', color: '#92400e', letterSpacing: 0.5 },
  xeroxTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginBottom: 3 },
  xeroxSub: { fontSize: 11, color: '#6b7280' },
  xeroxIcon: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 5,
  },
  catChipActive: { backgroundColor: '#0c831f', borderColor: '#0c831f' },
  catChipText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  catChipTextActive: { color: '#fff' },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  deliveryBadgeText: { fontSize: 11, fontWeight: '800', color: '#0c831f' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptySearch: { flex: 1, alignItems: 'center', paddingVertical: 40 },
  emptySearchText: { color: '#9ca3af', fontWeight: '600', marginTop: 10, fontSize: 13, textAlign: 'center' },
});
