import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { getEarningsAnalytics, EarningsAnalytics } from '../services/analyticsService';
import { getRatingSummary, RatingSummary } from '../services/reviewService';
import { colors, fonts, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.md * 2 - spacing.md * 2;

const formatGHS = (amount?: number) => `GH₵ ${(amount ?? 0).toFixed(2)}`;

const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
};

export default function AnalyticsScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(false);
    const [analytics, setAnalytics] = useState<EarningsAnalytics | null>(null);
    const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            load();
        }, [])
    );

    const load = async () => {
        setLoading(true);
        try {
            const [analyticsData, rating] = await Promise.all([
                getEarningsAnalytics(user?.id ?? 0),
                getRatingSummary(user?.id ?? 0).catch(() => null),
            ]);
            setAnalytics(analyticsData);
            setRatingSummary(rating);
            setLocked(false);
        } catch (error: any) {
            if (error?.response?.status === 403) {
                setLocked(true);
            } else {
                console.log('Earnings analytics load failed:', error?.message, error?.response?.status);
                Alert.alert('Error', 'Failed to load earnings analytics');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const monthEntries = analytics ? Object.entries(analytics.revenueByMonth) : [];
    const maxMonthRevenue = Math.max(1, ...monthEntries.map(([, value]) => value));

    const serviceEntries = analytics ? Object.entries(analytics.revenueByServiceType) : [];
    const maxServiceRevenue = Math.max(1, ...serviceEntries.map(([, value]) => value));

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
                <Text style={styles.title}>Earnings Analytics</Text>
                <Text style={styles.subtitle}>Your income dashboard</Text>
            </LinearGradient>

            {locked ? (
                <View style={styles.lockedBanner}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={styles.lockedTitle}>Earnings Analytics is locked</Text>
                    <Text style={styles.lockedText}>
                        Unlock this premium feature in Edit Profile to see your revenue by month,
                        by service type, average booking value, and performance trends.
                    </Text>
                    <TouchableOpacity
                        style={styles.lockedButton}
                        onPress={() => navigation.navigate('EditProfile')}>
                        <Text style={styles.lockedButtonText}>Go to Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: spacing.md }}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Revenue</Text>
                            <Text style={styles.summaryValue}>{formatGHS(analytics?.totalRevenue)}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Net Earnings</Text>
                            <Text style={styles.summaryValue}>{formatGHS(analytics?.totalNetEarnings)}</Text>
                        </View>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Avg. Booking Value</Text>
                            <Text style={styles.summaryValue}>{formatGHS(analytics?.averageBookingValue)}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Closed Bookings</Text>
                            <Text style={styles.summaryValue}>{analytics?.totalClosedBookings ?? 0}</Text>
                        </View>
                    </View>

                    {ratingSummary && ratingSummary.totalReviews > 0 && (
                        <View style={styles.ratingCard}>
                            <Text style={styles.ratingStar}>★</Text>
                            <View>
                                <Text style={styles.ratingValue}>{ratingSummary.averageRating} average rating</Text>
                                <Text style={styles.ratingSubtext}>
                                    from {ratingSummary.totalReviews} client review{ratingSummary.totalReviews !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Revenue Trend by Month</Text>
                    <View style={styles.chartCard}>
                        {monthEntries.length === 0 ? (
                            <Text style={styles.emptyChartText}>No closed bookings yet</Text>
                        ) : (
                            monthEntries.map(([month, revenue]) => (
                                <View key={month} style={styles.barRow}>
                                    <Text style={styles.barLabel}>{formatMonthLabel(month)}</Text>
                                    <View style={styles.barTrack}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                { width: (revenue / maxMonthRevenue) * (CHART_WIDTH - 90) },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.barValue}>{formatGHS(revenue)}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Revenue by Service Type</Text>
                    <View style={styles.chartCard}>
                        {serviceEntries.length === 0 ? (
                            <Text style={styles.emptyChartText}>No closed bookings yet</Text>
                        ) : (
                            serviceEntries.map(([service, revenue]) => (
                                <View key={service} style={styles.barRow}>
                                    <Text style={styles.barLabel} numberOfLines={1}>{service}</Text>
                                    <View style={styles.barTrack}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                styles.barFillAlt,
                                                { width: (revenue / maxServiceRevenue) * (CHART_WIDTH - 90) },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.barValue}>{formatGHS(revenue)}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={styles.feeNote}>
                        <Text style={styles.feeNoteText}>
                            Total revenue is what clients paid. Net earnings subtract Primp's transaction fee
                            ({formatGHS(analytics?.totalPrimpFees)} collected across {analytics?.totalClosedBookings ?? 0} closed booking
                            {analytics?.totalClosedBookings !== 1 ? 's' : ''}).
                        </Text>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: spacing.lg, paddingTop: 60 },
    backText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontFamily: fonts.medium,
        marginBottom: 8,
    },
    title: { fontSize: 24, fontFamily: fonts.bold, color: colors.white, marginBottom: 4 },
    subtitle: { fontSize: 13, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)' },
    lockedBanner: {
        margin: spacing.md,
        padding: spacing.lg,
        backgroundColor: '#FFF3E0',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#FFCC80',
        alignItems: 'center',
    },
    lockedIcon: { fontSize: 32, marginBottom: spacing.sm },
    lockedTitle: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: '#7A4B00',
        marginBottom: spacing.xs,
    },
    lockedText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: '#7A4B00',
        lineHeight: 19,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    lockedButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
    },
    lockedButtonText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 13 },
    summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.textPrimary },
    ratingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    ratingStar: { fontSize: 28, color: '#F0A500' },
    ratingValue: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textPrimary },
    ratingSubtext: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
    sectionTitle: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        marginTop: spacing.xs,
    },
    chartCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyChartText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: spacing.md,
    },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    barLabel: { width: 60, fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary },
    barTrack: {
        flex: 1,
        height: 16,
        backgroundColor: colors.background,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        marginRight: spacing.sm,
    },
    barFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
    },
    barFillAlt: {
        backgroundColor: colors.accent,
    },
    barValue: { width: 76, fontSize: 11, fontFamily: fonts.semiBold, color: colors.textPrimary, textAlign: 'right' },
    feeNote: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    feeNoteText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textMuted,
        lineHeight: 18,
    },
});