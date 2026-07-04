import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

type PaymentMethod = 'upi' | 'card' | 'cash';

type Props = {
  visible: boolean;
  totalAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
};

// ─── Your merchant UPI ID (VPA). Replace with your actual UPI ID! ───────────
// This is the UPI address where customers pay you (e.g. yourcampuscart@paytm)
const MERCHANT_UPI_ID = 'campuscart@upi';
const MERCHANT_NAME = 'CampusCart';
// ─────────────────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'upi',  label: 'UPI',             sub: 'PhonePe · GPay · Paytm · Any UPI app', icon: 'phone-portrait' },
  { id: 'card', label: 'Debit / Credit Card', sub: 'Visa · Mastercard · RuPay via Stripe',  icon: 'card' },
  { id: 'cash', label: 'Cash on Delivery', sub: 'Pay in cash when your order arrives',       icon: 'cash' },
];

export default function PaymentModal({ visible, totalAmount, onSuccess, onCancel }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [phase, setPhase] = useState<'select' | 'processing' | 'success' | 'cod_success'>('select');
  const [upiId, setUpiId] = useState('');
  const [upiInputVisible, setUpiInputVisible] = useState(false);

  const slideUp = useRef(new Animated.Value(400)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPhase('select');
      setUpiId('');
      setUpiInputVisible(false);
      Animated.spring(slideUp, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }).start();
    } else {
      slideUp.setValue(400);
      successScale.setValue(0);
      successOpacity.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    setUpiInputVisible(false);
    setUpiId('');
  }, [selectedMethod]);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // ─── UPI Deep Link Flow ────────────────────────────────────────────────────
  const handleUpiPay = async () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. name@paytm, name@okicici)');
      return;
    }

    const transactionRef = `CCART${Date.now()}`;
    const transactionNote = `CampusCart Order Payment`;

    // UPI deep link — opens any UPI app installed on the device
    const upiUrl =
      `upi://pay?pa=${MERCHANT_UPI_ID}` +
      `&pn=${encodeURIComponent(MERCHANT_NAME)}` +
      `&am=${totalAmount.toFixed(2)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(transactionNote)}` +
      `&tr=${transactionRef}`;

    const supported = await Linking.canOpenURL(upiUrl);

    if (!supported) {
      Alert.alert(
        'No UPI App Found',
        'Please install a UPI app (PhonePe, GPay, Paytm) to pay via UPI.',
        [{ text: 'OK' }]
      );
      return;
    }

    setPhase('processing');

    try {
      await Linking.openURL(upiUrl);

      // After returning from UPI app — ask user to confirm payment
      // (UPI deep links don't give automatic confirmation)
      setTimeout(() => {
        Alert.alert(
          'Payment Complete?',
          'Did you complete the payment in your UPI app?',
          [
            {
              text: 'Yes, I paid',
              onPress: () => showSuccessAnimation(false),
            },
            {
              text: 'No, cancel',
              style: 'destructive',
              onPress: () => setPhase('select'),
            },
          ]
        );
      }, 2500);
    } catch (e) {
      console.error('UPI deep link error:', e);
      setPhase('select');
    }
  };

  // ─── Stripe Card Flow ──────────────────────────────────────────────────────
  const fetchPaymentIntentClientSecret = async () => {
    const baseUrl =
      process.env.EXPO_PUBLIC_API_URL ||
      (Platform.OS === 'android' ? 'http://192.168.1.8:3000' : 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalAmount, currency: 'inr' }),
    });
    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const { clientSecret } = await response.json();
    return clientSecret;
  };

  const handleCardPay = async () => {
    setPhase('processing');
    try {
      const clientSecret = await fetchPaymentIntentClientSecret();
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'CampusCart',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
      });
      if (initError) {
        console.error('initPaymentSheet error:', initError);
        setPhase('select');
        return;
      }
      // Close our sheet so Stripe's native UI shows clearly
      onCancel();
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', presentError.message);
        }
        // User cancelled — do nothing, they can retry
      } else {
        onSuccess();
      }
    } catch (e) {
      console.error('Card payment error:', e);
      Alert.alert('Error', 'Could not connect to payment server. Make sure the backend is running.');
      setPhase('select');
    }
  };

  // ─── Cash on Delivery ──────────────────────────────────────────────────────
  const handleCodPay = () => {
    setPhase('processing');
    setTimeout(() => {
      setPhase('cod_success');
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setTimeout(() => onSuccess(), 1800);
    }, 800);
  };

  // ─── Master handler ────────────────────────────────────────────────────────
  const handlePay = () => {
    if (selectedMethod === 'cash') return handleCodPay();
    if (selectedMethod === 'card') return handleCardPay();
    // UPI — show input if not shown
    if (!upiInputVisible) {
      setUpiInputVisible(true);
      return;
    }
    handleUpiPay();
  };

  const showSuccessAnimation = (isCod = false) => {
    setPhase(isCod ? 'cod_success' : 'success');
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => onSuccess(), 1800);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          onPress={phase === 'select' ? onCancel : undefined}
          activeOpacity={1}
        />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideUp }] }]}>
          <View style={styles.handle} />

          {/* ── SUCCESS (UPI/Card) ── */}
          {phase === 'success' && (
            <Animated.View style={[styles.successContainer, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={72} color="#0c831f" />
              </View>
              <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
              <Text style={styles.successSub}>₹{totalAmount.toFixed(0)} paid · Your order is being placed...</Text>
            </Animated.View>
          )}

          {/* ── SUCCESS (Cash on Delivery) ── */}
          {phase === 'cod_success' && (
            <Animated.View style={[styles.successContainer, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
              <View style={[styles.successIcon, { backgroundColor: '#fefce8', borderRadius: 48, padding: 8 }]}>
                <Ionicons name="bicycle" size={64} color="#ca8a04" />
              </View>
              <Text style={styles.successTitle}>Order Placed! 🛵</Text>
              <Text style={styles.successSub}>Pay ₹{totalAmount.toFixed(0)} in cash when your order arrives at your door.</Text>
            </Animated.View>
          )}

          {/* ── PROCESSING ── */}
          {phase === 'processing' && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#0c831f" />
              <Text style={styles.processingTitle}>
                {selectedMethod === 'upi' ? 'Opening UPI App...' :
                 selectedMethod === 'cash' ? 'Placing Order...' :
                 'Connecting to Stripe...'}
              </Text>
              <Text style={styles.processingSub}>Please wait a moment</Text>
            </View>
          )}

          {/* ── SELECTION ── */}
          {phase === 'select' && (
            <>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Complete Payment</Text>
                  <Text style={styles.sheetAmount}>₹{totalAmount.toFixed(0)}</Text>
                </View>
                <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Select Payment Method</Text>

              {PAYMENT_METHODS.map((method) => {
                const selected = selectedMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setSelectedMethod(method.id)}
                    style={[styles.methodCard, selected && styles.methodCardSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.methodIconWrap, selected && styles.methodIconSelected]}>
                      <Ionicons name={method.icon} size={20} color={selected ? '#0c831f' : '#6b7280'} />
                    </View>
                    <View style={styles.methodText}>
                      <Text style={[styles.methodLabel, selected && styles.methodLabelSelected]}>
                        {method.label}
                      </Text>
                      <Text style={styles.methodSub}>{method.sub}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* UPI ID input — shown only when UPI is selected and Pay is tapped */}
              {selectedMethod === 'upi' && upiInputVisible && (
                <View style={styles.upiInputWrap}>
                  <Ionicons name="at" size={16} color="#6b7280" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.upiInput}
                    placeholder="Enter UPI ID (e.g. name@paytm)"
                    placeholderTextColor="#9ca3af"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus
                  />
                </View>
              )}

              {/* UPI App icons row */}
              {selectedMethod === 'upi' && (
                <View style={styles.upiAppsRow}>
                  {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map((app) => (
                    <View key={app} style={styles.upiAppChip}>
                      <Text style={styles.upiAppText}>{app}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity onPress={handlePay} style={styles.payBtn} activeOpacity={0.85}>
                <Ionicons
                  name={selectedMethod === 'upi' && upiInputVisible ? 'phone-portrait' :
                        selectedMethod === 'cash' ? 'bicycle' : 'lock-closed'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.payBtnText}>
                  {selectedMethod === 'upi' && !upiInputVisible
                    ? `Pay ₹${totalAmount.toFixed(0)} via UPI`
                    : selectedMethod === 'upi' && upiInputVisible
                    ? `Open UPI App · ₹${totalAmount.toFixed(0)}`
                    : selectedMethod === 'cash'
                    ? `Place Order · Pay on Delivery`
                    : `Pay ₹${totalAmount.toFixed(0)} with Card`}
                </Text>
              </TouchableOpacity>

              <Text style={styles.secureNote}>
                <Ionicons name="shield-checkmark" size={11} color="#9ca3af" />
                {' '}100% Secure · SSL encrypted
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  sheetAmount: { fontSize: 32, fontWeight: '900', color: '#1a1a1a' },
  closeBtn: { width: 36, height: 36, backgroundColor: '#f3f4f6', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.6, marginBottom: 12 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  methodCardSelected: { borderColor: '#0c831f', backgroundColor: '#f0fdf4' },
  methodIconWrap: { width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodIconSelected: { backgroundColor: '#dcfce7' },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  methodLabelSelected: { color: '#0c831f' },
  methodSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#0c831f' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0c831f' },
  upiInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0c831f',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  upiInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a', padding: 0 },
  upiAppsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  upiAppChip: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  upiAppText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c831f',
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 4,
    gap: 8,
    shadowColor: '#0c831f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  payBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  secureNote: { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10 },
  processingContainer: { alignItems: 'center', paddingVertical: 52 },
  processingTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginTop: 16 },
  processingSub: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 10 },
  successSub: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
