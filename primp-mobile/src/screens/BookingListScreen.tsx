import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import {
    getClientBookings, getProfessionalBookings, updateBookingStatus,
    closeBooking, getBookingHistory, Booking, BookingStatusHistoryEntry
} from '../services/bookingService';
import { downloadAndShareReceipt } from '../services/receiptService';
import { colors, fonts, spacing, borderRadius } from '../theme';

const STATUS_COLORS: Record<string, string[]> = {
    REQUESTED: ['#F0A500', '#E65100'],
    CONFIRMED: ['#1A56A0', '#0D3B73'],
    IN_PROGRESS: ['#6A1B9A', '#4A148C'],
    COMPLETED: ['#1E7A4A', '#145A32'],
    CANCELLED: ['#E24B4A', '#C0392B'],
    CLOSED: ['#888', '#666'],
};

const formatStatusLabel = (status: string) =>
    status === 'IN_PROGRESS'
        ? 'In Progress'
        : status.charAt(0) + status.slice(1).toLowerCase();

const formatGHS = (amount?: number) =>
    `GH₵ ${(amount ?? 0).toFixed(2)}`;

export default function BookingListScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [closingId, setClosingId] = useState<number | null>(null);
    const [receiptLoadingId, setReceiptLoadingId] = useState<number | null>(null);

    const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});
    const [historyByBooking, setHistoryByBooking] = useState<Record<number, BookingStatusHistoryEntry[]>>({});
    const [loadingHistoryId, setLoadingHistoryId] = useState<number | null>(null);

    const isProfessional = user?.role === 'PROFESSIONAL';

    useFocusEffect(
        React.useCallback(() => {
            loadBookings();
        }, [])
    );

    useEffect(() => {
        if (selectedFilter === 'ALL') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(b => b.status === selectedFilter));
        }
    }, [selectedFilter, bookings]);

    const loadBookings = async () => {
        try {
            const userId = useAuthStore.getState().user?.id ?? 0;
            const data = isProfessional
                ? await getProfessionalBookings(userId)
                : await getClientBookings(userId);
            setBookings(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBookings();
        setRefreshing(false);
    };

    const handleStatusUpdate = async (bookingId: number, status: string) => {
        try {
            await updateBookingStatus(bookingId, status);
            loadBookings();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleConfirmCompletion = async (bookingId: number) => {
        setClosingId(bookingId);
        try {
            await closeBooking(bookingId);
            await loadBookings();
        } catch (error) {
            Alert.alert('Error', 'Failed to confirm completion');
        } finally {
            setClosingId(null);
        }
    };

    const handleDownloadReceipt = async (bookingId: number) => {
        setReceiptLoadingId(bookingId);
        try {
            await downloadAndShareReceipt(bookingId);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate receipt. Please try again.');
        } finally {
            setReceiptLoadingId(null);
        }
    };

    const toggleHistory = async (bookingId: number) => {
        const isExpanded = !!expandedHistory[bookingId];
        setExpandedHistory((prev) => ({ ...prev, [bookingId]: !isExpanded }));

        if (!isExpanded && !historyByBooking[bookingId]) {
            setLoadingHistoryId(bookingId);
            try {
                const history = await getBookingHistory(bookingId);
                setHistoryByBooking((prev) => ({ ...prev, [bookingId]: history }));
            } catch (error) {
                Alert.alert('Error', 'Failed to load booking timeline');
            } finally {
                setLoadingHistoryId(null);
            }
        }
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
                <Text style={styles.title}>My Bookings</Text>
                <Text style={styles.subtitle}>
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
                </Text>
            </LinearGradient>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}>
                {['ALL', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'].map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterChip,
                            selectedFilter === filter && styles.filterChipActive]}
                        onPress={() => setSelectedFilter(filter)}>
                        <Text style={[styles.filterChipText,
                            selectedFilter === filter && styles.filterChipTextActive]}>
                            {filter === 'ALL' ? 'All' : formatStatusLabel(filter)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                style={styles.list}
                contentContainerStyle={{ padding: spacing.md }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }>
                {filteredBookings.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No bookings found</Text>
                        {!isProfessional && selectedFilter === 'ALL' && (
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('Discovery')}>
                                <Text style={styles.emptyButtonText}>Find a Professional</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredBookings.map((booking) => (
                        <View key={booking.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.serviceType}>{booking.serviceType}</Text>
                                <LinearGradient
                                    colors={(STATUS_COLORS[booking.status] || ['#888', '#666']) as [string, string]}
                                    style={styles.statusBadge}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}>
                                    <Text style={styles.statusText}>
                                        {formatStatusLabel(booking.status)}
                                    </Text>
                                </LinearGradient>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>📍</Text>
                                <Text style={styles.detailText}>{booking.location}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>📅</Text>
                                <Text style={styles.detailText}>
                                    {new Date(booking.preferredDate).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>🕐</Text>
                                <Text style={styles.detailText}>
                                    {new Date(booking.preferredDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            {booking.notes ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailIcon}>📝</Text>
                                    <Text style={styles.detailText}>{booking.notes}</Text>
                                </View>
                            ) : null}

                            <View style={styles.priceCard}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Service Price</Text>
                                    <Text style={styles.priceValue}>{formatGHS(booking.agreedPrice)}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Primp Fee ({Math.round((booking.primpFeeRate ?? 0.08) * 100)}%)</Text>
                                    <Text style={styles.priceValue}>{formatGHS(booking.primpFee)}</Text>
                                </View>
                                <View style={styles.priceDivider} />
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceTotalLabel}>Total</Text>
                                    <Text style={styles.priceTotalValue}>{formatGHS(booking.totalAmount)}</Text>
                                </View>
                            </View>

                            {isProfessional && booking.status === 'REQUESTED' && (
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.actionButtonWrapper}
                                        onPress={() => handleStatusUpdate(booking.id, 'CONFIRMED')}>
                                        <LinearGradient
                                            colors={['#1E7A4A', '#145A32']}
                                            style={styles.actionButton}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}>
                                            <Text style={styles.actionText}>✓ Confirm</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButtonWrapper}
                                        onPress={() => handleStatusUpdate(booking.id, 'CANCELLED')}>
                                        <LinearGradient
                                            colors={['#E24B4A', '#C0392B']}
                                            style={styles.actionButton}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}>
                                            <Text style={styles.actionText}>✕ Decline</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {isProfessional && booking.status === 'CONFIRMED' && (
                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    onPress={() => handleStatusUpdate(booking.id, 'IN_PROGRESS')}>
                                    <LinearGradient
                                        colors={['#6A1B9A', '#4A148C']}
                                        style={styles.actionButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.actionText}>▶ Mark In Progress</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {isProfessional && booking.status === 'IN_PROGRESS' && (
                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    onPress={() => {
                                        Alert.alert(
                                            'Mark as Completed',
                                            'Confirm this service is complete. The client will be asked to confirm before you can be reviewed.',
                                            [
                                                { text: 'Not yet', style: 'cancel' },
                                                {
                                                    text: 'Mark Completed',
                                                    onPress: () => handleStatusUpdate(booking.id, 'COMPLETED')
                                                }
                                            ]
                                        );
                                    }}>
                                    <LinearGradient
                                        colors={['#1E7A4A', '#145A32']}
                                        style={styles.actionButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.actionText}>✓ Mark Completed</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {!isProfessional && booking.status === 'REQUESTED' && (
                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    onPress={() => {
                                        Alert.alert(
                                            'Cancel Booking',
                                            'Are you sure you want to cancel this booking request?',
                                            [
                                                { text: 'Keep', style: 'cancel' },
                                                {
                                                    text: 'Cancel Booking',
                                                    style: 'destructive',
                                                    onPress: () => handleStatusUpdate(booking.id, 'CANCELLED')
                                                }
                                            ]
                                        );
                                    }}>
                                    <LinearGradient
                                        colors={['#E24B4A', '#C0392B']}
                                        style={styles.actionButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.actionText}>✕ Cancel Request</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {!isProfessional && booking.status === 'COMPLETED' && (
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.actionButtonWrapper}
                                        disabled={closingId === booking.id}
                                        onPress={() => {
                                            Alert.alert(
                                                'Confirm Completion',
                                                'Confirm that this service was completed to your satisfaction. This closes the booking.',
                                                [
                                                    { text: 'Not yet', style: 'cancel' },
                                                    {
                                                        text: 'Confirm & Close',
                                                        onPress: () => handleConfirmCompletion(booking.id)
                                                    }
                                                ]
                                            );
                                        }}>
                                        <LinearGradient
                                            colors={['#1E7A4A', '#145A32']}
                                            style={styles.actionButton}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}>
                                            {closingId === booking.id ? (
                                                <ActivityIndicator color={colors.white} size="small" />
                                            ) : (
                                                <Text style={styles.actionText}>✓ Confirm Completion</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButtonWrapper}
                                        onPress={() => navigation.navigate('Review', {
                                            bookingId: booking.id,
                                            revieweeId: booking.professionalId
                                        })}>
                                        <LinearGradient
                                            colors={[colors.primary, colors.primaryDark]}
                                            style={styles.actionButton}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}>
                                            <Text style={styles.actionText}>⭐ Leave a Review</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {isProfessional && booking.status === 'CLOSED' && (
                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    onPress={() => navigation.navigate('Review', {
                                        bookingId: booking.id,
                                        revieweeId: booking.clientId
                                    })}>
                                    <LinearGradient
                                        colors={[colors.primary, colors.primaryDark]}
                                        style={styles.actionButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.actionText}>⭐ Review Client</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {booking.status === 'CLOSED' && (
                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    disabled={receiptLoadingId === booking.id}
                                    onPress={() => handleDownloadReceipt(booking.id)}>
                                    <View style={styles.receiptButton}>
                                        {receiptLoadingId === booking.id ? (
                                            <ActivityIndicator color={colors.primary} size="small" />
                                        ) : (
                                            <Text style={styles.receiptButtonText}>🧾 Save/Share Receipt</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.timelineToggle}
                                onPress={() => toggleHistory(booking.id)}>
                                <Text style={styles.timelineToggleText}>
                                    {expandedHistory[booking.id] ? 'Hide Timeline ▲' : 'View Timeline ▾'}
                                </Text>
                            </TouchableOpacity>

                            {expandedHistory[booking.id] && (
                                <View style={styles.timelineContainer}>
                                    {loadingHistoryId === booking.id ? (
                                        <ActivityIndicator color={colors.primary} size="small" />
                                    ) : (
                                        (historyByBooking[booking.id] || []).map((entry) => (
                                            <View key={entry.id} style={styles.timelineItem}>
                                                <View style={styles.timelineDot} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.timelineText}>
                                                        {formatStatusLabel(entry.status)}
                                                    </Text>
                                                    <Text style={styles.timelineDate}>
                                                        {new Date(entry.changedAt).toLocaleDateString()} ·{' '}
                                                        {new Date(entry.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}
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
    filterRow: {
        backgroundColor: colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        flexGrow: 0,
        height: 54,
    },
    filterContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
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
        fontSize: 12,
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
        marginBottom: 16,
    },
    emptyButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: borderRadius.sm,
    },
    emptyButtonText: {
        color: colors.white,
        fontSize: 15,
        fontFamily: fonts.semiBold,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    serviceType: {
        fontSize: 16,
        fontFamily: fonts.semiBold,
        color: colors.textPrimary,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusText: {
        color: colors.white,
        fontSize: 11,
        fontFamily: fonts.semiBold,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
    },
    detailIcon: {
        fontSize: 13,
        marginTop: 1,
    },
    detailText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        flex: 1,
    },
    priceCard: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm + 2,
        marginTop: spacing.sm,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    priceLabel: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },
    priceValue: {
        fontSize: 12,
        fontFamily: fonts.medium,
        color: colors.textPrimary,
    },
    priceDivider: {
        height: 0.5,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    priceTotalLabel: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.textPrimary,
    },
    priceTotalValue: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: spacing.sm,
    },
    actionButtonWrapper: {
        flex: 1,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        marginTop: spacing.sm,
    },
    actionButton: {
        padding: 12,
        alignItems: 'center',
    },
    actionText: {
        color: colors.white,
        fontFamily: fonts.semiBold,
        fontSize: 13,
    },
    receiptButton: {
        padding: 12,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    receiptButtonText: {
        color: colors.primary,
        fontFamily: fonts.semiBold,
        fontSize: 13,
    },
    timelineToggle: {
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
    },
    timelineToggleText: {
        fontSize: 12,
        fontFamily: fonts.medium,
        color: colors.primary,
    },
    timelineContainer: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: spacing.sm,
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginTop: 4,
    },
    timelineText: {
        fontSize: 13,
        fontFamily: fonts.semiBold,
        color: colors.textPrimary,
    },
    timelineDate: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: colors.textMuted,
        marginTop: 2,
    },
});