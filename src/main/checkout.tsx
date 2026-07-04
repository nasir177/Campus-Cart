import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/useAppStore';
import { useCartStore } from '../store/useCartStore';
import { useOrders } from '../hooks/useOrders';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { uploadFileAsync } from '../utils/firebase';

// UI Components
import Header from '../components/ui/Header';
import BottomBar, { Tab } from '../components/ui/BottomBar';
import CartFloatingBar from '../components/ui/CartFloatingBar';

// Screens
import HomeScreen from '../components/screens/HomeScreen';
import XeroxScreen from '../components/screens/XeroxScreen';
import CartScreen from '../components/screens/CartScreen';
import OrdersScreen from '../components/screens/OrdersScreen';
import ProfileScreen from '../components/screens/ProfileScreen';
import RunnerDashboard from '../components/screens/RunnerDashboard';
import PaymentModal from '../components/screens/PaymentModal';

const campusDataJson = require('../../jamia_hamdard_data.json');

export default function CheckoutScreen() {
  // Start offline queue synchronizer
  useOfflineSync();

  const { currentCampus, userRole, userProfile } = useAppStore();
  const {
    items: cart,
    addItem,
    removeItem,
    clearCart,
    targetNodeId,
    targetNodeName,
    setTargetNode,
  } = useCartStore();

  const { usePlaceOrderMutation } = useOrders();
  const placeOrderMutation = usePlaceOrderMutation();

  // ── Navigation ──
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Campus Data ──
  const [campusData, setCampusData] = useState<any>(null);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [selectedXeroxId, setSelectedXeroxId] = useState<string | null>(null);

  // ── Search ──
  const [searchText, setSearchText] = useState('');

  // ── Order Tracking ──
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);

  // ──────────────────────────────────────────
  // Init campus data
  // ──────────────────────────────────────────
  useEffect(() => {
    const data = campusDataJson;
    setCampusData(data);
    if (data?.canteens?.length) setSelectedCanteenId(data.canteens[0].id);
    if (data?.xeroxShops?.length) setSelectedXeroxId(data.xeroxShops[0].id);
  }, []);

  // Sync activeTab to runner dashboard when role toggles to runner
  useEffect(() => {
    if (userRole === 'runner') {
      setActiveTab('runner_dashboard');
    } else {
      setActiveTab('home');
    }
  }, [userRole]);

  // ──────────────────────────────────────────
  // Cart helpers
  // ──────────────────────────────────────────
  const getSubtotal = () => cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const platformFee = cart.length > 0 ? 3 : 0;
  const deliveryFee = cart.length > 0 ? 15 : 0;
  const totalAmount = getSubtotal() + platformFee + deliveryFee;

  const handleAddToCart = useCallback((product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '',
      category: product.category,
      weightOrQty: product.weightOrQty,
    });
  }, [addItem]);

  const handleRemoveFromCart = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  const handleAddXeroxToCart = useCallback((item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: '',
      category: 'Services',
      weightOrQty: item.weightOrQty,
    });
  }, [addItem]);

  // ──────────────────────────────────────────
  // Order placement
  // ──────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!targetNodeId) {
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSubmitting(true);
    
    try {
      // Process xerox uploads if any
      const itemsToSave = await Promise.all(
        cart.map(async (item) => {
          // If we had file uploads in legacy print
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category,
          };
        })
      );

      const orderPayload = {
        items: itemsToSave,
        subtotal: getSubtotal(),
        platformFee,
        deliveryFee,
        tax: 0,
        totalAmount,
        status: 'placed' as const,
        targetNodeName: targetNodeName ?? 'Campus Desk',
        deliveryLocation: {
          buildingId: targetNodeId ?? 'unknown',
          buildingName: targetNodeName ?? 'Campus Desk',
          floorId: '1',
          floorName: 'Ground Floor',
          details: 'Campus Desk Delivery',
        },
        customerName: userProfile.displayName,
        customerPhone: userProfile.phone,
        customerUpi: userProfile.upiId,
        canteenId: selectedCanteenId || 'general_pickup',
        canteenName: campusData?.canteens.find((c: any) => c.id === selectedCanteenId)?.name || 'Hamdard Canteen',
      };

      const orderId = await placeOrderMutation.mutateAsync(orderPayload);
      setLatestOrderId(orderId);
      setOrderPlaced(true);
    } catch (err) {
      console.error('Checkout execution error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────
  // Main shell
  // ──────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Dynamic Header */}
      <Header
        targetNodeName={targetNodeName}
        campusName={currentCampus?.name ?? null}
        searchText={searchText}
        onSearchChange={(text) => {
          setSearchText(text);
          if (activeTab !== 'home') setActiveTab('home');
        }}
        onLocationPress={() => {
          setActiveTab('cart');
        }}
        onProfilePress={() => setActiveTab('profile')}
      />

      {/* Screen Content */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            campusData={campusData}
            cart={cart}
            searchText={searchText}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onXeroxPress={() => setActiveTab('xerox')}
            selectedCanteenId={selectedCanteenId}
            onSelectCanteen={setSelectedCanteenId}
          />
        )}

        {activeTab === 'xerox' && (
          <XeroxScreen
            xeroxShops={campusData?.xeroxShops ?? []}
            selectedXeroxId={selectedXeroxId}
            onSelectXerox={setSelectedXeroxId}
            onAddXeroxToCart={handleAddXeroxToCart}
          />
        )}

        {activeTab === 'cart' && (
          <CartScreen
            showLocationPicker={false}
            submitting={submitting}
            onToggleLocationPicker={() => {}}
            onPlaceOrder={handlePlaceOrder}
            onGoShopping={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersScreen
            onGoShopping={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            onSwitchTab={setActiveTab}
          />
        )}

        {activeTab === 'runner_dashboard' && (
          <RunnerDashboard />
        )}
      </View>

      {/* Floating cart bar (visible on non-cart and non-profile tabs in customer mode) */}
      {activeTab !== 'cart' && activeTab !== 'profile' && userRole !== 'runner' && cart.length > 0 && (
        <CartFloatingBar
          itemCount={cart.reduce((a, b) => a + b.quantity, 0)}
          totalAmount={totalAmount}
          onPress={() => setActiveTab('cart')}
        />
      )}

      {/* Bottom Nav */}
      <BottomBar
        activeTab={activeTab}
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        totalAmount={totalAmount}
        onChangeTab={setActiveTab}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        totalAmount={totalAmount}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPaymentModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1 },
});
