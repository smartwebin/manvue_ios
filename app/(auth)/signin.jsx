import CustomInput from "@/components/CustomInput";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import notificationService from "@/services/notificationService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function JobSeekerLogin() {
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
      const isEmail = formData.emailOrMobile.includes("@");
      if (isEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrMobile)) {
          newErrors.emailOrMobile = "Please enter a valid email address";
        }
      } else {
        if (
          !/^[+]?[1-9][\d]{9,14}$/.test(
            formData.emailOrMobile.replace(/\s/g, "")
          )
        ) {
          newErrors.emailOrMobile = "Please enter a valid mobile number";
        }
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (validateForm()) {
      setIsLoading(true);
      setLoginError("");

      try {
        // Determine if input is email or mobile
        const isEmail = formData.emailOrMobile.includes("@");

        // Get device token for push notifications
        const deviceToken = await notificationService.getDeviceToken();

        // Prepare login credentials
        const credentials = {
          emailOrMobile: formData.emailOrMobile,
          password: formData.password,
          user_type: "jobseeker",
          device_token: deviceToken,
        };

        if (__DEV__) {
          console.log("🔑 Attempting login with credentials:", {
            [isEmail ? "email" : "phone_number"]: formData.emailOrMobile,
            user_type: "jobseeker",
          });
        }

        const response = await apiService.login(credentials);

        if (response.success) {
          if (__DEV__) {
            console.log("✅ Login successful:", response.message);
            console.log("📦 Subscription data:", response.data?.subscription);
          }

          // Check subscription status
          const subscription = response.data?.subscription;
          
          if (!subscription) {
            // No subscription data - shouldn't happen but handle it
            console.log("⚠️ No subscription data returned - redirecting to payment");
            router.replace("/payment-existing");
            return;
          }

          // ====== DECISION TREE FOR SUBSCRIPTION HANDLING ======
          
          // 1. First-time user (never had subscription)
          if (subscription.is_first_time === true) {
            if (__DEV__) {
              console.log("🆕 First time user, redirecting to payment");
            }
            router.replace("/payment-existing");
            return;
          }

          // 2. Expired subscription
          if (subscription.is_expired === true || subscription.needs_renewal === true) {
            if (__DEV__) {
              console.log("⏰ Subscription expired, showing renewal prompt");
            }
            
            Alert.alert(
              "Subscription Expired",
              `Your subscription expired on ${subscription.end_date}. Please renew to continue using ManVue.`,
              [
                {
                  text: "Renew Now",
                  onPress: () => {
                    router.replace("/payment-existing");
                  },
                },
                
              ],
              { cancelable: false }
            );
            return;
          }

          // 3. Invalid subscription status
          if (subscription.subscription_status && !['active', 'none'].includes(subscription.subscription_status)) {
            if (__DEV__) {
              console.log("💳 Invalid subscription status:", subscription.subscription_status);
            }
            
            const statusMessages = {
              'payment_pending': 'Your payment is pending. Please complete payment.',
              'payment_failed': 'Your previous payment failed. Please try again.',
              'cancelled': 'Your subscription was cancelled. Please renew to continue.',
              'paused': 'Your subscription is paused. Please contact support.',
            };

            const message = statusMessages[subscription.subscription_status] || 
                          'Your subscription is not active. Please renew.';

            Alert.alert(
              "Subscription Required",
              message,
              [
                {
                  text: "Renew Subscription",
                  onPress: () => {
                    router.replace("/payment-existing");
                  },
                },
              ],
              { cancelable: false }
            );
            return;
          }

          // 4. Active subscription - check days remaining
          if (subscription.has_active_subscription === true) {
            if (__DEV__) {
              console.log("✅ Active subscription found, days remaining:", subscription.days_remaining);
            }
            
            // Show warning if expiring within 7 days
            if (subscription.days_remaining > 0 && subscription.days_remaining <= 7) {
              if (__DEV__) {
                console.log(`⚠️ Subscription expiring soon: ${subscription.days_remaining} days`);
              }
              
              Alert.alert(
                "Subscription Expiring Soon",
                `Your subscription will expire in ${subscription.days_remaining} day${subscription.days_remaining > 1 ? 's' : ''}. Consider renewing to avoid interruption.`,
                [
                  {
                    text: "Remind Me Later",
                    style: "cancel",
                    onPress: () => {
                      router.replace("/jobseeker/home");
                    },
                  },
                  {
                    text: "Renew Now",
                    onPress: () => {
                      router.replace("/payment-existing");
                    },
                  },
                ]
              );
            } else {
              // Normal login - proceed to home
              router.replace("/jobseeker/home");
            }
            return;
          }

          // 5. Fallback - no active subscription (shouldn't reach here but handle it)
          if (__DEV__) {
            console.log("❌ No active subscription - fallback redirect");
          }
          router.replace("/payment-existing");

        } else {
          // Handle login failure - display exact errors from API
          if (
            response.errors &&
            Array.isArray(response.errors) &&
            response.errors.length > 0
          ) {
            // Display all errors from the API
            setLoginError(response.errors.join("\n"));
          } else if (response.message) {
            setLoginError(response.message);
          } else {
            setLoginError(
              "Invalid credentials. Please check your email/phone and password."
            );
          }
        }
      } catch (error) {
        console.error("Login error:", error);
        setLoginError(
          "Network error. Please check your internet connection and try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password?type=jobseeker");
  };

  const handleSignUp = () => {
    router.push("/signup");
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
            position: "absolute",
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
          theme.colors.background.accent,
          "rgba(27, 163, 163, 0.05)",
          theme.colors.background.primary,
        ]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        locations={[0, 0.4, 1]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.xxxl,
          }}
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
          
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
          >
            {/* Logo Section */}
            <View
              style={{ alignItems: "center", marginBottom: theme.spacing.xl }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: theme.colors.neutral.white,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Image
                  source={require("../../assets/images/company/logo.png")}
                  style={{ width: 70, height: 70 }}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={{
                  fontSize: theme.typography.sizes.xxl,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Welcome Back
              </Text>

              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  textAlign: "center",
                }}
              >
                Sign in to continue your job search journey
              </Text>
            </View>

            {/* Form Section */}
            <View
              style={{
                backgroundColor: theme.colors.neutral.white,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xl,
                ...theme.shadows.md,
              }}
            >
              <CustomInput
                label="Email or Mobile Number"
                value={formData.emailOrMobile}
                onChangeText={(value) =>
                  handleInputChange("emailOrMobile", value)
                }
                placeholder="Enter your email or mobile number"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.emailOrMobile}
              />

              <CustomInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Enter your password"
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
              />

              <TouchableOpacity
                onPress={handleForgotPassword}
                style={{
                  alignSelf: "flex-end",
                  paddingVertical: theme.spacing.sm,
                  marginBottom: theme.spacing.lg,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.primary.teal,
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Error Message */}
              {loginError ? (
                <View
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.status.error,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.error,
                    }}
                  >
                    {loginError}
                  </Text>
                </View>
              ) : null}

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
                disabled={isLoading}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  overflow: "hidden",
                  opacity: isLoading ? 0.7 : 1,
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[
                    theme.colors.primary.teal,
                    theme.colors.secondary.darkTeal,
                  ]}
                  style={{
                    paddingVertical: theme.spacing.lg,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  {isLoading ? (
                    <>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: theme.colors.neutral.white,
                          borderTopColor: "transparent",
                          marginRight: theme.spacing.sm,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.md,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: theme.colors.neutral.white,
                        }}
                      >
                        Signing In...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.md,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: theme.colors.neutral.white,
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        Sign In
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={theme.colors.neutral.white}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Job Seeker Benefits */}
            <View
              style={{
                backgroundColor: "rgba(27, 163, 163, 0.05)",
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.lg,
                borderWidth: 1,
                borderColor: "rgba(27, 163, 163, 0.1)",
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.md,
                  textAlign: "center",
                }}
              >
                What you get as a Job Seeker
              </Text>

              {[
                "AI-powered job matching",
                "Direct employer communication",
                "Video interview scheduling",
                "Skills-based recommendations",
              ].map((benefit, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.primary.teal}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      flex: 1,
                    }}
                  >
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
                marginTop: theme.spacing.xl,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                }}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.primary.teal,
                  }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms & Privacy Policy Footer */}
            <View
              style={{
                alignItems: "center",
                marginTop: theme.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                  textAlign: "center",
                  lineHeight: theme.typography.sizes.xs * 1.5,
                }}
              >
                By signing in, you agree to our{" "}
                <Link href={`/page?page=${"terms"}`}>
                  <Text
                    style={{
                      color: theme.colors.primary.teal,
                      fontFamily: theme.typography.fonts.semiBold,
                      textDecorationLine: "underline",
                    }}
                  >
                    Terms of Service
                  </Text>
                </Link>
                {" and "}
                <Link href={`/page?page=${"privacy"}`}>
                  <Text
                    style={{
                      color: theme.colors.primary.teal,
                      fontFamily: theme.typography.fonts.semiBold,
                      textDecorationLine: "underline",
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