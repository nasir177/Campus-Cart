import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Set notification handler to show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Helper to check if we are in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function setupNotifications() {
  if (isExpoGo) {
    console.log('Push notifications are not supported in Expo Go (SDK 53+). Skipping setup.');
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      
      await Notifications.setNotificationChannelAsync('geofence-jobs', {
        name: 'Runner Geofence Jobs',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#4f46e5',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Notification setup failed (likely due to Expo Go limitations):', error);
    return false;
  }
}

export async function triggerGeofenceNotification(
  canteenName: string,
  orderDetails: string,
  earnAmount: number
) {
  if (isExpoGo) {
    console.log('Skipping geofence notification in Expo Go.');
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📍 Job Available Nearby! (Earn ₹${earnAmount})`,
        body: `You are near ${canteenName}. Pick up order: ${orderDetails}`,
        data: { type: 'geofence_job', canteenName, earnAmount },
        sound: true,
      },
      trigger: null, // deliver immediately
    });
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
  }
}
