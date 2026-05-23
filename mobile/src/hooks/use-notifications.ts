import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { subscribeExpo } from '../api/notifications';
import { listIncidents } from '../api/incidents';
import type { UserPublic } from '../api/types';

// Set notification handler for Native devices
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function useNotifications(user: UserPublic | null) {
  const seenIncidentIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!user) return;

    // 1. Native Push Registration (iOS / Android)
    const registerNativePush = async () => {
      if (Platform.OS === 'web') return;
      try {
        if (!Device.isDevice) {
          console.log('Must use physical device for Push Notifications');
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        console.log('Expo Push Token registered:', token);

        await subscribeExpo(token);
      } catch (err) {
        console.error('Failed to register native push:', err);
      }
    };

    registerNativePush();

    // 2. Web Browser Simulator Notification Fallback (Polling)
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }

      // Polling logic for anomaly detection & replies
      const pollInterval = setInterval(async () => {
        try {
          const list = await listIncidents({ limit: 10 });
          
          if (!initialLoadDone.current) {
            // First load: populate seen set
            list.forEach((inc) => seenIncidentIds.current.add(inc.id));
            initialLoadDone.current = true;
            return;
          }

          // Check for new incidents (unseen)
          for (const inc of list) {
            if (!seenIncidentIds.current.has(inc.id)) {
              seenIncidentIds.current.add(inc.id);
              
              // Trigger browser notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`🚨 Insiden Baru: ${inc.severity}`, {
                  body: `${inc.machine_name} (${inc.machine_code}): ${inc.title}`,
                });
              }
            }
          }
        } catch (err) {
          console.error('Error polling incidents for web notification:', err);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [user]);
}
