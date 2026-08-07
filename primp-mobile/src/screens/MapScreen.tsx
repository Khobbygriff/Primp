import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout, Circle } from 'react-native-maps';
import { getProfessionals, Professional } from '../services/userService';
import { getCurrentLocation, getDistanceKm, formatDistance, Coordinates } from '../services/locationService';
import { colors, fonts, spacing, borderRadius } from '../theme';

// Fallback centroids for professionals who haven't set a precise work
// location pin yet — matched against their free-text location field so
// older profiles keep showing up on the map after this feature ships.
const LOCATION_COORDS: Record<string, { latitude: number; longitude: number }> = {
    'Accra':        { latitude: 5.6037,  longitude: -0.1870 },
    'East Legon':   { latitude: 5.6360,  longitude: -0.1563 },
    'Osu':          { latitude: 5.5558,  longitude: -0.1770 },
    'Cantonments':  { latitude: 5.5731,  longitude: -0.1821 },
    'Tema':         { latitude: 5.6698,  longitude: -0.0166 },
    'Kumasi':       { latitude: 6.6885,  longitude: -1.6244 },
    'Takoradi':     { latitude: 4.8845,  longitude: -1.7554 },
};

const DEFAULT_CENTER: Coordinates = { latitude: 5.6037, longitude: -0.1870 };

const getFallbackCoords = (location: string) => {
    if (!location) return null;
    for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
        if (location.toLowerCase().includes(key.toLowerCase())) {
            return coords;
        }
    }
    return null;
};

interface MappedProfessional extends Professional {
    coords: Coordinates;
    distanceKm: number | null;
    isPreciseLocation: boolean;
    inServiceRadius: boolean;
}

export default function MapScreen({ navigation }: any) {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientLocation, setClientLocation] = useState<Coordinates | null>(null);
    const [locationDenied, setLocationDenied] = useState(false);
    const [showNearbyOnly, setShowNearbyOnly] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [coords, data] = await Promise.all([
            getCurrentLocation(),
            getProfessionals(),
        ]);
        setClientLocation(coords);
        setLocationDenied(!coords);
        setProfessionals(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const center = clientLocation ?? DEFAULT_CENTER;

    const mapped: MappedProfessional[] = professionals
        .map((pro) => {
            const preciseCoords = (pro.workLatitude != null && pro.workLongitude != null)
                ? { latitude: pro.workLatitude, longitude: pro.workLongitude }
                : null;
            const coords = preciseCoords ?? getFallbackCoords(pro.location);
            if (!coords) return null;

            const distanceKm = clientLocation ? getDistanceKm(clientLocation, coords) : null;
            const radius = pro.serviceRadiusKm ?? 15;
            const inServiceRadius = distanceKm === null ? true : distanceKm <= radius;

            return {
                ...pro,
                coords,
                distanceKm,
                isPreciseLocation: !!preciseCoords,
                inServiceRadius,
            } as MappedProfessional;
        })
        .filter((p): p is MappedProfessional => p !== null)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    const visible = showNearbyOnly
        ? mapped.filter((p) => p.inServiceRadius)
        : mapped;

    return (
        <View style={styles.container}>

            <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professionals Near You</Text>
                <Text style={styles.headerSubtitle}>
                    {visible.length} professional{visible.length !== 1 ? 's' : ''} {showNearbyOnly ? 'in your area' : 'on the map'}
                </Text>
            </LinearGradient>

            {locationDenied && (
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>
                        📍 Enable location access for distance-based results. Showing all listed professionals instead.
                    </Text>
                </View>
            )}

            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleChip, showNearbyOnly && styles.toggleChipActive]}
                    onPress={() => setShowNearbyOnly(true)}>
                    <Text style={[styles.toggleChipText, showNearbyOnly && styles.toggleChipTextActive]}>
                        Near Me
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleChip, !showNearbyOnly && styles.toggleChipActive]}
                    onPress={() => setShowNearbyOnly(false)}>
                    <Text style={[styles.toggleChipText, !showNearbyOnly && styles.toggleChipTextActive]}>
                        Show All
                    </Text>
                </TouchableOpacity>
            </View>

            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: center.latitude,
                    longitude: center.longitude,
                    latitudeDelta: 0.2,
                    longitudeDelta: 0.2,
                }}
                showsUserLocation={!!clientLocation}
                showsMyLocationButton>
                {clientLocation && (
                    <Circle
                        center={clientLocation}
                        radius={1000}
                        strokeColor={colors.primary}
                        fillColor="rgba(194,24,91,0.15)"
                    />
                )}
                {visible.map((pro) => (
                    <Marker
                        key={pro.id}
                        coordinate={pro.coords}
                        pinColor={pro.isPreciseLocation ? colors.primary : colors.textMuted}>
                        <Callout
                            onPress={() => navigation.navigate('ViewProfile', { userId: pro.id })}>
                            <View style={styles.callout}>
                                <Text style={styles.calloutName}>{pro.name}</Text>
                                {pro.specialty && (
                                    <Text style={styles.calloutSpecialty}>💼 {pro.specialty}</Text>
                                )}
                                <Text style={styles.calloutLocation}>📍 {pro.location}</Text>
                                {pro.distanceKm !== null && (
                                    <Text style={styles.calloutDistance}>
                                        {formatDistance(pro.distanceKm)}
                                    </Text>
                                )}
                                <Text style={styles.calloutAction}>Tap to view profile →</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: { paddingTop: 52, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
    backButton: { alignSelf: 'flex-start', marginBottom: spacing.sm },
    backText: { color: colors.primaryLight, fontFamily: fonts.medium, fontSize: 15 },
    headerTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.white, marginBottom: spacing.xs },
    headerSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.primaryLight },
    banner: {
        backgroundColor: '#FFF3E0',
        borderBottomWidth: 1,
        borderBottomColor: '#FFCC80',
        padding: spacing.sm + 2,
    },
    bannerText: { fontFamily: fonts.regular, fontSize: 11, color: '#7A4B00', textAlign: 'center' },
    toggleRow: {
        flexDirection: 'row',
        gap: 8,
        padding: spacing.sm + 2,
        backgroundColor: colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
    },
    toggleChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    toggleChipActive: { backgroundColor: colors.primary },
    toggleChipText: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
    toggleChipTextActive: { color: colors.white },
    map: { flex: 1 },
    callout: { padding: spacing.md - 4, minWidth: 180 },
    calloutName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.xs },
    calloutSpecialty: { fontFamily: fonts.regular, fontSize: 13, color: colors.primary, marginBottom: 2 },
    calloutLocation: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    calloutDistance: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.accent, marginBottom: spacing.sm },
    calloutAction: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
});