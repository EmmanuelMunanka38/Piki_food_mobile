import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const logo = require('@/assets/images/logo.png');

function detectRole(phone: string): { role: 'customer' | 'driver' | 'restaurant_owner'; prefix: string; number: string } {
  const clean = phone.replace(/[\s-]/g, '');
  if (clean.startsWith('D')) return { role: 'driver', prefix: 'D', number: clean.slice(1) };
  if (clean.startsWith('R')) return { role: 'restaurant_owner', prefix: 'R', number: clean.slice(1) };
  return { role: 'customer', prefix: '', number: clean };
}

const roleConfig = {
  customer: { label: 'Customer', icon: 'account', color: '#0fa958' },
  driver: { label: 'Driver', icon: 'bike', color: '#1a73e8' },
  restaurant_owner: { label: 'Restaurant Owner', icon: 'store', color: '#e37400' },
} as const;

export default function AuthScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const theme = 'light';
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(modeParam === 'sign-up' ? 'sign-up' : 'sign-in');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendOtp } = useAuthStore();

  const detected = useMemo(() => detectRole(phone), [phone]);
  const roleInfo = roleConfig[detected.role];

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const numberPart = detected.number;
  const isPhoneValid = /^\+?\d{7,15}$/.test(numberPart);
  const isNameValid = mode === 'sign-up' ? name.trim().length >= 2 : true;
  const canSubmit = isEmailValid && isPhoneValid && isNameValid && !isSubmitting;

  const handleSendOtp = useCallback(async () => {
    if (!canSubmit) {
      if (!isEmailValid) {
        setError('Please enter a valid email address');
      } else if (!isPhoneValid) {
        setError('Enter a valid phone number (e.g. +255712345678 or D+255712345678)');
      } else if (mode === 'sign-up' && !isNameValid) {
        setError('Name must be at least 2 characters');
      }
      return;
    }
    setError('');
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = numberPart;

    try {
      await sendOtp(cleanEmail, cleanPhone, detected.role);
      const params = new URLSearchParams({
        email: cleanEmail,
        phone: cleanPhone,
        mode,
        role: detected.role,
      });
      if (mode === 'sign-up') params.set('name', name.trim());
      router.push(`/verify-otp?${params.toString()}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, email, mode, name, sendOtp, detected, isEmailValid, isPhoneValid, isNameValid, numberPart]);

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
    setError('');
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={[styles.backButtonInner, { backgroundColor: Colors[theme]['surface-container-low'] }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors[theme]['on-surface']} />
          </View>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.brandIcon, { backgroundColor: Colors[theme].primary }]}>
            <Image source={logo} style={styles.brandLogoImage} contentFit="contain" />
          </View>
          <Text style={[styles.brandName, { color: Colors[theme].primary }]}>Piki Food</Text>
        </View>

        <View style={[styles.card, { backgroundColor: Colors[theme].surface }]}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mode === 'sign-in' && { backgroundColor: Colors[theme].primary },
              ]}
              onPress={() => mode !== 'sign-in' && switchMode()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: mode === 'sign-in' ? '#ffffff' : Colors[theme]['on-surface-variant'] },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mode === 'sign-up' && { backgroundColor: Colors[theme].primary },
              ]}
              onPress={() => mode !== 'sign-up' && switchMode()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: mode === 'sign-up' ? '#ffffff' : Colors[theme]['on-surface-variant'] },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: Colors[theme]['on-surface'] }]}>
            {mode === 'sign-in' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={[styles.subtitle, { color: Colors[theme]['on-surface-variant'] }]}>
            {mode === 'sign-in'
              ? 'Enter your details to receive a verification code'
              : 'Fill in your details to get started'}
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: Colors[theme]['error-container'] + '60' }]}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={Colors[theme].error} />
              <Text style={[styles.errorText, { color: Colors[theme].error }]}>{error}</Text>
            </View>
          ) : null}

          {mode === 'sign-up' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'] }]}>
                Full Name
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: Colors[theme]['surface-container-low'], borderColor: name ? Colors[theme].primary : Colors[theme]['outline-variant'] }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={Colors[theme]['on-surface-variant']} />
                <TextInput
                  style={[styles.input, { color: Colors[theme]['on-surface'] }]}
                  placeholder="John Doe"
                  placeholderTextColor={Colors[theme]['on-surface-variant'] + '80'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'] }]}>
              Email
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: Colors[theme]['surface-container-low'], borderColor: email ? (isEmailValid ? Colors[theme].primary : Colors[theme].tertiary) : Colors[theme]['outline-variant'] }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={Colors[theme]['on-surface-variant']} />
              <TextInput
                style={[styles.input, { color: Colors[theme]['on-surface'] }]}
                placeholder="your@email.com"
                placeholderTextColor={Colors[theme]['on-surface-variant'] + '80'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: Colors[theme]['on-surface-variant'] }]}>
              Phone Number
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: Colors[theme]['surface-container-low'], borderColor: phone ? (isPhoneValid ? Colors[theme].primary : Colors[theme].tertiary) : Colors[theme]['outline-variant'] }]}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={Colors[theme]['on-surface-variant']} />
              <Text style={[styles.phonePrefix, { color: Colors[theme]['on-surface-variant'] }]}>+255</Text>
              <TextInput
                style={[styles.input, { color: Colors[theme]['on-surface'] }]}
                placeholder="712 345 678"
                placeholderTextColor={Colors[theme]['on-surface-variant'] + '80'}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {phone.length > 0 && detected.role !== 'customer' && (
              <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '15' }]}>
                <MaterialCommunityIcons name={roleInfo.icon as any} size={14} color={roleInfo.color} />
                <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
              </View>
            )}
            <Text style={[styles.phoneHint, { color: Colors[theme]['on-surface-variant'] }]}>
              Prefix with D for Driver, R for Restaurant Owner, or just your number for Customer
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? Colors[theme].primary : Colors[theme]['surface-container-high'] },
            ]}
            onPress={handleSendOtp}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={[styles.submitText, { color: canSubmit ? '#ffffff' : Colors[theme]['on-surface-variant'] }]}>
                {mode === 'sign-in' ? 'Send OTP' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: Colors[theme]['on-surface-variant'] }]}>
            {mode === 'sign-in' ? 'No account yet?' : 'Already registered?'}
          </Text>
          <TouchableOpacity onPress={switchMode}>
            <Text style={[styles.switchLink, { color: Colors[theme].primary }]}>
              {mode === 'sign-in' ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.terms, { color: Colors[theme]['on-surface-variant'] }]}>
          By continuing, you agree to Piki{"'"}s Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing['container-padding'], paddingBottom: Spacing.xl },
  backButton: { marginTop: 60, marginBottom: Spacing.md },
  backButtonInner: { width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006d36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  brandLogoImage: {
    width: 40,
    height: 40,
  },
  brandName: { ...Typography.h1, fontSize: 28 },
  card: {
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light['outline-variant'],
    gap: Spacing.md,
    shadowColor: '#0fa958',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  toggleRow: { flexDirection: 'row', backgroundColor: Colors.light['surface-container-low'], borderRadius: BorderRadius.full, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, alignItems: 'center' },
  toggleText: { ...Typography['label-md'], fontWeight: '600' },
  title: { ...Typography.h1, fontSize: 26, marginTop: Spacing.sm },
  subtitle: { ...Typography['body-sm'], marginTop: -Spacing.sm },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md },
  errorText: { ...Typography['body-sm'], flex: 1 },
  inputGroup: { gap: Spacing.xs },
  inputLabel: { ...Typography['label-sm'], fontWeight: '500', marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    height: 52,
  },
  input: { flex: 1, ...Typography['body-md'], height: '100%' },
  phonePrefix: { ...Typography['body-md'], marginRight: Spacing.xs },
  submitBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    shadowColor: '#006d36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  submitText: { ...Typography['label-md'], fontWeight: '700', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.lg },
  switchText: { ...Typography['body-md'] },
  switchLink: { ...Typography['label-md'], fontWeight: '700' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  roleBadgeText: { ...Typography['label-sm'], fontWeight: '600' },
  phoneHint: { ...Typography['label-sm'], marginTop: 4, marginLeft: 4, lineHeight: 16 },
  terms: { ...Typography['body-sm'], textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18, paddingHorizontal: Spacing.md },
});
