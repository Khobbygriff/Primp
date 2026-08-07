import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    ScrollView, KeyboardAvoidingView, Platform,
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { uploadImage, uploadVideo } from '../services/cloudinaryService';
import { createPortfolioPost } from '../services/portfolioService';
import { colors, fonts, spacing, borderRadius } from '../theme';

const SERVICE_TYPES: Record<string, string[]> = {
    'Braider': ['Box Braids', 'Knotless Braids', 'Senegalese Twists', 'Cornrows', 'Goddess Braids', 'Fulani Braids', 'Other'],
    'Makeup Artist': ['Full Glam', 'Natural Makeup', 'Bridal Makeup', 'Editorial Makeup', 'Evening Makeup', 'Other'],
    'Barber': ['Skin Fade', 'Taper Fade', 'Haircut & Beard', 'Line Up', 'Shave', 'Other'],
    'Loctician': ['Loc Retwist', 'Loc Installation', 'Loc Extensions', 'Loc Repair', 'Freeform Locs', 'Other'],
    'Nail Technician': ['Acrylic Nails', 'Gel Nails', 'Nail Art', 'Manicure', 'Pedicure', 'Dip Powder', 'Other'],
    'Hair Stylist': ['Hair Relaxer', 'Hair Coloring', 'Blowout', 'Hair Treatment', 'Trim', 'Other'],
};

const DEFAULT_TAGS = ['Braids', 'Makeup', 'Hair', 'Nails', 'Beard', 'Locs', 'Other'];

