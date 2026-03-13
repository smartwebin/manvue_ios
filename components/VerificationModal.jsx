import CustomInput from "@/components/CustomInput";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Reusable Email Verification Modal Component
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {string} email - Email address to verify
 * @param {string} userType - User type (jobseeker or employer)
 * @param {function} onVerified - Callback function when verification succeeds
 * @param {function} onClose - Callback function to close modal
 */
export default function VerificationModal({
  visible,
  email,
  userType,
  onVerified,
  onClose,
}) {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!visible) {
      setVerificationCode('');
      setVerificationError('');
      setIsVerifying(false);
      setIsResendingCode(false);
    }
  }, [visible]);

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationError('Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      const response = await apiService.verifyEmail({
        email: email,
        verification_code: verificationCode,
        user_type: userType
      });

      if (response.success) {
        // Store user data in SecureStore
        if (response.data?.user_id) {
          await SecureStore.setItemAsync('user_id', response.data.user_id.toString());
          console.log('✅ User ID stored in SecureStore:', response.data.user_id);
        }

        if (response.data?.user_type) {
          await SecureStore.setItemAsync('user_type', response.data.user_type);
          console.log('✅ User type stored in SecureStore:', response.data.user_type);
        }

        // Store JWT token in SecureStore for better security
        if (response.token || response.jwt_token) {
          const token = response.token || response.jwt_token;
          await SecureStore.setItemAsync('jwt_token', token);
          console.log('✅ JWT token stored in SecureStore');
        }

        // Store user email and name for quick access
        if (response.data?.email) {
          await SecureStore.setItemAsync('user_email', response.data.email);
        }

        if (response.data?.first_name) {
          await SecureStore.setItemAsync('user_first_name', response.data.first_name);
        }

        if (response.data?.last_name) {
          await SecureStore.setItemAsync('user_last_name', response.data.last_name);
        }
        if (response.data?.company?.company_id) {
          await SecureStore.setItemAsync('company_id', response.data?.company?.company_id);
        }

        // Store user status
        if (response.data?.status) {
          await SecureStore.setItemAsync('user_status', response.data.status);
        }

        console.log('✅ Email verified successfully, User ID:', response.data.user_id);

        // Call onVerified callback if provided
        if (onVerified) {
          onVerified(response.data);
        }

        // Check if payment is required (jobseekers only)
        if (response.payment_required === true && userType === 'jobseeker') {
          console.log('💳 Payment required for jobseeker, redirecting to payment screen');
          router.replace('/payment');
        } else {
          // Navigate to appropriate home page based on user type
          if (userType === 'jobseeker') {
            router.replace('/jobseeker/home');
          } else if (userType === 'employer') {
            router.replace('/employer/home');
          }
        }
      } else {
        setVerificationError(response.message || 'Invalid verification code');
      }
    } catch (error) {
      setVerificationError('Failed to verify email. Please try again.');
      console.error('Email verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || countdown > 0) {
      return;
    }

    setIsResendingCode(true);
    setVerificationError('');

    try {
      const response = await apiService.resendVerificationCode({
        email: email,
        user_type: userType
      });

      if (response.success) {
        Alert.alert('Success', 'Verification code sent successfully! Please check your email.');
        // Start 60 second countdown
        setCountdown(60);
        setCanResend(false);
      } else {
        setVerificationError(response.message || 'Failed to resend code');
      }
    } catch (error) {
      setVerificationError('Failed to resend code. Please try again.');
      console.error('Resend code error:', error);
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.xl,
            width: "100%",
            maxWidth: 400,
            padding: theme.spacing.xl,
          }}
        >
          {/* Close Button */}
          {onClose && (
            <TouchableOpacity
              onPress={handleClose}
              style={{
                position: 'absolute',
                top: theme.spacing.md,
                right: theme.spacing.md,
                zIndex: 10,
                padding: theme.spacing.xs,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          )}

          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons
                name="mail-outline"
                size={36}
                color={theme.colors.primary.teal}
              />
            </View>

            <Text
              style={{
                fontSize: theme.typography.sizes.xl,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
                textAlign: "center",
              }}
            >
              Verify Your Email
            </Text>

            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: "center",
                lineHeight: theme.typography.sizes.sm * 1.5,
              }}
            >
              We've sent a 6-digit verification code to
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.primary.teal,
                textAlign: "center",
              }}
            >
              {email}
            </Text>
          </View>

          {/* Verification Code Input */}
          <CustomInput
            label="Verification Code"
            value={verificationCode}
            onChangeText={(value) => {
              setVerificationCode(value);
              setVerificationError('');
            }}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            icon="keypad-outline"
            error={verificationError}
          />

          {/* Info Banner */}
          <View
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: theme.colors.status.info,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.status.info,
                textAlign: 'center',
              }}
            >
              The code will expire in 15 minutes
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={isVerifying}
            style={{
              borderRadius: theme.borderRadius.lg,
              marginBottom: theme.spacing.md,
              overflow: "hidden",
              opacity: isVerifying ? 0.7 : 1,
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[
                theme.colors.primary.teal,
                theme.colors.secondary.darkTeal,
              ]}
              style={{
                paddingVertical: theme.spacing.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              {isVerifying ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.neutral.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={theme.colors.neutral.white}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    Verify Email
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Code */}
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={isResendingCode || !canResend || countdown > 0}
            style={{
              paddingVertical: theme.spacing.sm,
              alignItems: "center",
              opacity: (isResendingCode || !canResend || countdown > 0) ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.primary.teal,
                textAlign: "center",
              }}
            >
              {isResendingCode
                ? 'Sending...'
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : "Didn't receive code? Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
