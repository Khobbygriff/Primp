import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

/**
 * Downloads the booking's PDF receipt (Service Receipt) and opens the
 * native share sheet so the client can save it or send it on, since a PDF
 * blob can't be routed through the app's JSON-oriented axios instance.
 */
export const downloadAndShareReceipt = async (bookingId: number): Promise<void> => {
    if (!BASE_URL) {
        throw new Error('EXPO_PUBLIC_API_URL is required');
    }

    const token = useAuthStore.getState().token;
    const fileUri = `${FileSystem.cacheDirectory}primp-receipt-${bookingId}.pdf`;

    const result = await FileSystem.downloadAsync(
        `${BASE_URL}/api/bookings/${bookingId}/receipt`,
        fileUri,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
    );

    if (result.status !== 200) {
        throw new Error(`Failed to download receipt (status ${result.status})`);
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
        await Sharing.shareAsync(result.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Primp Service Receipt',
        });
    }
};