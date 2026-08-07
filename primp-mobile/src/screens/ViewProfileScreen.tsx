import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { getRatingSummary, getReviewsForUser, Review, RatingSummary } from '../services/reviewService';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface Profile {
    id: number;
    name: string;
    location: string;
    role: string;
    phone: string;
    specialty: string;
    bio: string;
    profilePhotoUrl?: string;
    isPriorityListingActive?: boolean;
    isVerifiedBadge?: boolean;
}

export default function ViewProfileScreen({ navigation, route }: any) {
    const currentUser = useAuthStore((state) => state.user);
    const userId = route.params?.userId ?? currentUser?.id;
    const isOwnProfile = userId === currentUser?.id;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [profileRes, summary, reviewList] = await Promise.all([
                api.get(`/api/auth/profile/${userId}`),
                getRatingSummary(userId),
                getReviewsForUser(userId),
            ]);
            setProfile(profileRes.data);
            setRatingSummary(summary);
            setReviews(reviewList);
        } catch (error) {
            console.log('Failed to load profile data');
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

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={[colors.primaryDark, colors.primary, '#E91E8C']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.profileCenter}>
                    {profile?.profilePhotoUrl ? (
                        <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {profile?.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{profile?.name}</Text>
                        {profile?.isVerifiedBadge && (
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                            </View>
                        )}
                    </View>
                    {profile?.isPriorityListingActive && (
                        <Text style={styles.featuredLabel}>⭐ Featured Professional</Text>
                    )}
                    {profile?.specialty && (
                        <View style={styles.specialtyBadge}>
                            <Text style={styles.specialtyText}>💼 {profile.specialty}</Text>
                        </View>
                    )}
                    <Text style={styles.role}>{profile?.role}</Text>
                    <Text style={styles.location}>📍 {profile?.location}</Text>

                    {ratingSummary && ratingSummary.totalReviews > 0 && (
                        <View style={styles.ratingRow}>
                            <Text style={styles.ratingStar}>★</Text>
                            <Text style={styles.ratingValue}>{ratingSummary.averageRating}</Text>
                            <Text style={styles.ratingCount}>
                                ({ratingSummary.totalReviews} review{ratingSummary.totalReviews !== 1 ? 's' : ''})
                            </Text>
                        </View>
                    )}

                    {isOwnProfile && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditProfile')}>
                            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {profile?.bio && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <View style={styles.contactRow}>
                    <Text style={styles.contactIcon}>📞</Text>
                    <Text style={styles.contactText}>{profile?.phone}</Text>
                </View>
                <View style={styles.contactRow}>
                    <Text style={styles.contactIcon}>📍</Text>
                    <Text style={styles.contactText}>{profile?.location}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Reviews ({reviews.length})
                </Text>
                {reviews.length === 0 ? (
                    <View style={styles.emptyReviews}>
                        <Text style={styles.emptyReviewsIcon}>⭐</Text>
                        <Text style={styles.emptyReviewsText}>No reviews yet</Text>
                    </View>
                ) : (
                    reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewStars}>
                                    {'★'.repeat(review.rating)}
                                    <Text style={styles.reviewStarsEmpty}>
                                        {'☆'.repeat(5 - review.rating)}
                                    </Text>
                                </Text>
                                <Text style={styles.reviewDate}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            {review.comment ? (
                                <Text style={styles.reviewComment}>{review.comment}</Text>
                            ) : null}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
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
        marginBottom: 16,
    },
    profileCenter: {
        alignItems: 'center',
        paddingBottom: spacing.md,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 36,
        fontFamily: fonts.bold,
        color: colors.white,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    name: {
        fontSize: 22,
        fontFamily: fonts.bold,
        color: colors.white,
        marginBottom: 8,
    },
    verifiedBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
        marginBottom: 8,
    },
    verifiedBadgeText: {
        fontSize: 11,
        fontFamily: fonts.semiBold,
        color: colors.white,
    },
    featuredLabel: {
        fontSize: 12,
        fontFamily: fonts.semiBold,
        color: '#FFD54F',
        marginBottom: 6,
    },
    specialtyBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        marginBottom: 6,
    },
    specialtyText: {
        fontSize: 13,
        fontFamily: fonts.semiBold,
        color: colors.white,
    },
    role: {
        fontSize: 12,
        fontFamily: fonts.medium,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    location: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 10,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    ratingStar: {
        fontSize: 18,
        color: '#FFD54F',
    },
    ratingValue: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.white,
    },
    ratingCount: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: 'rgba(255,255,255,0.7)',
    },
    editButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    editButtonText: {
        color: colors.white,
        fontSize: 14,
        fontFamily: fonts.semiBold,
    },
    section: {
        backgroundColor: colors.white,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    bioText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    contactIcon: {
        fontSize: 16,
    },
    contactText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },
    emptyReviews: {
        alignItems: 'center',
        padding: spacing.lg,
    },
    emptyReviewsIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyReviewsText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textMuted,
    },
    reviewCard: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    reviewStars: {
        fontSize: 16,
        color: '#F0A500',
        fontFamily: fonts.regular,
    },
    reviewStarsEmpty: {
        color: colors.border,
    },
    reviewDate: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textMuted,
    },
    reviewComment: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});