import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, TextInput, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfessionals, Professional } from '../services/userService';
import { colors, fonts, spacing, borderRadius } from '../theme';

const SPECIALTIES = [
    'All', 'Braider', 'Makeup Artist', 'Barber',
    'Loctician', 'Nail Technician', 'Hair Stylist',
];

export default function DiscoveryScreen({ navigation }: any) {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [filtered, setFiltered] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');

    useEffect(() => {
        loadProfessionals();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [search, selectedSpecialty, professionals]);

    const loadProfessionals = async () => {
        try {
            const data = await getProfessionals();
            setProfessionals(data);
            setFiltered(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load professionals');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        // Server already orders Priority Listing professionals first;
        // preserve that relative order through client-side filtering.
        let results = [...professionals];
        if (selectedSpecialty !== 'All') {
            results = results.filter(p =>
                p.specialty?.toLowerCase() === selectedSpecialty.toLowerCase()
            );
        }
        if (search.trim()) {
            results = results.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.location?.toLowerCase().includes(search.toLowerCase()) ||
                p.specialty?.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFiltered(results);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primaryDark, colors.primary, '#E91E8C']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Find a Professional</Text>
                <Text style={styles.subtitle}>
                    {filtered.length} professional{filtered.length !== 1 ? 's' : ''} available
                </Text>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search by name, location or specialty..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}>
                {SPECIALTIES.map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.filterChip,
                            selectedSpecialty === s && styles.filterChipActive]}
                        onPress={() => setSelectedSpecialty(s)}>
                        <Text style={[styles.filterChipText,
                            selectedSpecialty === s && styles.filterChipTextActive]}>
                            {s}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.list} contentContainerStyle={{ padding: spacing.md }}>
                {filtered.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyText}>No professionals found</Text>
                        <Text style={styles.emptySubtext}>Try a different search or filter</Text>
                    </View>
                ) : (
                    filtered.map((pro) => (
                        <View key={pro.id} style={[styles.card, pro.isPriorityListingActive && styles.cardPriority]}>
                            <TouchableOpacity
                                style={styles.cardMain}
                                onPress={() => navigation.navigate('ViewProfile', { userId: pro.id })}>
                                {pro.profilePhotoUrl ? (
                                    <Image source={{ uri: pro.profilePhotoUrl }} style={styles.avatar} />
                                ) : (
                                    <LinearGradient
                                        colors={[colors.primary, colors.primaryDark]}
                                        style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {pro.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <View style={styles.info}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.name}>{pro.name}</Text>
                                        {pro.isVerifiedBadge && (
                                            <View style={styles.verifiedBadge}>
                                                <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                                            </View>
                                        )}
                                    </View>
                                    {pro.isPriorityListingActive && (
                                        <Text style={styles.priorityLabel}>⭐ Featured</Text>
                                    )}
                                    {pro.specialty ? (
                                        <View style={styles.specialtyBadge}>
                                            <Text style={styles.specialtyText}>💼 {pro.specialty}</Text>
                                        </View>
                                    ) : null}
                                    <Text style={styles.location}>📍 {pro.location}</Text>
                                    {pro.bio ? (
                                        <Text style={styles.bio} numberOfLines={2}>{pro.bio}</Text>
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Booking', {
                                    professionalId: pro.id,
                                    professionalName: pro.name,
                                    specialty: pro.specialty,
                                })}>
                                <LinearGradient
                                    colors={[colors.primary, colors.primaryDark]}
                                    style={styles.bookButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}>
                                    <Text style={styles.bookButtonText}>Book</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: spacing.lg,
        paddingTop: 60,
    },
    backText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontFamily: fonts.medium,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.bold,
        color: colors.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: 'rgba(255,255,255,0.8)',
    },
    searchContainer: {
        padding: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
        backgroundColor: colors.white,
    },
    searchInput: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: 10,
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
    },
    filterRow: {
        backgroundColor: colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        flexGrow: 0,
        height: 54,
    },
    filterContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.primary,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterChipText: {
        color: colors.primary,
        fontSize: 13,
        fontFamily: fonts.medium,
    },
    filterChipTextActive: {
        color: colors.white,
    },
    list: {
        flex: 1,
    },
    empty: {
        padding: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: fonts.semiBold,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textMuted,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardPriority: {
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    cardMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: spacing.md,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontFamily: fonts.bold,
        color: colors.white,
    },
    info: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    name: {
        fontSize: 15,
        fontFamily: fonts.semiBold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    verifiedBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: borderRadius.full,
        marginBottom: 4,
    },
    verifiedBadgeText: {
        fontSize: 10,
        fontFamily: fonts.semiBold,
        color: '#1565C0',
    },
    priorityLabel: {
        fontSize: 11,
        fontFamily: fonts.semiBold,
        color: colors.accent,
        marginBottom: 2,
    },
    specialtyBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF0F5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        marginBottom: 4,
    },
    specialtyText: {
        fontSize: 11,
        fontFamily: fonts.medium,
        color: colors.primary,
    },
    location: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    bio: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textMuted,
        marginTop: 2,
        fontStyle: 'italic',
    },
    bookButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: borderRadius.full,
        marginLeft: 8,
    },
    bookButtonText: {
        color: colors.white,
        fontSize: 13,
        fontFamily: fonts.semiBold,
    },
});