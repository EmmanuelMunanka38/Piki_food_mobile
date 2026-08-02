import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PikiButton } from '@/components/ui/PikiButton';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const OTP_LENGTH = 4;
const RESEND_TIMER_SECONDS = 60;

function routeByRole(role: string) {
  switch (role) {
    case 'driver':
      router.replace('/driver');
      break;
    case 'restaurant_owner':
      router.replace('/restaurant');
      break;
    default:
      router.replace('/(tabs)');
  }
}

export default function VerifyOTPScreen() {
  const { email, phone, mode, name, role } = useLocalSearchParams<{
    email: string;
    phone: string;
    mode?: string;
    name?: string;
    role?: string;
  }>();

  const insets = useSafeAreaInsets();
  const theme = 'light';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(RESEND_TIMER_SECONDS);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyOTP, isLoading, sendOtp } = useAuthStore();
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((d) => d !== '');

  const handleVerify = async () => {
    if (!isComplete || isLoading || !email || verifyingRef.current) return;
    setError('');
    verifyingRef.current = true;
    try {
      const code = otp.join('');
      await verifyOTP(email, code, mode === 'sign-up' ? name : undefined, role);
      const { user: u } = useAuthStore.getState();
      const effectiveRole = role || u?.role || 'customer';
      if (u && role && role !== u.role) {
        useAuthStore.getState().setUser({ ...u, role: role as 'customer' | 'driver' | 'restaurant_owner' });
      }
      routeByRole(effectiveRole);
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      verifyingRef.current = false;
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setTimer(RESEND_TIMER_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    if (email && phone) {
      try {
        await sendOtp(email, phone);
      } catch {
        // silent
      }
    }
  };

  const handleEditEmail = () => {
    router.back();
  };

  const isEmailContact = email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false;
  const maskedContact = isEmailContact
    ? email.replace(/(.{2})(.*)(@.*)/, '$1****$3')
    : email;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const countdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: Colors[theme].background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors[theme]['on-surface']} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: Colors[theme]['on-surface'] }]}>
            We just sent an email
          </Text>
          <Text style={[styles.subtitle, { color: Colors[theme]['on-surface-variant'] }]}>
            Enter the security code we sent to
          </Text>
          <TouchableOpacity
            onPress={handleEditEmail}
            style={[
              styles.emailRow,
              { backgroundColor: Colors[theme]['surface-container-low'] },
            ]}
            activeOpacity={0.7}
            hitSlop={4}
          >
            <Text style={[styles.email, { color: Colors[theme]['on-surface'] }]}>
              {maskedContact}
            </Text>
            <MaterialCommunityIcons
              name="pencil"
              size={14}
              color={Colors[theme]['on-surface-variant']}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => {
            const isFocused = focusedIndex === index;
            const isFilled = digit !== '';
            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: isFilled
                      ? Colors[theme]['surface-container-low']
                      : Colors[theme].surface,
                    borderColor: isFocused || isFilled
                      ? Colors[theme].primary
                      : Colors[theme]['outline-variant'],
                    color: Colors[theme]['on-surface'],
                  },
                  isFocused && styles.otpInputFocused,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={index === 0}
                selectTextOnFocus
              />
            );
          })}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: Colors[theme]['error-container'] + '60' }]}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={Colors[theme].error} />
            <Text style={[styles.errorText, { color: Colors[theme].error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <PikiButton
            title="Verify"
            onPress={handleVerify}
            disabled={!isComplete}
            loading={isLoading}
            fullWidth
            style={styles.verifyButton}
          />

          <View style={styles.resendSection}>
            <Text style={[styles.resendLabel, { color: Colors[theme]['on-surface-variant'] }]}>
              Didn{"'"}t receive code?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={timer > 0}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <View style={styles.resendRow}>
                <Text
                  style={[
                    styles.resendText,
                    {
                      color: timer > 0
                        ? Colors[theme]['on-surface-variant']
                        : Colors[theme].primary,
                    },
                  ]}
                >
                  Resend
                </Text>
                {timer > 0 && (
                  <Text style={[styles.countdown, { color: Colors[theme]['on-surface-variant'] }]}>
                    {'\u00A0'}-{' '}
                    {countdown}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing['container-padding'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light['surface-container-low'],
    borderWidth: 1,
    borderColor: Colors.light['outline-variant'],
  },
  titleArea: {
    alignItems: 'center',
    marginTop: Spacing.xl + Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography['body-md'],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  email: {
    ...Typography['label-md'],
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xl + Spacing.sm,
  },
  otpInput: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 72,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  otpInputFocused: {
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography['body-sm'],
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  verifyButton: {
    borderRadius: BorderRadius.full,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  resendSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resendLabel: {
    ...Typography['body-md'],
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    ...Typography['label-md'],
    fontWeight: '700',
  },
  countdown: {
    ...Typography['label-md'],
    fontWeight: '600',
  },
});