export default function AddPortfolioScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [styleTag, setStyleTag] = useState('');
    const [customTag, setCustomTag] = useState('');
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [specialty, setSpecialty] = useState('');

    useEffect(() => {
        fetchSpecialty();
    }, []);

    const fetchSpecialty = async () => {
        try {
            const response = await api.get(`/api/auth/profile/${user?.id}`);
            setSpecialty(response.data.specialty || '');
        } catch (error) {
            console.log('Failed to fetch specialty');
        }
    };

    const STYLE_TAGS = specialty && SERVICE_TYPES[specialty]
        ? SERVICE_TYPES[specialty]
        : DEFAULT_TAGS;

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow access to your photo library');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) {
            setMediaUri(result.assets[0].uri);
            setMediaType('image');
        }
    };

    const pickVideo = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow access to your photo library');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            videoMaxDuration: 60,
            quality: 0.8,
        });
        if (!result.canceled) {
            setMediaUri(result.assets[0].uri);
            setMediaType('video');
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow access to your camera');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) {
            setMediaUri(result.assets[0].uri);
            setMediaType('image');
        }
    };

    const handlePost = async () => {
        if (!mediaUri) {
            Alert.alert('Error', 'Please select a photo or video');
            return;
        }
        if (!styleTag) {
            Alert.alert('Error', 'Please select a style tag');
            return;
        }
        const finalTag = styleTag === 'Other' ? customTag.trim() : styleTag;
        if (!finalTag) {
            Alert.alert('Error', 'Please describe the style');
            return;
        }

        setUploading(true);
        try {
            let mediaUrl: string;
            if (mediaType === 'video') {
                mediaUrl = await uploadVideo(mediaUri);
            } else {
                mediaUrl = await uploadImage(mediaUri);
            }
            await createPortfolioPost(mediaUrl, finalTag, caption, mediaType);
            Alert.alert('Success', 'Portfolio post added!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to upload post. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {/* ── Gradient Header ── */}
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
                <Text style={styles.headerTitle}>Add Portfolio Post</Text>
                <Text style={styles.headerSubtitle}>Show off your best work</Text>
            </LinearGradient>

            {/* ── Scrollable Body ── */}
            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled">

                {/* Media picker */}
                <Text style={styles.label}>Media *</Text>
                {mediaUri ? (
                    <View>
                        {mediaType === 'image' ? (
                            <Image source={{ uri: mediaUri }} style={styles.preview} />
                        ) : (
                            <View style={styles.videoPreview}>
                                <Text style={styles.videoIcon}>🎥</Text>
                                <Text style={styles.videoText}>Video selected</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.changeMedia}
                            onPress={pickImage}>
                            <Text style={styles.changeMediaText}>Change Media</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.mediaButtons}>
                        <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                            <Text style={styles.mediaIcon}>🖼️</Text>
                            <Text style={styles.mediaButtonText}>Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
                            <Text style={styles.mediaIcon}>🎥</Text>
                            <Text style={styles.mediaButtonText}>Video</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                            <Text style={styles.mediaIcon}>📷</Text>
                            <Text style={styles.mediaButtonText}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Style tags */}
                <Text style={styles.label}>Style Tag *</Text>
                <View style={styles.tagGrid}>
                    {STYLE_TAGS.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tagButton,
                                styleTag === tag && styles.tagActive,
                            ]}
                            onPress={() => {
                                setStyleTag(tag);
                                if (tag !== 'Other') setCustomTag('');
                            }}>
                            <Text style={[
                                styles.tagText,
                                styleTag === tag && styles.tagTextActive,
                            ]}>
                                {tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {styleTag === 'Other' && (
                    <>
                        <Text style={styles.label}>Describe the style *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Ghana Weaving, TWA, Bantu Knots..."
                            placeholderTextColor={colors.textMuted}
                            value={customTag}
                            onChangeText={setCustomTag}
                        />
                    </>
                )}

                {/* Caption */}
                <Text style={styles.label}>Caption</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe this look..."
                    placeholderTextColor={colors.textMuted}
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                />
                <Text style={styles.charCount}>{caption.length}/200</Text>

                <TouchableOpacity
                    style={[styles.postButton, uploading && { opacity: 0.7 }]}
                    onPress={handlePost}
                    disabled={uploading}>
                    {uploading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.postButtonText}>Post to Portfolio</Text>}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    // ── Header ──────────────────────────────────────────────
    header: {
        paddingTop: 52,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: spacing.sm,
    },
    backText: {
        color: colors.primaryLight,
        fontFamily: fonts.medium,
        fontSize: 15,
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

    // ── Body ─────────────────────────────────────────────────
    body: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    label: {
        fontFamily: fonts.semiBold,
        fontSize: 13,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },

    // ── Media picker ─────────────────────────────────────────
    mediaButtons: {
        flexDirection: 'row',
        gap: spacing.sm + 2,
        marginBottom: spacing.sm,
    },
    mediaButton: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        borderStyle: 'dashed',
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.card,
    },
    mediaIcon: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    mediaButtonText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    preview: {
        width: '100%',
        height: 220,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    videoPreview: {
        width: '100%',
        height: 140,
        borderRadius: borderRadius.md,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    videoIcon: {
        fontSize: 40,
        marginBottom: spacing.sm,
    },
    videoText: {
        fontFamily: fonts.medium,
        color: colors.white,
        fontSize: 14,
    },
    changeMedia: {
        alignItems: 'center',
        padding: spacing.sm,
        marginBottom: spacing.sm,
    },
    changeMediaText: {
        fontFamily: fonts.medium,
        color: colors.primary,
        fontSize: 14,
    },

    // ── Style tags ────────────────────────────────────────────
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    tagButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    tagActive: {
        backgroundColor: colors.primary,
    },
    tagText: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.primary,
    },
    tagTextActive: {
        color: colors.white,
    },

    // ── Input ─────────────────────────────────────────────────
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.md - 2,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        backgroundColor: colors.card,
        marginBottom: spacing.sm,
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
    },
    charCount: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'right',
        marginBottom: spacing.sm,
    },

    // ── Post button ───────────────────────────────────────────
    postButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    postButtonText: {
        fontFamily: fonts.bold,
        color: colors.white,
        fontSize: 16,
    },
});