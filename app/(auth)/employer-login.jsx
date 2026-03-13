import CustomInput from "@/components/CustomInput";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from '@/services/apiService';
import notificationService from '@/services/notificationService';
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function EmployerLogin() {
  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

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
    // Clear login error when user starts typing
    if (loginError) {
      setLoginError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrMobile.trim()) {
      newErrors.emailOrMobile = "Email or mobile number is required";
    } else {
      const isEmail = formData.emailOrMobile.includes('@');
      if (isEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrMobile)) {
          newErrors.emailOrMobile = "Please enter a valid email address";
        }
      } else {
        if (!/^[+]?[1-9][\d]{9,14}$/.test(formData.emailOrMobile.replace(/\s/g, ''))) {
          newErrors.emailOrMobile = "Please enter a valid mobile number";
        }
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      // Get device token for push notifications
      const deviceToken = await notificationService.getDeviceToken();

      const response = await apiService.employerLogin({
        emailOrMobile: formData.emailOrMobile,
        password: formData.password,
        device_token: deviceToken,
      });

      if (response.success) {

        router.replace('/employer/home');
      } else {
        // Handle login failure - display exact errors from API
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          // Display all errors from the API
          setLoginError(response.errors.join('\n'));
        } else if (response.message) {
          setLoginError(response.message);
        } else {
          setLoginError('Invalid credentials. Please check your email/phone and password.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password?type=employer');
  };

  const handleSignUp = () => {
    router.push('/employer-signup');
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
          'rgba(30, 74, 114, 0.08)',
          'rgba(30, 74, 114, 0.03)',
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
        color="rgba(30, 74, 114, 0.08)"
        size={70}
      />
      <FloatingElement
        style={{ top: height * 0.35, left: -25 }}
        color="rgba(255, 138, 61, 0.06)"
        size={50}
      />
      <FloatingElement
        style={{ bottom: height * 0.2, right: -15 }}
        color="rgba(27, 163, 163, 0.06)"
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
          {/* iOS Back Button */}
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    onPress={() => router.push("/choose-path")}
                    style={{
                      position: "absolute",
                      top: theme.spacing.md,
                      left: theme.spacing.md,
                      zIndex: 10,
                      backgroundColor: theme.colors.neutral.white,
                      borderRadius: theme.borderRadius.full,
                      padding: theme.spacing.sm,
                      ...theme.shadows.sm,
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={24}
                      color={theme.colors.primary.teal}
                    />
                  </TouchableOpacity>
                )}
          {/* Header */}
          <Animated.View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.xl,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
          >
            {/* Logo and Branding */}
            <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: theme.colors.neutral.white,
                  justifyContent: "center",
                  alignItems: "center",
                  ...theme.shadows.md,
                  marginBottom: theme.spacing.md,
                  borderWidth: 2,
                  borderColor: 'rgba(30, 74, 114, 0.1)',
                }}
              >
                <Image
                  source={require("@/assets/images/company/logo.png")}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                  }}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={{
                  fontSize: theme.typography.sizes.lg,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.text.primary,
                  textAlign: "center",
                  marginBottom: theme.spacing.xs,
                }}
              >
                Employer Portal
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                  textAlign: "center",
                  paddingHorizontal: theme.spacing.md,
                }}
              >
                Access your recruitment dashboard
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
            {/* Login Form */}
            <View style={{
              backgroundColor: theme.colors.neutral.white,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.lg,
              ...theme.shadows.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
              marginBottom: theme.spacing.md,
            }}>
              {/* Subtle gradient background */}
              <LinearGradient
                colors={['transparent', 'rgba(30, 74, 114, 0.03)']}
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
                label="Email or Mobile Number"
                value={formData.emailOrMobile}
                onChangeText={(value) => handleInputChange("emailOrMobile", value)}
                placeholder="Enter your email or mobile number"
                error={errors.emailOrMobile}
                icon="business-outline"
                keyboardType="email-address"
              />

              <CustomInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Enter your password"
                secureTextEntry
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                error={errors.password}
                icon="lock-closed-outline"
              />

              {/* Login Error Message */}
              {loginError ? (
                <View
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.md,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.status.error,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.error,
                      textAlign: 'center',
                    }}
                  >
                    {loginError}
                  </Text>
                </View>
              ) : null}

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={{
                  alignSelf: "flex-end",
                  marginBottom: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.primary.deepBlue,
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <LinearGradient
                colors={[theme.colors.primary.deepBlue, theme.colors.secondary.darkBlue]}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  ...theme.shadows.md,
                  opacity: isLoading ? 0.7 : 1,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  onPress={handleSignIn}
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
                        size={18}
                        color={theme.colors.neutral.white}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          color: theme.colors.neutral.white,
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.bold,
                        }}
                      >
                        Signing you in...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="briefcase-outline"
                        size={18}
                        color={theme.colors.neutral.white}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          color: theme.colors.neutral.white,
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.bold,
                        }}
                      >
                        Sign In as Employer
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Employer Benefits */}
            <View style={{
              backgroundColor: 'rgba(30, 74, 114, 0.05)',
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: 'rgba(30, 74, 114, 0.1)',
            }}>
              <Text style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
                textAlign: 'center',
              }}>
                What you get as an Employer:
              </Text>
              
              {[
                'Advanced skill & experience filtering',
                'Swipe-based candidate shortlisting',
                'Direct chat, voice & video interviews',
                'Free access with GST verification'
              ].map((benefit, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing.xs,
                }}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={theme.colors.primary.deepBlue}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Sign Up Link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={handleSignUp}
                style={{
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.primary.deepBlue,
                  }}
                >
                  Register Company
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View
              style={{
                alignItems: "center",
                paddingBottom: theme.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                  textAlign: "center",
                  lineHeight: theme.typography.sizes.xs * 1.4,
                }}
              >
                By signing in, you agree to our{" "}
                <Link href={`/page?page=${"terms"}`}>
                <Text
                  style={{
                    color: theme.colors.primary.deepBlue,
                    fontFamily: theme.typography.fonts.semiBold,
                    textDecorationLine: 'underline',
                  }}
                >
                  Terms of Service
                </Text>
                </Link>
                {" and "}
                <Link href={`/page?page=${"privacy"}`}>
                <Text
                  style={{
                    color: theme.colors.primary.deepBlue,
                    fontFamily: theme.typography.fonts.semiBold,
                    textDecorationLine: 'underline',
                  }}
                >
                  Privacy Policy
                </Text>
                </Link>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}