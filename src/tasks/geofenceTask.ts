import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { mmkvStorage } from '../storage/mmkv';
import { getDistanceMeters } from '../utils/haversine';
import { triggerGeofenceNotification } from '../utils/notifications';
import campusDataJson from '../../jamia_hamdard_data.json';

export const GEOFENCE_BG_TASK = 'GEOFENCE_BG_TASK';

TaskManager.defineTask(GEOFENCE_BG_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[Background Geofence Task] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations || locations.length === 0) return;

    // Check if runner is active in MMKV
    const isRunnerActive = mmkvStorage.getObject<boolean>('@runner_active');
    if (!isRunnerActive) {
      console.log('[Background Geofence Task] Runner inactive. Skipping.');
      return;
    }

    const { latitude, longitude } = locations[0].coords;
    console.log(`[Background Geofence Task] Active runner coordinates: ${latitude}, ${longitude}`);

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
        const canteenKey = `@bg_notified_${canteen.id}`;
        const lastNotified = mmkvStorage.getObject<number>(canteenKey) || 0;
        const now = Date.now();

        // Limit background alerts to once every 5 minutes per canteen
        if (now - lastNotified > 1000 * 60 * 5) {
          mmkvStorage.setObject(canteenKey, now);

          // Trigger local push notification in the background
          triggerGeofenceNotification(
            canteen.name,
            'New delivery opportunities are available at this canteen.',
            15 // default delivery fee
          ).catch(console.warn);
        }
      }
    });
  }
});
