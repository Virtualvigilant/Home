import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { UserRole } from '../../src/lib/database.types';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { signIn, resetPassword, loading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    const res = await signIn(email.trim(), password);
    if (res.success && res.role) {
      navigateByRole(res.role);
    } else if (!res.success) {
      Alert.alert('Sign In Error', res.error || 'Failed to sign in.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Enter your email address, then tap Forgot Password again.');
      return;
    }
    const result = await resetPassword(email);
    Alert.alert(
      result.success ? 'Check Your Email' : 'Reset Password Error',
      result.success
        ? 'Password reset instructions have been sent if an account exists for that email.'
        : result.error || 'Unable to send reset instructions.'
    );
  };

  const navigateByRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        router.replace('/(admin)/dashboard');
        break;
      case 'hunter':
        router.replace('/(hunter)/leads');
        break;
      case 'landlord':
        router.replace('/(landlord)/portfolio');
        break;
      case 'retailer':
        router.replace('/(retailer)/catalog');
        break;
      case 'mover':
        router.replace('/(mover)/jobs');
        break;
      case 'client':
      default:
        router.replace('/(client)/(explore)/homes');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="home" size={32} color={Colors.white} />
          </View>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSubtitle}>
            Sign in to access your account across Kenya.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {error && (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="name@example.com"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(txt) => {
                clearError();
                setEmail(txt);
              }}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(txt) => {
                clearError();
                setPassword(txt);
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassBtn}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPassText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link to Register */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.matteClay,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  brandTitle: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  brandSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorAlertText: {
    fontSize: Typography.caption,
    color: Colors.error,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  forgotPassText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.matteClay,
  },
  submitBtn: {
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
});
