import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAppStore } from '../store/useAppStore';

export function CampusScanner({ children }: { children: React.ReactNode }) {
  const { currentCampus, setCurrentCampus } = useAppStore();
  const [loading, setLoading] = useState(!currentCampus);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentCampus) return;

    async function scanNearestCampus() {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied.\nCampusCart needs your location to find the nearest campus hub.');
          setLoading(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = location.coords;

        // Load local campus data for testing
        const localCampus = require('../../jamia_hamdard_data.json');
        const hubs = [
          {
            id: localCampus.hubId,
            name: localCampus.campusName,
            latitude: localCampus.latitude,
            longitude: localCampus.longitude,
          }
        ];

        let closestHub = null;
        let minDistance = Infinity;

        hubs.forEach((hub) => {
          const lat2 = hub.latitude;
          const lon2 = hub.longitude;
          const R = 6371;
          const dLat = (lat2 - latitude) * Math.PI / 180;
          const dLon = (lon2 - longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          if (distance < minDistance) {
            minDistance = distance;
            closestHub = hub;
          }
        });

        // For development: If distance is > 5km (e.g. testing on an emulator), 
        // we force-select the Jamia Hamdard campus so the app still works!
        if (closestHub) {
          if (minDistance > 5) {
            console.log(`User is ${minDistance.toFixed(1)}km away. Forcing DEV mode campus selection.`);
          }
          setCurrentCampus(closestHub);
        } else {
          setErrorMsg('No affiliated campus hub found nearby.\nYou may be outside the supported campus area.');
        }
      } catch (error) {
        console.error("Location Error:", error);
        // Fallback to local JSON on error as well
        const localCampus = require('../../jamia_hamdard_data.json');
        setCurrentCampus({
          id: localCampus.hubId,
          name: localCampus.campusName,
          latitude: localCampus.latitude,
          longitude: localCampus.longitude,
        });
      } finally {
        setLoading(false);
      }
    }

    scanNearestCampus();
  }, [currentCampus, setCurrentCampus]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <View style={styles.logoWrap}>
            <MaterialCommunityIcons name="cart" size={40} color="#0c831f" />
          </View>
          <Text style={styles.appName}>CampusCart</Text>
          <Text style={styles.tagline}>10-minute campus delivery</Text>
          <View style={styles.scanWrap}>
            <ActivityIndicator size="large" color="#0c831f" />
            <Text style={styles.scanText}>Scanning for nearby campus hubs...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg && !currentCampus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="location-outline" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Campus Not Found</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity
            onPress={() => { setLoading(true); setErrorMsg(null); }}
            style={styles.retryBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Retry Scan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logoWrap: { width: 80, height: 80, backgroundColor: '#f0fdf4', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#bbf7d0' },
  appName: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', marginBottom: 4 },
  tagline: { fontSize: 13, color: '#6b7280', marginBottom: 40 },
  scanWrap: { alignItems: 'center', gap: 12 },
  scanText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorIconWrap: { width: 96, height: 96, backgroundColor: '#fef2f2', borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#fecaca' },
  errorTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a1a', marginBottom: 10 },
  errorMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, gap: 8 },
  retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});