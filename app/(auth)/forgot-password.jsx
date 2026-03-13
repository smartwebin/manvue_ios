import CustomInput from "@/components/CustomInput";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function ForgotPassword() {
  // Get user type from query params (employer or jobseeker)
  const params = useLocalSearchParams();
  const userType = params.type || 'jobseeker';

  // Form data - Only email needed for this API
  const [formData, setFormData] = useState({
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // Validate Email
  const validateEmail = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Send Password
  const handleSendPassword = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    setSuccessMessage("");

    try {
      const response = await apiService.forgotPassword({
        email: formData.email.toLowerCase().trim(),
        user_type: userType === 'employer' ? 'employer' : 'jobseeker',
      });

      if (response.success) {
        setSuccessMessage(response.message || "Password sent to your email successfully!");
        
        // Clear form
        setFormData({ email: "" });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          if (userType === 'employer') {
            router.replace('/employer-login');
          } else {
            router.replace('/signin');
          }
        }, 3000);
      } else {
        setErrors({ 
          email: response.message || "Failed to send password. Please try again." 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({ 
        email: "An error occurred. Please try again later." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Floating decorative element
  const FloatingElement = ({ style, color, size = 60 }) => {
    const translateY = floatingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -12],
    });

    const opacity = floatingAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 1, 0.6],
    });

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ translateY }],
            opacity,
          },
          style,
        ]}
      />
    );
  };

  // Get theme colors based on user type
  const getThemeColor = () => {
    return userType === 'employer'
      ? theme.colors.primary.deepBlue
      : theme.colors.primary.teal;
  };

  const getSecondaryColor = () => {
    return userType === 'employer'
      ? theme.colors.secondary.darkBlue
      : theme.colors.secondary.darkTeal;
  };

  const getAccentColor = () => {
    return userType === 'employer'
      ? 'rgba(30, 74, 114, 0.08)'
      : 'rgba(27, 163, 163, 0.08)';
  };

  return (
    <SafeAreaWrapper>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.primary}
        translucent={false}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          userType === 'employer'
            ? 'rgba(30, 74, 114, 0.08)'
            : theme.colors.background.accent,
          userType === 'employer'
            ? 'rgba(30, 74, 114, 0.03)'
            : 'rgba(27, 163, 163, 0.05)',
          theme.colors.background.primary,
        ]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        locations={[0, 0.3, 1]}
      />

      {/* Floating Decorative Elements */}
      <FloatingElement
        style={{ top: height * 0.1, right: -20 }}
        color={getAccentColor()}
        size={70}
      />
      <FloatingElement
        style={{ top: height * 0.35, left: -25 }}
        color="rgba(255, 138, 61, 0.06)"
        size={50}
      />
      <FloatingElement
        style={{ bottom: height * 0.2, right: -15 }}
        color={getAccentColor()}
        size={60}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button */}
          <Animated.View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.xl,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing.lg,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>

            {/* Logo and Title */}
            <View style={{ alignItems: "center", marginBottom: theme.spacing.xl }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: theme.colors.neutral.white,
                  justifyContent: "center",
                  alignItems: "center",
                  ...theme.shadows.md,
                  marginBottom: theme.spacing.md,
                  borderWidth: 2,
                  borderColor: userType === 'employer'
                    ? 'rgba(30, 74, 114, 0.1)'
                    : theme.colors.background.accent,
                }}
              >
                <Ionicons 
                  name="lock-closed" 
                  size={32} 
                  color={getThemeColor()} 
                />
              </View>

              <Text
                style={{
                  fontSize: theme.typography.sizes.xxl,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.text.primary,
                  textAlign: "center",
                  marginBottom: theme.spacing.xs,
                }}
              >
                Forgot Password?
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                  textAlign: "center",
                  paddingHorizontal: theme.spacing.xl,
                  lineHeight: 22,
                }}
              >
                Enter your email address and we'll send your password to your registered email
              </Text>
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={{
              flex: 1,
              paddingHorizontal: theme.spacing.lg,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
          >
            {/* Form Card */}
            <View style={{
              backgroundColor: theme.colors.neutral.white,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              ...theme.shadows.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
              marginBottom: theme.spacing.md,
            }}>
              {/* Subtle gradient background */}
              <LinearGradient
                colors={['transparent', userType === 'employer'
                  ? 'rgba(30, 74, 114, 0.03)'
                  : 'rgba(27, 163, 163, 0.03)']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: theme.borderRadius.xl,
                }}
              />

              <CustomInput
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                placeholder="Enter your registered email"
                error={errors.email}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <LinearGradient
                colors={[getThemeColor(), getSecondaryColor()]}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  ...theme.shadows.md,
                  opacity: isLoading ? 0.7 : 1,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  onPress={handleSendPassword}
                  disabled={isLoading}
                  style={{
                    paddingVertical: theme.spacing.md,
                    alignItems: "center",
                    borderRadius: theme.borderRadius.lg,
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.9}
                >
                  {isLoading ? (
                    <>
                      <Ionicons
                        name="hourglass-outline"
                        size={20}
                        color={theme.colors.neutral.white}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          color: theme.colors.neutral.white,
                          fontSize: theme.typography.sizes.base,
                          fontFamily: theme.typography.fonts.bold,
                        }}
                      >
                        Sending...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="paper-plane-outline"
                        size={20}
                        color={theme.colors.neutral.white}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          color: theme.colors.neutral.white,
                          fontSize: theme.typography.sizes.base,
                          fontFamily: theme.typography.fonts.bold,
                        }}
                      >
                        Send Password
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              {/* Success Message */}
              {successMessage ? (
                <View
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.status.success,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.status.success}
                      style={{ marginRight: theme.spacing.sm }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.status.success,
                      }}
                    >
                      {successMessage}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Security Note */}
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
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={theme.colors.status.info}
                  style={{ marginRight: theme.spacing.sm, marginTop: 2 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.status.info,
                    lineHeight: 18,
                  }}
                >
                  For security reasons, we'll send your current password to your registered email. We recommend changing it after logging in.
                </Text>
              </View>
            </View>

            {/* Footer - Remember Password */}
            <View
              style={{
                alignItems: "center",
                paddingBottom: theme.spacing.xl,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  Remember your password?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (userType === 'employer') {
                      router.replace('/employer-login');
                    } else {
                      router.replace('/signin');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.bold,
                      color: getThemeColor(),
                    }}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}