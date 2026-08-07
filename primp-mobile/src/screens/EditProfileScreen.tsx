import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, Image,
    ScrollView, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, getProfilePhotoUrl } from '../services/cloudinaryService';
import {
    initializePremiumPayment,
    verifyPremiumPayment,
    PremiumFeature,
    PremiumDuration,
} from '../services/premiumService';
import PaystackCheckout from '../components/PaystackCheckout';
import { validatePhone, validateLocation, validateRequired } from '../utils/validation';
import { colors, fonts, spacing, borderRadius } from '../theme';
import { changeAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n';

const SPECIALTIES = [
    'Braider',
    'Makeup Artist',
    'Barber',
    'Loctician',
    'Nail Technician',
    'Hair Stylist',
];

interface DurationOption {
    key: PremiumDuration;
    label: string;
    price: string;
}

interface PremiumFeatureConfig {
    key: PremiumFeature;
    title: string;
    description: string;
    icon: string;
    billing: 'ONE_TIME' | 'SUBSCRIPTION';
    durations: DurationOption[];
}

const PREMIUM_FEATURES: PremiumFeatureConfig[] = [
    {
        key: 'PRIORITY_LISTING',
        title: 'Priority Listing',
        description: 'Appear at the top of search results for your specialty and location.',
        icon: '⭐',
        billing: 'SUBSCRIPTION',
        durations: [
            { key: 'WEEKLY', label: 'Weekly', price: 'GH₵ 15.00' },
            { key: 'MONTHLY', label: 'Monthly', price: 'GH₵ 50.00' },
        ],
    },
    {
        key: 'EXTENDED_PORTFOLIO',
        title: 'Extended Portfolio',
        description: 'Unlock up to 50 portfolio photos instead of the standard 8.',
        icon: '🖼️',
        billing: 'ONE_TIME',
        durations: [{ key: 'ONE_TIME', label: 'One-time', price: 'GH₵ 30.00' }],
    },
    {
        key: 'VERIFIED_BADGE',
        title: 'Verified Skills Badge',
        description: 'Show a verified badge on your profile and in search results.',
        icon: '✓',
        billing: 'ONE_TIME',
        durations: [{ key: 'ONE_TIME', label: 'One-time', price: 'GH₵ 40.00' }],
    },
    {
        key: 'CLIENT_LOYALTY_TOOLS',
        title: 'Client Loyalty Tools',
        description: 'Send rebooking reminders and personalized offers to repeat clients.',
        icon: '🎟️',
        billing: 'SUBSCRIPTION',
        durations: [{ key: 'MONTHLY', label: 'Monthly', price: 'GH₵ 25.00' }],
    },
    {
        key: 'EARNINGS_ANALYTICS',
        title: 'Earnings Analytics',
        description: 'Revenue by month and service type, average booking value, and ratings.',
        icon: '📊',
        billing: 'SUBSCRIPTION',
        durations: [{ key: 'MONTHLY', label: 'Monthly', price: 'GH₵ 20.00' }],
    },
];

const formatExpiry = (iso?: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function EditProfileScreen({ navigation, route }: any) {
    const { t, i18n } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const [specialty, setSpecialty] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [specialtyError, setSpecialtyError] = useState('');
    const [locationError, setLocationError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

    const [isPriorityListingActive, setIsPriorityListingActive] = useState(false);
    const [hasExtendedPortfolio, setHasExtendedPortfolio] = useState(false);
    const [isVerifiedBadge, setIsVerifiedBadge] = useState(false);
    const [hasClientLoyaltyTools, setHasClientLoyaltyTools] = useState(false);
    const [hasEarningsAnalytics, setHasEarningsAnalytics] = useState(false);

    const [priorityListingExpiresAt, setPriorityListingExpiresAt] = useState<string | null>(null);
    const [clientLoyaltyToolsExpiresAt, setClientLoyaltyToolsExpiresAt] = useState<string | null>(null);
    const [earningsAnalyticsExpiresAt, setEarningsAnalyticsExpiresAt] = useState<string | null>(null);

    // ── Premium purchase modal state ────────────────────────
    const [premiumModalFeature, setPremiumModalFeature] = useState<PremiumFeatureConfig | null>(null);
    const [premiumStep, setPremiumStep] = useState<'duration' | 'email' | 'checkout' | 'processing'>('duration');
    const [premiumSelectedDuration, setPremiumSelectedDuration] = useState<DurationOption | null>(null);
    const [premiumEmail, setPremiumEmail] = useState('');
    const [premiumEmailError, setPremiumEmailError] = useState('');
    const [premiumLoading, setPremiumLoading] = useState(false);
    const [premiumCheckoutData, setPremiumCheckoutData] = useState<{
        reference: string; publicKey: string; amount: number; currency: string; email: string;
    } | null>(null);

    const [workLatitude, setWorkLatitude] = useState<number | undefined>(undefined);
    const [workLongitude, setWorkLongitude] = useState<number | undefined>(undefined);
    const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(15);

    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [])
    );

    useFocusEffect(
        React.useCallback(() => {
            const saved = route.params?.savedWorkLocation;
            if (saved) {
                setWorkLatitude(saved.latitude);
                setWorkLongitude(saved.longitude);
                setServiceRadiusKm(saved.serviceRadiusKm);
                navigation.setParams({ savedWorkLocation: undefined });
            }
        }, [route.params?.savedWorkLocation])
    );

    const loadProfile = async () => {
        try {
            const response = await api.get(`/api/auth/profile/${user?.id}`);
            const profile = response.data;
            if (profile.specialty) setSpecialty(profile.specialty);
            if (profile.bio) setBio(profile.bio);
            if (profile.location) setLocation(profile.location);
            if (profile.phone) setPhone(profile.phone);
            if (profile.profilePhotoUrl) setCurrentPhotoUrl(profile.profilePhotoUrl);
            if (profile.isAvailable !== undefined) setIsAvailable(profile.isAvailable);
            if (profile.workLatitude != null) setWorkLatitude(profile.workLatitude);
            if (profile.workLongitude != null) setWorkLongitude(profile.workLongitude);
            if (profile.serviceRadiusKm != null) setServiceRadiusKm(profile.serviceRadiusKm);
            setIsPriorityListingActive(!!profile.isPriorityListingActive);
            setHasExtendedPortfolio(!!profile.hasExtendedPortfolio);
            setIsVerifiedBadge(!!profile.isVerifiedBadge);
            setHasClientLoyaltyTools(!!profile.hasClientLoyaltyTools);
            setHasEarningsAnalytics(!!profile.hasEarningsAnalytics);
            setPriorityListingExpiresAt(profile.priorityListingExpiresAt ?? null);
            setClientLoyaltyToolsExpiresAt(profile.clientLoyaltyToolsExpiresAt ?? null);
            setEarningsAnalyticsExpiresAt(profile.earningsAnalyticsExpiresAt ?? null);
        } catch (error) {
            console.log('Failed to load profile');
        }
    };

    const handleSave = async () => {
        const locationErr = validateLocation(location);
        const phoneErr = validatePhone(phone);
        const specialtyErr = user?.role === 'PROFESSIONAL'
            ? validateRequired(specialty, 'Specialty')
            : null;

        setSpecialtyError(specialtyErr || '');
        setLocationError(locationErr || '');
        setPhoneError(phoneErr || '');

        if (specialtyErr || locationErr || phoneErr) return;

        setLoading(true);
        try {
            let photoUrl = currentPhotoUrl;
            if (profilePhoto) {
                const uploaded = await uploadImage(profilePhoto);
                photoUrl = getProfilePhotoUrl(uploaded);
            }

            await api.put(`/api/auth/profile/${user?.id}`, {
                specialty,
                bio,
                location,
                phone,
                profilePhotoUrl: photoUrl,
                isAvailable,
                workLatitude,
                workLongitude,
                serviceRadiusKm,
            });
            Alert.alert('Success', 'Profile updated!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const pickProfilePhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow access to your photo library');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setProfilePhoto(result.assets[0].uri);
        }
    };

    const handleLanguageSwitch = async (lang: SupportedLanguage) => {
        if (i18n.language === lang) return;
        await changeAppLanguage(lang);
    };

    const isFeatureActive = (feature: PremiumFeature) => {
        if (feature === 'PRIORITY_LISTING') return isPriorityListingActive;
        if (feature === 'EXTENDED_PORTFOLIO') return hasExtendedPortfolio;
        if (feature === 'VERIFIED_BADGE') return isVerifiedBadge;
        if (feature === 'CLIENT_LOYALTY_TOOLS') return hasClientLoyaltyTools;
        return hasEarningsAnalytics;
    };

    const getExpiry = (feature: PremiumFeature) => {
        if (feature === 'PRIORITY_LISTING') return priorityListingExpiresAt;
        if (feature === 'CLIENT_LOYALTY_TOOLS') return clientLoyaltyToolsExpiresAt;
        if (feature === 'EARNINGS_ANALYTICS') return earningsAnalyticsExpiresAt;
        return null;
    };

    // ── Premium purchase flow (real Paystack payment) ───────────
    const resetPremiumModal = () => {
        setPremiumModalFeature(null);
        setPremiumSelectedDuration(null);
        setPremiumCheckoutData(null);
        setPremiumStep('duration');
        setPremiumEmail('');
        setPremiumEmailError('');
    };

    const handlePurchase = (feature: PremiumFeatureConfig) => {
        setPremiumModalFeature(feature);
        if (feature.durations.length === 1) {
            setPremiumSelectedDuration(feature.durations[0]);
            setPremiumStep('email');
        } else {
            setPremiumSelectedDuration(null);
            setPremiumStep('duration');
        }
        setPremiumEmail('');
        setPremiumEmailError('');
        setPremiumCheckoutData(null);
    };

    const handleSelectDuration = (option: DurationOption) => {
        setPremiumSelectedDuration(option);
        setPremiumStep('email');
    };

    const handleStartPremiumCheckout = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!premiumEmail.trim() || !emailRegex.test(premiumEmail.trim())) {
            setPremiumEmailError('Please enter a valid email address');
            return;
        }
        if (!premiumModalFeature || !premiumSelectedDuration) return;

        setPremiumLoading(true);
        try {
            const result = await initializePremiumPayment(
                premiumModalFeature.key,
                premiumEmail.trim(),
                premiumSelectedDuration.key
            );
            setPremiumCheckoutData({
                reference: result.reference,
                publicKey: result.publicKey,
                amount: result.amount,
                currency: result.currency,
                email: result.email,
            });
            setPremiumStep('checkout');
        } catch (error) {
            Alert.alert('Error', 'Failed to start payment. Please try again.');
        } finally {
            setPremiumLoading(false);
        }
    };

    const handlePremiumCheckoutSuccess = async (reference: string) => {
        setPremiumStep('processing');
        try {
            const result = await verifyPremiumPayment(reference);
            setIsPriorityListingActive(!!result.isPriorityListingActive);
            setHasExtendedPortfolio(!!result.hasExtendedPortfolio);
            setIsVerifiedBadge(!!result.isVerifiedBadge);
            setHasClientLoyaltyTools(!!result.hasClientLoyaltyTools);
            setHasEarningsAnalytics(!!result.hasEarningsAnalytics);
            setPriorityListingExpiresAt(result.priorityListingExpiresAt ?? null);
            setClientLoyaltyToolsExpiresAt(result.clientLoyaltyToolsExpiresAt ?? null);
            setEarningsAnalyticsExpiresAt(result.earningsAnalyticsExpiresAt ?? null);
            const title = premiumModalFeature?.title;
            resetPremiumModal();
            Alert.alert('Unlocked', `${title} is now active on your profile.`);
        } catch (error) {
            resetPremiumModal();
            Alert.alert(
                'Payment Verification Failed',
                "We couldn't confirm your payment. If you were charged, contact support with reference " + reference
            );
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

                {/* Avatar */}
                <View style={styles.profileCenter}>
                    <TouchableOpacity onPress={pickProfilePhoto} style={styles.avatarWrapper}>
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                        ) : currentPhotoUrl ? (
                            <Image source={{ uri: currentPhotoUrl }} style={styles.profilePhoto} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Text style={styles.photoPlaceholderText}>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.photoEditBadge}>
                            <Text style={styles.photoEditText}>📷</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.photoHint}>{t('editProfile.changePhoto')}</Text>
                </View>

                {/* Back button — pinned to top-left inside the header */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← {t('common.back')}</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* ── Scrollable Body ── */}
            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled">

                <Text style={styles.title}>{t('editProfile.title')}</Text>

                {/* Language selector */}
                <Text style={styles.label}>{t('common.language')}</Text>
                <View style={styles.languageRow}>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang}
                            style={[
                                styles.languageButton,
                                i18n.language === lang && styles.languageActive,
                            ]}
                            onPress={() => handleLanguageSwitch(lang)}>
                            <Text style={[
                                styles.languageText,
                                i18n.language === lang && styles.languageTextActive,
                            ]}>
                                {t(`language_names.${lang}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {user?.role === 'PROFESSIONAL' && (
                    <>
                        <Text style={styles.label}>{t('editProfile.specialty')}</Text>
                        <View style={styles.specialtyGrid}>
                            {SPECIALTIES.map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.specialtyButton,
                                        specialty === s && styles.specialtyActive,
                                    ]}
                                    onPress={() => setSpecialty(s)}>
                                    <Text style={[
                                        styles.specialtyText,
                                        specialty === s && styles.specialtyTextActive,
                                    ]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {specialtyError ? (
                            <Text style={styles.errorText}>{specialtyError}</Text>
                        ) : null}

                        <Text style={styles.label}>{t('editProfile.bio')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('editProfile.bioPlaceholder') as string}
                            placeholderTextColor={colors.textMuted}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.label}>{t('editProfile.availability')}</Text>
                                <Text style={styles.toggleSubtitle}>
                                    {isAvailable
                                        ? t('editProfile.availableTrue')
                                        : t('editProfile.availableFalse')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.toggle, isAvailable && styles.toggleActive]}
                                onPress={() => setIsAvailable(!isAvailable)}>
                                <View style={[
                                    styles.toggleThumb,
                                    isAvailable && styles.toggleThumbActive,
                                ]} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Work Location</Text>
                        <TouchableOpacity
                            style={styles.workLocationCard}
                            onPress={() => navigation.navigate('WorkLocation', {
                                latitude: workLatitude,
                                longitude: workLongitude,
                                serviceRadiusKm,
                            })}>
                            <Text style={styles.workLocationIcon}>📍</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.workLocationTitle}>
                                    {workLatitude != null && workLongitude != null
                                        ? 'Pin set'
                                        : 'Set your work location'}
                                </Text>
                                <Text style={styles.workLocationSubtitle}>
                                    {workLatitude != null && workLongitude != null
                                        ? `${serviceRadiusKm} km service radius · tap to update`
                                        : 'Helps clients discover you on the map'}
                                </Text>
                            </View>
                            <Text style={styles.workLocationArrow}>›</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Premium Features</Text>
                        {PREMIUM_FEATURES.map((feature) => {
                            const active = isFeatureActive(feature.key);
                            const expiry = getExpiry(feature.key);
                            const cheapestPrice = feature.durations[0].price;
                            return (
                                <View key={feature.key} style={styles.premiumCard}>
                                    <View style={styles.premiumIconWrap}>
                                        <Text style={styles.premiumIcon}>{feature.icon}</Text>
                                    </View>
                                    <View style={styles.premiumInfo}>
                                        <Text style={styles.premiumTitle}>{feature.title}</Text>
                                        <Text style={styles.premiumDescription}>{feature.description}</Text>
                                        {active && feature.billing === 'SUBSCRIPTION' && expiry ? (
                                            <Text style={styles.premiumExpiry}>
                                                Renews / expires {formatExpiry(expiry)}
                                            </Text>
                                        ) : !active ? (
                                            <Text style={styles.premiumPrice}>
                                                {feature.billing === 'SUBSCRIPTION'
                                                    ? `From ${cheapestPrice}`
                                                    : cheapestPrice}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {active ? (
                                        feature.billing === 'SUBSCRIPTION' ? (
                                            <TouchableOpacity
                                                style={styles.premiumRenewButton}
                                                onPress={() => handlePurchase(feature)}>
                                                <Text style={styles.premiumRenewText}>Renew</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.premiumActiveBadge}>
                                                <Text style={styles.premiumActiveText}>Active</Text>
                                            </View>
                                        )
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.premiumUnlockButton}
                                            onPress={() => handlePurchase(feature)}>
                                            <Text style={styles.premiumUnlockText}>Unlock</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}

                        <View style={styles.premiumLinksRow}>
                            {hasClientLoyaltyTools && (
                                <TouchableOpacity
                                    style={styles.premiumLink}
                                    onPress={() => navigation.navigate('Loyalty')}>
                                    <Text style={styles.premiumLinkText}>🎟️ Client Loyalty →</Text>
                                </TouchableOpacity>
                            )}
                            {hasEarningsAnalytics && (
                                <TouchableOpacity
                                    style={styles.premiumLink}
                                    onPress={() => navigation.navigate('Analytics')}>
                                    <Text style={styles.premiumLinkText}>📊 Analytics →</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                <Text style={styles.label}>{t('editProfile.location')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Accra, East Legon"
                    placeholderTextColor={colors.textMuted}
                    value={location}
                    onChangeText={setLocation}
                />
                {locationError ? (
                    <Text style={styles.errorText}>{locationError}</Text>
                ) : null}

                <Text style={styles.label}>{t('editProfile.phone')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 0244123456"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                {phoneError ? (
                    <Text style={styles.errorText}>{phoneError}</Text>
                ) : null}

                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}>
                    {loading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
                </TouchableOpacity>

            </ScrollView>

            {/* ── Premium unlock / renew modal ── */}
            <Modal
                visible={!!premiumModalFeature}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    if (premiumStep !== 'processing') resetPremiumModal();
                }}>
                {premiumStep === 'checkout' && premiumCheckoutData ? (
                    <PaystackCheckout
                        visible
                        publicKey={premiumCheckoutData.publicKey}
                        email={premiumCheckoutData.email}
                        amount={premiumCheckoutData.amount}
                        currency={premiumCheckoutData.currency}
                        reference={premiumCheckoutData.reference}
                        onSuccess={handlePremiumCheckoutSuccess}
                        onClose={() => setPremiumStep(premiumSelectedDuration && premiumModalFeature && premiumModalFeature.durations.length > 1 ? 'duration' : 'email')}
                    />
                ) : (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalSheet}>
                            {premiumStep === 'processing' ? (
                                <View style={styles.processingWrap}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.processingText}>Confirming payment...</Text>
                                </View>
                            ) : premiumStep === 'duration' && premiumModalFeature ? (
                                <>
                                    <Text style={styles.modalTitle}>
                                        {premiumModalFeature.title}
                                    </Text>
                                    <Text style={styles.cardHint}>Choose your billing period</Text>
                                    {premiumModalFeature.durations.map((option) => (
                                        <TouchableOpacity
                                            key={option.key}
                                            style={styles.durationOption}
                                            onPress={() => handleSelectDuration(option)}>
                                            <Text style={styles.durationLabel}>{option.label}</Text>
                                            <Text style={styles.durationPrice}>{option.price}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity style={styles.modalCancel} onPress={resetPremiumModal}>
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.modalTitle}>
                                        Unlock {premiumModalFeature?.title}
                                    </Text>
                                    <Text style={styles.cardHint}>
                                        Pay {premiumSelectedDuration?.price}
                                        {premiumModalFeature?.billing === 'SUBSCRIPTION'
                                            ? ` (${premiumSelectedDuration?.label.toLowerCase()}, renews manually)`
                                            : ''} via Paystack (card, Mobile Money, or bank)
                                        to activate this feature.
                                    </Text>
                                    <TextInput
                                        style={[styles.input, premiumEmailError ? styles.inputError : null]}
                                        placeholder="e.g. you@example.com"
                                        placeholderTextColor={colors.textMuted}
                                        value={premiumEmail}
                                        onChangeText={(t2) => {
                                            setPremiumEmail(t2);
                                            if (premiumEmailError) setPremiumEmailError('');
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {premiumEmailError ? (
                                        <Text style={styles.errorText}>{premiumEmailError}</Text>
                                    ) : null}
                                    <TouchableOpacity
                                        style={[styles.saveButton, premiumLoading && { opacity: 0.7 }]}
                                        onPress={handleStartPremiumCheckout}
                                        disabled={premiumLoading}>
                                        {premiumLoading ? (
                                            <ActivityIndicator color={colors.white} />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Continue to Paystack</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalCancel}
                                        onPress={() =>
                                            premiumModalFeature && premiumModalFeature.durations.length > 1
                                                ? setPremiumStep('duration')
                                                : resetPremiumModal()
                                        }>
                                        <Text style={styles.modalCancelText}>
                                            {premiumModalFeature && premiumModalFeature.durations.length > 1 ? 'Back' : 'Cancel'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                )}
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    // ── Header ──────────────────────────────────────────────
    header: {
        paddingTop: 52,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 52,
        left: spacing.lg,
        alignSelf: 'flex-start',
    },
    backText: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: 15,
    },
    profileCenter: {
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    profilePhoto: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: colors.white,
    },
    photoPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.white,
    },
    photoPlaceholderText: {
        fontSize: 38,
        fontFamily: fonts.bold,
        color: colors.primary,
    },
    photoEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.white,
        borderRadius: borderRadius.full,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    photoEditText: {
        fontSize: 15,
    },
    photoHint: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.primaryLight,
        marginTop: spacing.sm,
    },

    // ── Body ─────────────────────────────────────────────────
    body: {
        flexGrow: 1,
        padding: spacing.lg,
        backgroundColor: colors.background,
        paddingBottom: spacing.xxl,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    label: {
        fontFamily: fonts.semiBold,
        fontSize: 13,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },

    // ── Language selector ─────────────────────────────────────
    languageRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: spacing.md,
    },
    languageButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    languageActive: {
        backgroundColor: colors.primary,
    },
    languageText: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.primary,
    },
    languageTextActive: {
        color: colors.white,
    },

    // ── Specialty pills ───────────────────────────────────────
    specialtyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: spacing.md,
    },
    specialtyButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
        marginBottom: spacing.xs,
    },
    specialtyActive: {
        backgroundColor: colors.primary,
    },
    specialtyText: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.primary,
    },
    specialtyTextActive: {
        color: colors.white,
    },

    // ── Inputs ───────────────────────────────────────────────
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.md - 2,
        marginBottom: spacing.md,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        backgroundColor: colors.card,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        fontFamily: fonts.regular,
        color: colors.error,
        fontSize: 12,
        marginTop: -spacing.sm,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },

    // ── Availability toggle ───────────────────────────────────
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleSubtitle: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.border,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleActive: {
        backgroundColor: colors.success,
    },
    toggleThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },

    // ── Premium features ───────────────────────────────────────
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md - 2,
        marginBottom: spacing.sm,
    },
    premiumIconWrap: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm + 2,
    },
    premiumIcon: {
        fontSize: 18,
    },
    premiumInfo: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    premiumTitle: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    premiumDescription: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 15,
    },
    premiumPrice: {
        fontFamily: fonts.semiBold,
        fontSize: 12,
        color: colors.primary,
        marginTop: 4,
    },
    premiumExpiry: {
        fontFamily: fonts.medium,
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 4,
    },
    premiumUnlockButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        minWidth: 72,
        alignItems: 'center',
    },
    premiumUnlockText: {
        fontFamily: fonts.semiBold,
        fontSize: 12,
        color: colors.white,
    },
    premiumRenewButton: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        minWidth: 72,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    premiumRenewText: {
        fontFamily: fonts.semiBold,
        fontSize: 12,
        color: colors.primary,
    },
    premiumActiveBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    premiumActiveText: {
        fontFamily: fonts.semiBold,
        fontSize: 12,
        color: colors.success,
    },
    premiumLinksRow: {
        flexDirection: 'row',
        gap: spacing.md,
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    premiumLink: {
        paddingVertical: spacing.sm,
    },
    premiumLinkText: {
        fontFamily: fonts.semiBold,
        fontSize: 13,
        color: colors.primary,
    },
    workLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md - 2,
        marginBottom: spacing.md,
    },
    workLocationIcon: { fontSize: 22, marginRight: spacing.sm + 2 },
    workLocationTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 2 },
    workLocationSubtitle: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
    workLocationArrow: { fontSize: 22, color: colors.textMuted, fontFamily: fonts.bold },

    // ── Save button ───────────────────────────────────────────
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    saveButtonText: {
        fontFamily: fonts.bold,
        color: colors.white,
        fontSize: 16,
    },

    // ── Premium unlock modal ───────────────────────────────────
    cardHint: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    modalTitle: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    durationOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.sm,
    },
    durationLabel: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    durationPrice: {
        fontFamily: fonts.bold,
        fontSize: 14,
        color: colors.primary,
    },
    modalCancel: {
        alignItems: 'center',
        padding: spacing.md,
    },
    modalCancelText: {
        color: colors.textMuted,
        fontFamily: fonts.medium,
        fontSize: 14,
    },
    processingWrap: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.md,
    },
    processingText: {
        fontFamily: fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
});