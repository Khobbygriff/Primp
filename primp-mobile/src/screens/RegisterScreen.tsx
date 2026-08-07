import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { register } from '../services/authService';
import { validateEmail, validatePassword, validateName, validatePhone, validateLocation } from '../utils/validation';
import { colors, fonts, spacing, borderRadius } from '../theme';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [role, setRole] = useState<'CLIENT' | 'PROFESSIONAL'>('CLIENT');
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [locationError, setLocationError] = useState('');
    const loginStore = useAuthStore((state) => state.login);

    const handleRegister = async () => {
        const nameErr = validateName(name);
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        const phoneErr = validatePhone(phone);
        const locationErr = validateLocation(location);

        setNameError(nameErr || '');
        setEmailError(emailErr || '');
        setPasswordError(passwordErr || '');
        setPhoneError(phoneErr || '');
        setLocationError(locationErr || '');

        if (nameErr || emailErr || passwordErr || phoneErr || locationErr) return;

        setLoading(true);
        try {
            const response = await register({ name, email, password, phone, location, role });
            loginStore({
                id: response.id,
                name: response.name,
                role: response.role,
                token: response.token,
                profilePhotoUrl: response.profilePhotoUrl,
            });
        } catch (error: any) {
            Alert.alert('Registration Failed', 'Email may already be registered');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled">

                <LinearGradient
                    colors={[colors.primaryDark, colors.primary, '#E91E8C']}
                    style={styles.heroSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}>
                    <Text style={styles.appName}>Primp</Text>
                    <Text style={styles.tagline}>Join Ghana's Beauty Marketplace</Text>
                </LinearGradient>

                <View style={styles.formSection}>
                    <Text style={styles.welcomeText}>Create Account</Text>
                    <Text style={styles.subText}>Join thousands of beauty professionals and clients</Text>

                    <Text style={styles.roleLabel}>I am a</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'CLIENT' && styles.roleActive]}
                            onPress={() => setRole('CLIENT')}>
                            <Text style={styles.roleIcon}>👤</Text>
                            <Text style={[styles.roleText, role === 'CLIENT' && styles.roleTextActive]}>
                                Client
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'PROFESSIONAL' && styles.roleActive]}
                            onPress={() => setRole('PROFESSIONAL')}>
                            <Text style={styles.roleIcon}>💼</Text>
                            <Text style={[styles.roleText, role === 'PROFESSIONAL' && styles.roleTextActive]}>
                                Professional
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={[styles.input, nameError ? styles.inputError : null]}
                        placeholder="Enter your full name"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={colors.textMuted}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, emailError ? styles.inputError : null]}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={colors.textMuted}
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={[styles.input, passwordError ? styles.inputError : null]}
                        placeholder="Create a password (min 6 characters)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor={colors.textMuted}
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, phoneError ? styles.inputError : null]}
                        placeholder="e.g. 0244123456"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textMuted}
                    />
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        style={[styles.input, locationError ? styles.inputError : null]}
                        placeholder="e.g. Accra, East Legon"
                        value={location}
                        onChangeText={setLocation}
                        placeholderTextColor={colors.textMuted}
                    />
                    {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}>
                        <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}>
                            {loading
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={styles.buttonText}>Create Account</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLinkText}>
                            Already have an account?{' '}
                            <Text style={styles.loginLinkBold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: colors.background,
    },
    heroSection: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    appName: {
        fontSize: 48,
        fontFamily: fonts.bold,
        color: colors.white,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 13,
        fontFamily: fonts.medium,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.5,
        marginTop: 6,
    },
    formSection: {
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -24,
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    welcomeText: {
        fontSize: 24,
        fontFamily: fonts.bold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    subText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    roleLabel: {
        fontSize: 13,
        fontFamily: fonts.semiBold,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: spacing.lg,
    },
    roleButton: {
        flex: 1,
        padding: 14,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    roleActive: {
        borderColor: colors.primary,
        backgroundColor: '#FFF0F5',
    },
    roleIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    roleText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textSecondary,
    },
    roleTextActive: {
        color: colors.primary,
    },
    label: {
        fontSize: 13,
        fontFamily: fonts.semiBold,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: 14,
        marginBottom: 8,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.textPrimary,
        backgroundColor: '#FAFAFA',
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        fontFamily: fonts.regular,
        marginBottom: 8,
        marginLeft: 4,
    },
    button: {
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        marginTop: spacing.md,
        marginBottom: spacing.md,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontFamily: fonts.semiBold,
        letterSpacing: 0.5,
    },
    loginLink: {
        alignItems: 'center',
        padding: spacing.sm,
        marginBottom: spacing.lg,
    },
    loginLinkText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },
    loginLinkBold: {
        fontFamily: fonts.semiBold,
        color: colors.primary,
    },
});