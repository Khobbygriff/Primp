import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { colors, fonts, spacing, borderRadius } from '../theme';
import api from '../services/api';

export default function HomeScreen({ navigation }: any) {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const isProfessional = user?.role === 'PROFESSIONAL';
    const [bookingCount, setBookingCount] = useState(0);
    const [notifCount, setNotifCount] = useState(0);
    const [hasClientLoyaltyTools, setHasClientLoyaltyTools] = useState(false);
    const [hasEarningsAnalytics, setHasEarningsAnalytics] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        try {
            const userId = user?.id ?? 0;
            const [bookings, notifs, profile] = await Promise.all([
                isProfessional
                    ? api.get(`/api/bookings/professional/${userId}`)
                    : api.get(`/api/bookings/client/${userId}`),
                api.get(`/api/notifications/user/${userId}/count`),
                isProfessional ? api.get(`/api/auth/profile/${userId}`) : Promise.resolve(null),
            ]);
            setBookingCount(bookings.data.length);
            setNotifCount(notifs.data);
            if (profile) {
                setHasClientLoyaltyTools(!!profile.data.hasClientLoyaltyTools);
                setHasEarningsAnalytics(!!profile.data.hasEarningsAnalytics);
            }
        } catch (error) {
            console.log('Failed to load stats');
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={[colors.primaryDark, colors.primary, '#E91E8C']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>
                            {t('home.greeting', { name: user?.name?.split(' ')[0] ?? '' })}
                        </Text>
                        <Text style={styles.role}>
                            {isProfessional ? t('home.professionalAccount') : t('home.clientAccount')}
                        </Text>
                    </View>
                    {user?.profilePhotoUrl ? (
                        <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{bookingCount}</Text>
                        <Text style={styles.statLabel}>{t('home.bookings')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, notifCount > 0 && styles.statAlert]}>
                            {notifCount}
                        </Text>
                        <Text style={styles.statLabel}>{t('home.unreadAlerts')}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                {isProfessional ? (
                    <>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('AddPortfolio')}>
                            <LinearGradient
                                colors={['#FCE4EC', '#F8BBD9']}
                                style={styles.actionIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}>
                                <Text style={styles.actionEmoji}>📸</Text>
                            </LinearGradient>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>Add to Portfolio</Text>
                                <Text style={styles.actionSubtitle}>Post your latest work</Text>
                            </View>
                            <Text style={styles.actionArrow}>›</Text>
                        </TouchableOpacity>

                        {hasEarningsAnalytics ? (
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Analytics')}>
                                <LinearGradient
                                    colors={['#E1F5FE', '#B3E5FC']}
                                    style={styles.actionIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <Text style={styles.actionEmoji}>📊</Text>
                                </LinearGradient>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Earnings Analytics</Text>
                                    <Text style={styles.actionSubtitle}>Revenue, trends and ratings</Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('EditProfile')}>
                                <LinearGradient
                                    colors={['#F5F5F5', '#E0E0E0']}
                                    style={styles.actionIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <Text style={styles.actionEmoji}>🔒</Text>
                                </LinearGradient>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Earnings Analytics</Text>
                                    <Text style={styles.actionSubtitle}>Unlock in Edit Profile — GH₵ 20.00</Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                        )}

                        {hasClientLoyaltyTools ? (
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Loyalty')}>
                                <LinearGradient
                                    colors={['#FFF8E1', '#FFECB3']}
                                    style={styles.actionIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <Text style={styles.actionEmoji}>🎟️</Text>
                                </LinearGradient>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Client Loyalty</Text>
                                    <Text style={styles.actionSubtitle}>Stamps, reminders and offers</Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('EditProfile')}>
                                <LinearGradient
                                    colors={['#F5F5F5', '#E0E0E0']}
                                    style={styles.actionIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <Text style={styles.actionEmoji}>🔒</Text>
                                </LinearGradient>
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionTitle}>Client Loyalty</Text>
                                    <Text style={styles.actionSubtitle}>Unlock in Edit Profile — GH₵ 25.00</Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Map')}>
                            <LinearGradient
                                colors={['#E3F2FD', '#BBDEFB']}
                                style={styles.actionIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}>
                                <Text style={styles.actionEmoji}>🗺️</Text>
                            </LinearGradient>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>Map View</Text>
                                <Text style={styles.actionSubtitle}>See professionals on the map</Text>
                            </View>
                            <Text style={styles.actionArrow}>›</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Discovery')}>
                            <LinearGradient
                                colors={['#FCE4EC', '#F8BBD9']}
                                style={styles.actionIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}>
                                <Text style={styles.actionEmoji}>🔍</Text>
                            </LinearGradient>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>Find a Professional</Text>
                                <Text style={styles.actionSubtitle}>Browse and book beauty professionals</Text>
                            </View>
                            <Text style={styles.actionArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Map')}>
                            <LinearGradient
                                colors={['#E3F2FD', '#BBDEFB']}
                                style={styles.actionIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}>
                                <Text style={styles.actionEmoji}>🗺️</Text>
                            </LinearGradient>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>Map View</Text>
                                <Text style={styles.actionSubtitle}>Find professionals near you</Text>
                            </View>
                            <Text style={styles.actionArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('EditProfile')}>
                            <LinearGradient
                                colors={['#E8F5E9', '#C8E6C9']}
                                style={styles.actionIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}>
                                <Text style={styles.actionEmoji}>✏️</Text>
                            </LinearGradient>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>Edit Profile</Text>
                                <Text style={styles.actionSubtitle}>Update your details</Text>
                            </View>
                            <Text style={styles.actionArrow}>›</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={styles.aboutCard}>
                    <LinearGradient
                        colors={[colors.primaryDark, colors.primary]}
                        style={styles.aboutGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}>
                        <Text style={styles.aboutTitle}>About Primp</Text>
                        <Text style={styles.aboutText}>
                            {isProfessional
                                ? 'Showcase your work, manage bookings, and grow your client base across Ghana.'
                                : 'Find verified professionals, book appointments, and discover amazing talent near you.'}
                        </Text>
                    </LinearGradient>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    greeting: {
        fontSize: 24,
        fontFamily: fonts.bold,
        color: colors.white,
        marginBottom: 4,
    },
    role: {
        fontSize: 13,
        fontFamily: fonts.medium,
        color: 'rgba(255,255,255,0.8)',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: {
        fontSize: 22,
        fontFamily: fonts.bold,
        color: colors.white,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: spacing.md,
    },
    statNumber: {
        fontSize: 28,
        fontFamily: fonts.bold,
        color: colors.white,
        marginBottom: 2,
    },
    statAlert: {
        color: '#FFD54F',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: fonts.medium,
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        padding: spacing.lg,
        marginTop: -spacing.md,
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: fonts.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    actionCard: {
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
        elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    actionEmoji: {
        fontSize: 24,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontFamily: fonts.semiBold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },
    actionArrow: {
        fontSize: 24,
        color: colors.textMuted,
        fontFamily: fonts.bold,
    },
    aboutCard: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    aboutGradient: {
        padding: spacing.lg,
    },
    aboutTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.white,
        marginBottom: 8,
    },
    aboutText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 20,
    },
});