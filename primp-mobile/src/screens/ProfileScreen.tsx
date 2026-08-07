import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getRatingSummary, getReviewsForUser, Review, RatingSummary } from '../services/reviewService';

export default function ProfileScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const userId = useAuthStore.getState().user?.id ?? 0;
            const [summary, reviewList] = await Promise.all([
                getRatingSummary(userId),
                getReviewsForUser(userId),
            ]);
            setRatingSummary(summary);
            setReviews(reviewList);
        } catch (error) {
            // Profile loads without reviews if none exist
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#C2185B" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.role}>{user?.role}</Text>

                {ratingSummary && (
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingValue}>
                            ★ {ratingSummary.averageRating}
                        </Text>
                        <Text style={styles.ratingCount}>
                            ({ratingSummary.totalReviews} reviews)
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {reviews.length === 0 ? (
                    <Text style={styles.emptyText}>No reviews yet</Text>
                ) : (
                    reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewStars}>
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
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

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#C2185B',
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    backText: {
        color: '#f8bbd9',
        fontSize: 16,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: '#f8bbd9',
        marginBottom: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ratingValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F0A500',
    },
    ratingCount: {
        fontSize: 14,
        color: '#f8bbd9',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A2E',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        padding: 20,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reviewStars: {
        fontSize: 16,
        color: '#F0A500',
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
    },
    reviewComment: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    logoutButton: {
        margin: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E24B4A',
    },
    logoutText: {
        color: '#E24B4A',
        fontSize: 16,
        fontWeight: '600',
    },
});