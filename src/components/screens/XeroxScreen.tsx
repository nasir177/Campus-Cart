import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

interface XeroxShop {
  id: string;
  name: string;
  building: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  weightOrQty: string;
  isXerox?: boolean;
  specs?: any;
}

type Props = {
  xeroxShops: XeroxShop[];
  selectedXeroxId: string | null;
  onSelectXerox: (id: string) => void;
  onAddXeroxToCart: (item: CartItem) => void;
};

export default function XeroxScreen({
  xeroxShops,
  selectedXeroxId,
  onSelectXerox,
  onAddXeroxToCart,
}: Props) {
  const [pages, setPages] = useState(5);
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState<'B/W' | 'Color'>('B/W');
  const [layout, setLayout] = useState<'Single' | 'Double'>('Single');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; uri: string; size?: number } | null>(null);

  const selectedShop = xeroxShops.find((s) => s.id === selectedXeroxId) ?? null;
  const pricePerPage = color === 'Color' ? 10 : 2;
  const estimatedCost = pricePerPage * pages * copies;

  const pickPdfFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setUploadedFile({ name: asset.name, uri: asset.uri, size: asset.size });
      }
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not load the PDF document.');
    }
  };

  const handleAddToCart = () => {
    const desc = `${pages} pgs • ${color} • ${layout}-sided`;
    const item: CartItem = {
      id: `xerox_${Date.now()}`,
      name: `Xerox: ${uploadedFile?.name ?? selectedShop?.name ?? 'Document'}`,
      price: pricePerPage * pages,
      weightOrQty: desc,
      quantity: copies,
      isXerox: true,
      specs: {
        colorMode: color,
        layout,
        pages,
        copies,
        fileName: uploadedFile?.name ?? 'document.pdf',
        shopId: selectedShop?.id,
        shopName: selectedShop?.name,
        fileUri: uploadedFile?.uri,
      },
    };
    onAddXeroxToCart(item);
    Alert.alert('Added to Basket', `${item.name} has been added.`, [
      { text: 'OK' },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>DESK PRINT SERVICE</Text>
          </View>
          <Text style={styles.heroTitle}>Instant Campus{'\n'}Print & Xerox</Text>
          <Text style={styles.heroSub}>
            {selectedShop ? `${selectedShop.name} · ${selectedShop.building}` : 'Delivered straight to your desk in 10 mins'}
          </Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="print" size={40} color="#b45309" />
        </View>
      </View>

      {/* Shop Selector */}
      {xeroxShops.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            <Ionicons name="storefront-outline" size={13} color="#0c831f" /> SELECT PRINT SHOP
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {xeroxShops.map((shop) => {
              const active = shop.id === selectedXeroxId;
              return (
                <TouchableOpacity
                  key={shop.id}
                  onPress={() => onSelectXerox(shop.id)}
                  style={[styles.shopChip, active && styles.shopChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shopChipText, active && styles.shopChipTextActive]}>{shop.name}</Text>
                  <Text style={[styles.shopChipSub, active && styles.shopChipSubActive]}>{shop.building}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* File Upload */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          <Ionicons name="document-text-outline" size={13} color="#0c831f" /> 1. SELECT DOCUMENT
        </Text>
        <TouchableOpacity onPress={pickPdfFile} style={styles.uploadBtn} activeOpacity={0.85}>
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadBtnText}>Upload PDF from Device</Text>
        </TouchableOpacity>
        {uploadedFile ? (
          <View style={styles.fileInfo}>
            <Ionicons name="document" size={18} color="#0c831f" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fileName}>{uploadedFile.name}</Text>
              <Text style={styles.fileSub}>{uploadedFile.size ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : 'PDF ready'}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#0c831f" />
          </View>
        ) : (
          <Text style={styles.uploadHint}>No file selected. Upload a PDF or proceed with defaults.</Text>
        )}
      </View>

      {/* Print Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          <Ionicons name="options-outline" size={13} color="#0c831f" /> 2. PRINT PREFERENCES
        </Text>

        {/* Color toggle */}
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Color Mode</Text>
          <View style={styles.toggleGroup}>
            {(['B/W', 'Color'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setColor(opt)}
                style={[styles.toggleBtn, color === opt && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleBtnText, color === opt && styles.toggleBtnTextActive]}>
                  {opt === 'B/W' ? 'B/W  ₹2/pg' : 'Color  ₹10/pg'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Layout toggle */}
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Duplex Mode</Text>
          <View style={styles.toggleGroup}>
            {(['Single', 'Double'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setLayout(opt)}
                style={[styles.toggleBtn, layout === opt && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleBtnText, layout === opt && styles.toggleBtnTextActive]}>
                  {opt} Sided
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Pages counter */}
        <View style={styles.counterRow}>
          <View>
            <Text style={styles.counterLabel}>Total Pages</Text>
            <Text style={styles.counterSub}>Layout sheet count</Text>
          </View>
          <View style={styles.counter}>
            <TouchableOpacity onPress={() => setPages((p) => Math.max(1, p - 1))} style={styles.counterBtn}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{pages}</Text>
            <TouchableOpacity onPress={() => setPages((p) => p + 1)} style={styles.counterBtn}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copies counter */}
        <View style={styles.counterRow}>
          <View>
            <Text style={styles.counterLabel}>Copies</Text>
            <Text style={styles.counterSub}>Duplicate sets</Text>
          </View>
          <View style={styles.counter}>
            <TouchableOpacity onPress={() => setCopies((c) => Math.max(1, c - 1))} style={styles.counterBtn}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{copies}</Text>
            <TouchableOpacity onPress={() => setCopies((c) => c + 1)} style={styles.counterBtn}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Cost + CTA */}
      <View style={styles.costCard}>
        <View>
          <Text style={styles.costLabel}>Estimated Cost</Text>
          <Text style={styles.costAmount}>₹{estimatedCost}</Text>
          <Text style={styles.costSub}>₹{pricePerPage}/pg · {pages} pages · {copies} set{copies > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleAddToCart} style={styles.addToCartBtn} activeOpacity={0.85}>
          <Ionicons name="cart" size={16} color="#fff" />
          <Text style={styles.addToCartBtnText}>Add to Basket</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 14 },
  hero: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroBadge: {
    backgroundColor: '#ffd300',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '900', color: '#92400e', letterSpacing: 0.6 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', lineHeight: 24, marginBottom: 6 },
  heroSub: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  heroIcon: {
    width: 72,
    height: 72,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLabel: { fontSize: 11, fontWeight: '800', color: '#6b7280', letterSpacing: 0.6 },
  shopChip: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shopChipActive: { backgroundColor: '#fefce8', borderColor: '#fcd34d' },
  shopChipText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  shopChipTextActive: { color: '#92400e' },
  shopChipSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  shopChipSubActive: { color: '#b45309' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c831f',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 10,
    gap: 8,
    justifyContent: 'center',
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  fileName: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  fileSub: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  uploadHint: { fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  preferenceLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  toggleBtnText: { fontSize: 11, fontWeight: '700', color: '#9ca3af' },
  toggleBtnTextActive: { color: '#1a1a1a' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  counterLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  counterSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  counterBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f9fafb' },
  counterBtnText: { fontSize: 18, fontWeight: '800', color: '#374151', lineHeight: 20 },
  counterValue: { paddingHorizontal: 16, fontSize: 15, fontWeight: '800', color: '#1a1a1a', minWidth: 36, textAlign: 'center' },
  costCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#0c831f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  costLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  costAmount: { fontSize: 26, fontWeight: '900', color: '#0c831f' },
  costSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c831f',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#0c831f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
