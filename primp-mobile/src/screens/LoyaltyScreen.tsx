import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { getLoyaltyBoard, sendRebookingReminder, sendPersonalizedOffer, LoyaltyStamp } from '../services/loyaltyService';
import { colors, fonts, spacing, borderRadius } from '../theme';

export default function LoyaltyScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [board, setBoard] = useState<LoyaltyStamp[]>([]);
    const [hasLoyaltyTools, setHasLoyaltyTools] = useState<boolean | null>(null);
    const [sendingClientId, setSendingClientId] = useState<number | null>(null);
    const [offerModalClient, setOfferModalClient] = useState<LoyaltyStamp | null>(null);
    const [offerMessage, setOfferMessage] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            load();
        }, [])
    );

    const load = async () => {
        try {
            const data = await getLoyaltyBoard(user?.id ?? 0);
            setBoard(data);
            setHasLoyaltyTools(true);
        } catch (error: any) {
            if (error?.response?.status === 403) {
                setHasLoyaltyTools(false);
            } else {
                Alert.alert('Error', 'Failed to load loyalty data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemind = async (client: LoyaltyStamp) => {
        setSendingClientId(client.clientId);
        try {
            await sendRebookingReminder(user?.id ?? 0, client.clientId);
            Alert.alert('Sent', `A rebooking reminder was sent to ${client.clientName}.`);
            load();
        } catch (error: any) {
            const message = error?.response?.data?.message
                || (error?.response?.status === 403
                    ? 'Unlock Client Loyalty Tools in Edit Profile to send reminders.'
                    : error?.response?.status === 429
                        ? 'A message was already sent to this client recently.'
                        : 'Failed to send reminder.');
            Alert.alert('Error', message);
        } finally {
            setSendingClientId(null);
        }
    };

    const handleSendOffer = async () => {
        if (!offerModalClient || !offerMessage.trim()) return;
        setSendingClientId(offerModalClient.clientId);
        try {
            await sendPersonalizedOffer(user?.id ?? 0, offerModalClient.clientId, offerMessage.trim());
            Alert.alert('Sent', `Your offer was sent to ${offerModalClient.clientName}.`);
            setOfferModalClient(null);
            setOfferMessage('');
            load();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to send offer.');
        } finally {
            setSendingClientId(null);
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Client Loyalty</Text>
                <Text style={styles.subtitle}>Stamps, reminders, and offers for repeat clients</Text>
            </LinearGradient>

            {hasLoyaltyTools === false && (
                <View style={styles.lockedBanner}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={styles.lockedText}>
                        Unlock Client Loyalty Tools in Edit Profile to send rebooking reminders and personalized offers.
                        Stamps are still tracked automatically in the meantime.
                    </Text>
                    <TouchableOpacity
                        style={styles.lockedButton}
                        onPress={() => navigation.navigate('EditProfile')}>
                        <Text style={styles.lockedButtonText}>Go to Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
                {board.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🎟️</Text>
                        <Text style={styles.emptyText}>No client stamps yet</Text>
                        <Text style={styles.emptySubtext}>
                            Stamps are earned automatically when a booking is confirmed and closed by the client.
                        </Text>
                    </View>
                ) : (
                    board.map((client) => (
                        <View key={client.clientId} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.clientName}>{client.clientName}</Text>
                                    <Text style={styles.clientMeta}>
                                        {client.stampCount} stamp{client.stampCount !== 1 ? 's' : ''} ·{' '}
                                        {client.stampsUntilNextReward} to next reward
                                    </Text>
                                </View>
                                {client.rewardMilestone && (
                                    <View style={styles.rewardBadge}>
                                        <Text style={styles.rewardBadgeText}>🎉 Reward Ready</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.stampRow}>
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const filled = client.stampCount % 5 === 0 && client.stampCount > 0
                                        ? true
                                        : i < client.stampCount % 5;
                                    return (
                                        <View
                                            key={i}
                                            style={[styles.stamp, filled && styles.stampFilled]}
                                        />
                                    );
                                })}
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    disabled={sendingClientId === client.clientId || hasLoyaltyTools === false}
                                    onPress={() => handleRemind(client)}>
                                    {sendingClientId === client.clientId ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text style={styles.actionButtonText}>🔔 Remind</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    disabled={hasLoyaltyTools === false}
                                    onPress={() => setOfferModalClient(client)}>
                                    <Text style={styles.actionButtonText}>🎁 Send Offer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={!!offerModalClient} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>
                            Send offer to {offerModalClient?.clientName}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. 15% off your next braid appointment this week!"
                            placeholderTextColor={colors.textMuted}
                            value={offerMessage}
                            onChangeText={setOfferMessage}
                            multiline
                            numberOfLines={4}
                        />
                        <TouchableOpacity style={styles.modalSendButton} onPress={handleSendOffer}>
                            <Text style={styles.modalSendButtonText}>Send</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => { setOfferModalClient(null); setOfferMessage(''); }}>
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        padding: spacing.md,
        backgroundColor: '#FFF3E0',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#FFCC80',
    },
    lockedIcon: { fontSize: 24, marginBottom: spacing.xs },
    lockedText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: '#7A4B00',
        lineHeight: 19,
        marginBottom: spacing.sm,
    },
    lockedButton: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    lockedButtonText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: 12 },
    empty: { padding: 60, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textSecondary, marginBottom: 4 },
    emptySubtext: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center' },
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
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    clientName: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary },
    clientMeta: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
    rewardBadge: {
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
    },
    rewardBadgeText: { fontSize: 11, fontFamily: fonts.semiBold, color: '#F57F17' },
    stampRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
    stamp: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.background,
    },
    stampFilled: { backgroundColor: colors.primary },
    actions: { flexDirection: 'row', gap: 10 },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: borderRadius.sm,
        borderWidth: 1.5,
        borderColor: colors.primary,
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
    },
    actionButtonText: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    modalTitle: {
        fontFamily: fonts.bold,
        fontSize: 17,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    modalInput: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        backgroundColor: colors.background,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    modalSendButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    modalSendButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
    modalCancelButton: { alignItems: 'center', padding: spacing.sm },
    modalCancelButtonText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 14 },
});