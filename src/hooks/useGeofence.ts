import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useRunnerStore } from '../store/useRunnerStore';
import { getDistanceMeters } from '../utils/haversine';
import { triggerGeofenceNotification } from '../utils/notifications';
import campusDataJson from '../../jamia_hamdard_data.json';

export function useGeofence() {
  const { isActive, nearbyJobs, setCurrentLocation } = useRunnerStore();
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  
  // Track notified canteens to prevent duplicate alert spam within a short window
  const notifiedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function startTracking() {
      if (!isActive) {
        stopTracking();
        return;
      }

      try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          console.warn('Foreground location permission denied');
          return;
        }

        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission denied');
        }

        // Clean up previous subscription before starting a new one
        if (subscriptionRef.current) {
          subscriptionRef.current.remove();
        }

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // every 5 seconds
            distanceInterval: 10, // or every 10 meters
          },
          (location) => {
            if (!active) return;
            const { latitude, longitude } = location.coords;
            
            // Save location in Runner store
            setCurrentLocation({ latitude, longitude });

            // Check proximity for all canteens
            const canteens = campusDataJson.canteens || [];
            canteens.forEach((canteen: any) => {
              if (!canteen.coordinates) return;

              const distance = getDistanceMeters(
                latitude,
                longitude,
                canteen.coordinates.latitude,
                canteen.coordinates.longitude
              );

              // Within 50 meters
              if (distance <= 50) {
                // Find if there is an available job for this canteen
                const jobsAtCanteen = nearbyJobs.filter(
                  (job) => job.canteenId === canteen.id && job.status === 'placed'
                );

                if (jobsAtCanteen.length > 0) {
                  const now = Date.now();
                  const lastNotified = notifiedRef.current[canteen.id] || 0;
                  
                  // Rate limit notifications to once every 2 minutes per canteen
                  if (now - lastNotified > 1000 * 60 * 2) {
                    notifiedRef.current[canteen.id] = now;
                    
                    const job = jobsAtCanteen[0];
                    const itemsSummary = job.items
                      ?.map((i) => `${i.name} (${i.quantity}x)`)
                      .join(', ') || 'Food items';
                    
                    triggerGeofenceNotification(
                      canteen.name,
                      itemsSummary,
                      job.deliveryFee
                    ).catch(console.warn);
                  }
                }
              }
            });
          }
        );
      } catch (error) {
        console.warn('Error starting location tracking:', error);
      }
    }

    startTracking();

    return () => {
      active = false;
      stopTracking();
    };
  }, [isActive, nearbyJobs, setCurrentLocation]);

  function stopTracking() {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setCurrentLocation(null);
  }
}
