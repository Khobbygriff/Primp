import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentLocation } from '../services/locationService';
import { colors, fonts, spacing, borderRadius } from '../theme';

const RADIUS_OPTIONS = [5, 10, 15, 25, 50];

const DEFAULT_CENTER = { latitude: 5.6037, longitude: -0.1870 };

export default function WorkLocationScreen({ navigation, route }: any) {
    const { latitude, longitude, serviceRadiusKm } = route.params ?? {};

    const [marker, setMarker] = useState<{ latitude: number; longitude: number }>(
        latitude != null && longitude != null ? { latitude, longitude } : DEFAULT_CENTER
    );
    const [hasSetLocation, setHasSetLocation] = useState(latitude != null && longitude != null);
    const [radius, setRadius] = useState<number>(serviceRadiusKm ?? 15);
    const [locating, setLocating] = useState(false);

    const region = {
        latitude: marker.latitude,
        longitude: marker.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
    };

    const handleUseCurrentLocation = async () => {
        setLocating(true);
        const coords = await getCurrentLocation();
        setLocating(false);
        if (!coords) {
            Alert.alert(
                'Location Unavailable',
                'Please allow location access in your device settings, or drag the pin to set it manually.'
            );
            return;
        }
        setMarker(coords);
        setHasSetLocation(true);
    };

    const handleConfirm = () => {
        if (!hasSetLocation) {
            Alert.alert('Set a Location', 'Use your current location or drag the pin to set your work location.');
            return;
        }
        navigation.navigate({
            name: 'EditProfile',
            params: {
                savedWorkLocation: {
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    serviceRadiusKm: radius,
                },
            },
            merge: true,
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Set Work Location</Text>
                <Text style={styles.headerSubtitle}>
                    Drag the pin or use your current location, then choose your service radius
                </Text>
            </LinearGradient>

            <MapView style={styles.map} region={region}>
                <Marker
                    coordinate={marker}
                    draggable
                    onDragEnd={(e) => {
                        setMarker(e.nativeEvent.coordinate);
                        setHasSetLocation(true);
                    }}
                    pinColor={colors.primary}
                />
                {hasSetLocation && (
                    <Circle
                        center={marker}
                        radius={radius * 1000}
                        strokeColor={colors.primary}
                        strokeWidth={1.5}
                        fillColor="rgba(194,24,91,0.12)"
                    />
                )}
            </MapView>

            <View style={styles.panel}>
                <TouchableOpacity
                    style={styles.locateButton}
                    onPress={handleUseCurrentLocation}
                    disabled={locating}>
                    {locating ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                        <Text style={styles.locateButtonText}>📍 Use My Current Location</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.radiusLabel}>Service Radius</Text>
                <View style={styles.radiusRow}>
                    {RADIUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.radiusChip, radius === option && styles.radiusChipActive]}
                            onPress={() => setRadius(option)}>
                            <Text style={[
                                styles.radiusChipText,
                                radius === option && styles.radiusChipTextActive,
                            ]}>
                                {option} km
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.confirmGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}>
                        <Text style={styles.confirmText}>Confirm Location</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
    backText: { color: colors.primaryLight, fontFamily: fonts.medium, fontSize: 15, marginBottom: spacing.sm },
    headerTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.white, marginBottom: 4 },
    headerSubtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.primaryLight },
    map: { flex: 1 },
    panel: {
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 6,
    },
    locateButton: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        marginBottom: spacing.md,
    },
    locateButtonText: { fontFamily: fonts.semiBold, color: colors.primary, fontSize: 14 },
    radiusLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textPrimary, marginBottom: spacing.sm },
    radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
    radiusChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    radiusChipActive: { backgroundColor: colors.primary },
    radiusChipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.primary },
    radiusChipTextActive: { color: colors.white },
    confirmButton: { borderRadius: borderRadius.sm, overflow: 'hidden' },
    confirmGradient: { padding: 16, alignItems: 'center' },
    confirmText: { fontFamily: fonts.bold, color: colors.white, fontSize: 16 },
});