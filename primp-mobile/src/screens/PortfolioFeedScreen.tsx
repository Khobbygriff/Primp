import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
    Image, RefreshControl, Dimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';
import { getPortfolioFeed, PortfolioPost, deletePortfolioPost } from '../services/portfolioService';
import { optimizeUrl } from '../services/cloudinaryService';
import { colors, fonts, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

function VideoPost({ url }: { url: string }) {
    const player = useVideoPlayer(url, (p) => {
        p.loop = true;
    });

    return (
        <VideoView
            player={player}
            style={{ width, height: width * 0.75 }}
            contentFit="cover"
            nativeControls
        />
    );
}

export default function PortfolioFeedScreen({ navigation }: any) {
    const [posts, setPosts] = useState<PortfolioPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTag, setSelectedTag] = useState('All');
    const [search, setSearch] = useState('');
    const user = useAuthStore((state) => state.user);

    const tags = ['All', ...Array.from(new Set(posts.map(p => p.styleTag).filter(Boolean)))];

    const filtered = posts.filter(p => {
        const matchesTag = selectedTag === 'All' || p.styleTag === selectedTag;
        const matchesSearch = !search.trim() ||
            p.professionalName?.toLowerCase().includes(search.toLowerCase()) ||
            p.styleTag?.toLowerCase().includes(search.toLowerCase()) ||
            p.caption?.toLowerCase().includes(search.toLowerCase());
        return matchesTag && matchesSearch;
    });

    useFocusEffect(
        React.useCallback(() => {
            loadFeed();
        }, [])
    );

    const loadFeed = async () => {
        try {
            const data = await getPortfolioFeed();
            setPosts(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load portfolio feed');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFeed();
        setRefreshing(false);
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

            {/* ── Gradient Header ── */}
            <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}>
                <Text style={styles.headerTitle}>Portfolio Feed</Text>
                <Text style={styles.headerSubtitle}>Latest work from our professionals</Text>
            </LinearGradient>

            {/* ── Search ── */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍  Search by name, style or caption..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* ── Style tag filter chips ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}>
                {tags.map((tag) => (
                    <TouchableOpacity
                        key={tag}
                        style={[styles.filterChip, selectedTag === tag && styles.filterChipActive]}
                        onPress={() => setSelectedTag(tag)}>
                        <Text style={[
                            styles.filterChipText,
                            selectedTag === tag && styles.filterChipTextActive,
                        ]}>
                            {tag}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ── Feed ── */}
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                    />
                }>
                {filtered.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📸</Text>
                        <Text style={styles.emptyText}>No posts yet</Text>
                        <Text style={styles.emptySubtext}>
                            Professionals will post their work here
                        </Text>
                    </View>
                ) : (
                    filtered.map((post) => (
                        <View key={post.id} style={styles.card}>

                            {/* Card header — avatar + name + action button */}
                            <TouchableOpacity
                                style={styles.cardHeader}
                                onPress={() => navigation.navigate('ViewProfile', { userId: post.professionalId })}>
                                {post.professionalPhotoUrl ? (
                                    <Image
                                        source={{ uri: post.professionalPhotoUrl }}
                                        style={styles.avatarPhoto}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {post.professionalName?.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.proInfo}>
                                    <Text style={styles.proName}>{post.professionalName}</Text>
                                    {post.specialty && (
                                        <Text style={styles.proSpecialty}>💼 {post.specialty}</Text>
                                    )}
                                </View>

                                {user?.role === 'PROFESSIONAL' && post.professionalId === user?.id ? (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => {
                                            Alert.alert(
                                                'Delete Post',
                                                'Are you sure you want to delete this post?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Delete',
                                                        style: 'destructive',
                                                        onPress: async () => {
                                                            try {
                                                                await deletePortfolioPost(post.id);
                                                                loadFeed();
                                                            } catch {
                                                                Alert.alert('Error', 'Failed to delete post');
                                                            }
                                                        },
                                                    },
                                                ]
                                            );
                                        }}>
                                        <Text style={styles.actionButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.bookButton}
                                        onPress={() => navigation.navigate('Booking', {
                                            professionalId: post.professionalId,
                                            professionalName: post.professionalName,
                                            specialty: post.specialty,
                                        })}>
                                        <Text style={styles.actionButtonText}>Book</Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>

                            {/* Media */}
                            {post.mediaType === 'video' ? (
                                <VideoPost url={post.imageUrl} />
                            ) : (
                                <Image
                                    source={{ uri: optimizeUrl(post.imageUrl) }}
                                    style={styles.postImage}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Footer */}
                            <View style={styles.cardFooter}>
                                <View style={styles.badgeRow}>
                                    {post.mediaType === 'video' && (
                                        <View style={styles.videoBadge}>
                                            <Text style={styles.videoBadgeText}>🎥 Video</Text>
                                        </View>
                                    )}
                                    {post.styleTag && (
                                        <View style={styles.tagBadge}>
                                            <Text style={styles.tagBadgeText}>#{post.styleTag}</Text>
                                        </View>
                                    )}
                                </View>
                                {post.caption && (
                                    <Text style={styles.caption}>{post.caption}</Text>
                                )}
                                <Text style={styles.timeText}>
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </Text>
                            </View>

                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({

    // ── Shell ─────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Header ───────────────────────────────────────────────
    header: {
        paddingTop: 52,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    headerTitle: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.white,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.primaryLight,
    },

    // ── Search ───────────────────────────────────────────────
    searchContainer: {
        padding: spacing.md - 4,
        backgroundColor: colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
    },
    searchInput: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textPrimary,
    },

    // ── Filter chips ─────────────────────────────────────────
    filterRow: {
        backgroundColor: colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        flexGrow: 0,
    },
    filterContent: {
        paddingHorizontal: spacing.md - 4,
        paddingVertical: spacing.sm + 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm - 1,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.primary,
        marginHorizontal: 4,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterChipText: {
        fontFamily: fonts.medium,
        color: colors.primary,
        fontSize: 13,
    },
    filterChipTextActive: {
        color: colors.white,
    },

    // ── Empty state ───────────────────────────────────────────
    empty: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontFamily: fonts.semiBold,
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },

    // ── Card ─────────────────────────────────────────────────
    card: {
        backgroundColor: colors.card,
        marginBottom: spacing.sm + 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md - 2,
    },
    avatarPhoto: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginRight: spacing.sm + 2,
    },
    avatarPlaceholder: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm + 2,
    },
    avatarText: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.white,
    },
    proInfo: {
        flex: 1,
    },
    proName: {
        fontFamily: fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    proSpecialty: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.primary,
        marginTop: 2,
    },
    bookButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm - 1,
        borderRadius: borderRadius.full,
    },
    deleteButton: {
        backgroundColor: colors.error,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm - 1,
        borderRadius: borderRadius.full,
    },
    actionButtonText: {
        fontFamily: fonts.semiBold,
        color: colors.white,
        fontSize: 13,
    },

    // ── Post media ────────────────────────────────────────────
    postImage: {
        width,
        height: width * 0.75,
    },

    // ── Card footer ───────────────────────────────────────────
    cardFooter: {
        padding: spacing.md - 2,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
        flexWrap: 'wrap',
    },
    videoBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    videoBadgeText: {
        fontFamily: fonts.medium,
        color: colors.white,
        fontSize: 12,
    },
    tagBadge: {
        backgroundColor: '#FFF0F5',
        paddingHorizontal: spacing.md - 4,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    tagBadgeText: {
        fontFamily: fonts.medium,
        color: colors.primary,
        fontSize: 13,
    },
    caption: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.xs,
    },
    timeText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
    },
});