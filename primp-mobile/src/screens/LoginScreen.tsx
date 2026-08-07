import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { login } from '../services/authService';
import { validateEmail, validatePassword } from '../utils/validation';
import { colors, fonts, spacing, borderRadius } from '../theme';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const loginStore = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        setEmailError(emailErr || '');
        setPasswordError(passwordErr || '');
        if (emailErr || passwordErr) return;

        setLoading(true);
        try {
            const response = await login({ email, password });
            loginStore({
                id: response.id,
                name: response.name,
                role: response.role,
                token: response.token,
                profilePhotoUrl: response.profilePhotoUrl,
            });
        } catch (error: any) {
            Alert.alert('Login Failed', 'Invalid email or password');
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
                    <Text style={styles.tagline}>Found · Verified · Beautiful</Text>
                </LinearGradient>

                <View style={styles.formSection}>
                    <Text style={styles.welcomeText}>Welcome back</Text>
                    <Text style={styles.subText}>Sign in to your account</Text>

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
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor={colors.textMuted}
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}>
                        <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}>
                            {loading
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={styles.buttonText}>Sign In</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.registerLinkText}>
                            Don't have an account?{' '}
                            <Text style={styles.registerLinkBold}>Register</Text>
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
        paddingTop: 80,
        paddingBottom: 48,
        alignItems: 'center',
    },
    appName: {
        fontSize: 56,
        fontFamily: fonts.bold,
        color: colors.white,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        fontFamily: fonts.medium,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
        marginTop: 8,
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
        fontSize: 26,
        fontFamily: fonts.bold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
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
    registerLink: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    registerLinkText: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },
    registerLinkBold: {
        fontFamily: fonts.semiBold,
        color: colors.primary,
    },
});