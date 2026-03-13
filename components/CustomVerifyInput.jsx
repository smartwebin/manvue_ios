import { apiClient } from '@/services/apiService';
import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CustomVerifyInput = ({
  label,
  value,
  verified,
  onChangeText,
  onVerifiedChange,
  placeholder,
  icon,
  type = 'email', // or 'mobile'
  userType = 'jobseeker',
  required = false,
  error,
  style = {},
  labelStyle = {},
  errorStyle = {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // Resend OTP state with 30-second cooldown
  const [resendCount, setResendCount] = useState(0);
  const MAX_RESEND_ATTEMPTS = 3;
  const [resendTimer, setResendTimer] = useState(0);
  const RESEND_COOLDOWN = 30; // 30 seconds

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const getBorderColor = () => {
    if (error || otpError) return theme.colors.status.error;
    if (verified) return theme.colors.status.success;
    if (isFocused) return theme.colors.primary.teal;
    return theme.colors.border.light;
  };

  const canResend = () => {
    return resendCount < MAX_RESEND_ATTEMPTS && resendTimer === 0;
  };

  const handleSendVerification = async () => {
    if (!value) return;

    try {
      setIsVerifying(true);
      setOtpError('');

      const payload = {
        [type === 'email' ? 'email' : 'phone']: value,
        user_type: userType,
        action: 'send',
        type: type,
      };

      const response = await apiClient.post(
        '/verification.php',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (response.data?.success) {
        setOtpSent(true);
        setResendCount(resendCount + 1);
        setResendTimer(RESEND_COOLDOWN);
        setOtp('');
        setOtpError('');
      } else {
        setOtpError(response.data?.message || 'Failed to send verification.');
        setOtpSent(false);
      }
    } catch (err) {
      console.error('Verification send error:', err);
      const errorMsg = err.response?.data?.message || 
                       err.message || 
                       'Failed to send verification. Try again.';
      setOtpError(errorMsg);
      setOtpSent(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend()) return;
    await handleSendVerification();
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }

    try {
      setIsOtpLoading(true);
      setOtpError('');

      const payload = {
        [type === 'email' ? 'email' : 'phone']: value,
        user_type: userType,
        verification_code: otp,
        action: 'verify',
        type: type,
      };

      const response = await apiClient.post(
        '/verification.php',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (response.data?.success) {
        onVerifiedChange(true);
        setOtpSent(false);
        setOtp('');
        setResendCount(0);
        setResendTimer(0);
        setOtpError('');
      } else {
        setOtpError(response.data?.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMsg = err.response?.data?.message || 
                       err.message || 
                       'Invalid or expired OTP.';
      setOtpError(errorMsg);
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <View style={[{ marginBottom: theme.spacing.lg }, style]}>
      {/* Label */}
      {label && (
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
          <Text
            style={[
              {
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {required && (
            <Text
              style={{
                color: theme.colors.status.error,
                fontSize: theme.typography.sizes.sm,
                marginLeft: 2,
              }}
            >
              *
            </Text>
          )}
          {verified && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.status.success}
              style={{ marginLeft: 6, marginTop: 1 }}
            />
          )}
        </View>
      )}

      {/* Input + Verify Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.background.card,
          borderWidth: 1.5,
          borderColor: getBorderColor(),
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={
              verified
                ? theme.colors.status.success
                : isFocused
                ? theme.colors.primary.teal
                : theme.colors.text.tertiary
            }
            style={{ marginRight: theme.spacing.sm }}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!verified}
          keyboardType={type === 'mobile' ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: verified
              ? theme.colors.status.success
              : theme.colors.text.primary,
          }}
        />

        {!verified && (
          <TouchableOpacity
            onPress={handleSendVerification}
            disabled={isVerifying || !value}
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              backgroundColor: value
                ? theme.colors.primary.teal
                : theme.colors.neutral.lightGray,
              borderRadius: theme.borderRadius.md,
              marginLeft: theme.spacing.sm,
            }}
          >
            {isVerifying ? (
              <ActivityIndicator color={theme.colors.text.inverse} size="small" />
            ) : (
              <Text
                style={{
                  color: theme.colors.text.inverse,
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                }}
              >
                Verify
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Main input error (including "already exists" error) */}
      {(error || (otpError && !otpSent)) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: theme.spacing.xs,
          }}
        >
          <Ionicons
            name="alert-circle"
            size={14}
            color={theme.colors.status.error}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={[
              {
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.status.error,
                fontFamily: theme.typography.fonts.medium,
                flex: 1,
              },
              errorStyle,
            ]}
          >
            {error || otpError}
          </Text>
        </View>
      )}

      {/* OTP Section */}
      {otpSent && !verified && (
        <View
          style={{
            marginTop: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.secondary,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Enter OTP sent to your {type === 'mobile' ? 'mobile number' : 'email'}:
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              placeholderTextColor={theme.colors.text.placeholder}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: getBorderColor(),
                borderRadius: theme.borderRadius.lg,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.primary,
              }}
            />

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={isOtpLoading || !otp}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                backgroundColor: otp
                  ? theme.colors.primary.teal
                  : theme.colors.neutral.lightGray,
                borderRadius: theme.borderRadius.md,
                marginLeft: theme.spacing.sm,
              }}
            >
              {isOtpLoading ? (
                <ActivityIndicator
                  color={theme.colors.text.inverse}
                  size="small"
                />
              ) : (
                <Text
                  style={{
                    color: theme.colors.text.inverse,
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.medium,
                  }}
                >
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {otpError && otpSent ? (
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.status.error,
                marginTop: theme.spacing.xs,
              }}
            >
              {otpError}
            </Text>
          ) : null}

          {/* Resend OTP Section */}
          <View
            style={{
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border.light,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                color: theme.colors.text.tertiary,
              }}
            >
              Didn't receive OTP?
            </Text>

            {resendCount >= MAX_RESEND_ATTEMPTS ? (
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.status.error,
                  fontFamily: theme.typography.fonts.medium,
                }}
              >
                Max attempts reached
              </Text>
            ) : resendTimer > 0 ? (
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  color: theme.colors.text.tertiary,
                  fontFamily: theme.typography.fonts.medium,
                }}
              >
                Resend in {resendTimer}s ({resendCount}/{MAX_RESEND_ATTEMPTS})
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={!canResend()}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    color: canResend() ? theme.colors.primary.teal : theme.colors.text.tertiary,
                    fontFamily: theme.typography.fonts.medium,
                  }}
                >
                  Resend ({resendCount}/{MAX_RESEND_ATTEMPTS})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default CustomVerifyInput;