import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';

export const registerForPushNotifications = async (): Promise<string | null> => {
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#C2185B',
        });
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (finalStatus !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
    }

    try {
        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;

        const tokenResponse = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        return tokenResponse.data;
    } catch (error) {
        console.log('Failed to obtain Expo push token', error);
        return null;
    }
};

export const syncPushTokenWithServer = async (): Promise<void> => {
    try {
        const token = await registerForPushNotifications();
        if (!token) return;
        await api.post('/api/notifications/device-token', { token });
    } catch (error) {
        console.log('Failed to sync push token with server');
    }
};