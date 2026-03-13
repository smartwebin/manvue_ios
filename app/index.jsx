import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import theme from "../theme";

const { width, height } = Dimensions.get("window");

export default function Index() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Skill tag animations - these run continuously
  const skill1Anim = useRef(new Animated.Value(0)).current;
  const skill2Anim = useRef(new Animated.Value(0)).current;
  const skill3Anim = useRef(new Animated.Value(0)).current;
  const skill4Anim = useRef(new Animated.Value(0)).current;
  const skill5Anim = useRef(new Animated.Value(0)).current;

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      // Check if user has a stored token, user type, and user ID
      const [token, userType, userId, subscriptionStatus] = await Promise.all([
        SecureStore.getItemAsync("jwt_token"),
        SecureStore.getItemAsync("user_type"),
        SecureStore.getItemAsync("user_id"),
        SecureStore.getItemAsync("subscription_status"),
      ]);

      if (token) {
        // User is logged in, verify we have both user type and user_id.

        if (userType && userId) {
          if (userType === "jobseeker") {
            // Check if jobseeker has paid subscription
            const hasPaidSubscription = subscriptionStatus === "active";

            if (!hasPaidSubscription) {
              console.log("💳 No active subscription, redirecting to payment");
              router.replace("/payment-existing");
            } else {
              console.log("🏠 Redirecting logged-in job seeker to home");
              router.replace("/jobseeker/home");
            }
          } else if (userType === "employer") {
            console.log("🏢 Redirecting logged-in employer to home");
            router.replace("/employer/home");
          } else {
            // Unknown user type, show choose path
            console.log("🤔 Unknown user type, showing choose path");
            router.replace("/choose-path");
          }
        } else {
          // Token exists but no user type or user_id, show choose path
          console.log(
            "🤔 Token exists but missing user data, showing choose path",
          );
          router.replace("/choose-path");
        }
      } else {
        // No token, show onboarding
        console.log("👋 No token found, showing onboarding");
        setShowOnboarding(true);
      }
    } catch (error) {
      console.log("❌ Error checking auth status:", error);
      // On error, show onboarding
      setShowOnboarding(true);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    // Create floating animations for skill tags
    const createFloatingAnimation = (animValue, delay) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }, delay);
    };

    // Start floating animations with staggered delays
    createFloatingAnimation(skill1Anim, 500);
    createFloatingAnimation(skill2Anim, 1000);
    createFloatingAnimation(skill3Anim, 1500);
    createFloatingAnimation(skill4Anim, 2000);
    createFloatingAnimation(skill5Anim, 2500);
  }, []);

  // Floating Skill Tag Component
  const SkillTag = ({
    children,
    animValue,
    style,
    backgroundColor = theme.colors.primary.teal,
  }) => {
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -15],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.7, 1, 0.7],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.95, 1.05, 0.95],
    });

    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            backgroundColor,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 25,
            transform: [{ translateY }, { scale }],
            opacity,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          style,
        ]}
      >
        <Text
          style={{
            color: theme.colors.neutral.white,
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.semiBold,
            textAlign: "center",
          }}
        >
          {children}
        </Text>
      </Animated.View>
    );
  };

  // Custom Page Component with fixed animations
  const CustomPage = ({
    title,
    highlightWord,
    description,
    skills,
    gradientColors,
  }) => {
    // Content-only animations (not the whole container)
    const contentFadeAnim = useRef(new Animated.Value(0)).current;
    const contentSlideUpAnim = useRef(new Animated.Value(30)).current;
    const profileScaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
      // Reset animations
      contentFadeAnim.setValue(0);
      contentSlideUpAnim.setValue(30);
      profileScaleAnim.setValue(0.8);

      // Start content entrance animation
      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(profileScaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();
    }, [title, highlightWord, description]);

    const skillAnims = [
      skill1Anim,
      skill2Anim,
      skill3Anim,
      skill4Anim,
      skill5Anim,
    ];

    return (
      // Background stays visible (no opacity animation)
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        }}
      >
        {/* Background Gradient - Always visible */}
        <LinearGradient
          colors={
            gradientColors || [
              theme.colors.background.accent,
              theme.colors.background.primary,
              "rgba(27, 163, 163, 0.05)",
            ]
          }
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: height,
          }}
          locations={[0, 0.6, 1]}
        />

        {/* Decorative background elements - Always visible */}
        <View
          style={{
            position: "absolute",
            top: height * 0.1,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "rgba(27, 163, 163, 0.05)",
          }}
        />

        <View
          style={{
            position: "absolute",
            top: height * 0.3,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255, 138, 61, 0.05)",
          }}
        />

        {/* Main Content - Only this part animates */}
        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: theme.spacing.lg,
            justifyContent: "center",
            alignItems: "center",
            // paddingTop: height * 0.05,
            opacity: contentFadeAnim,
            transform: [{ translateY: contentSlideUpAnim }],
          }}
        >
          {/* Profile Image with Floating Skills */}
          <Animated.View
            style={{
              position: "relative",
              marginBottom: theme.spacing.xxl,
              alignItems: "center",
              transform: [{ scale: profileScaleAnim }],
            }}
          >
            {/* Gradient Border */}
            <LinearGradient
              colors={[theme.colors.primary.teal, theme.colors.primary.orange]}
              style={{
                width: width * 0.65,
                height: width * 0.65,
                borderRadius: width * 0.325,
                padding: 4,
                justifyContent: "center",
                alignItems: "center",
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={{
                  width: width * 0.6,
                  height: width * 0.6,
                  borderRadius: width * 0.3,
                  backgroundColor: theme.colors.neutral.white,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: theme.colors.neutral.white,
                }}
              >
                <Image
                  source={require("../assets/images/company/preview.png")}
                  style={{
                    width: width * 0.5,
                    height: width * 0.5,
                    borderRadius: width * 0.25,
                  }}
                  resizeMode="cover"
                />
              </View>
            </LinearGradient>

            {/* Floating Skill Tags */}
            {skills.map((skill, index) => {
              const positions = [
                { top: 10, left: -30 },
                { top: 70, right: -40 },
                { bottom: 110, left: -50 },
                { bottom: 30, right: -35 },
                { bottom: -10, left: 5 },
              ];

              const colors = [
                theme.colors.primary.teal,
                theme.colors.primary.orange,
                theme.colors.primary.deepBlue,
                theme.colors.status.success,
                theme.colors.secondary.darkTeal,
              ];

              return (
                <SkillTag
                  key={`${skill}-${index}`}
                  animValue={skillAnims[index] || skill1Anim}
                  style={positions[index] || positions[0]}
                  backgroundColor={colors[index] || theme.colors.primary.teal}
                >
                  {skill}
                </SkillTag>
              );
            })}
          </Animated.View>

          {/* Main Heading */}
          <View
            style={{
              alignItems: "center",
              marginBottom: theme.spacing.xl,
              paddingHorizontal: theme.spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: Math.min(
                  theme.typography.sizes.heading,
                  width * 0.08,
                ),
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                textAlign: "center",
                lineHeight:
                  Math.min(theme.typography.sizes.heading, width * 0.08) * 1.25,
                marginBottom: theme.spacing.sm,
                letterSpacing: 0.5,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: Math.min(
                  theme.typography.sizes.heading,
                  width * 0.08,
                ),
                fontFamily: theme.typography.fonts.extraBold,
                color: theme.colors.primary.teal,
                textAlign: "center",
                lineHeight:
                  Math.min(theme.typography.sizes.heading, width * 0.08) * 1.25,
                letterSpacing: 0.5,
                textShadowColor: "rgba(27, 163, 163, 0.3)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              {highlightWord}
            </Text>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: theme.typography.sizes.md,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: "center",
              lineHeight: theme.typography.sizes.md * 1.6,
              paddingHorizontal: theme.spacing.lg,
              maxWidth: width * 0.85,
              letterSpacing: 0.3,
            }}
          >
            {description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const CustomDot = ({ selected }) => (
    <Animated.View
      style={{
        width: selected ? 24 : 10,
        height: 10,
        borderRadius: selected ? 12 : 5,
        backgroundColor: selected
          ? theme.colors.primary.teal
          : theme.colors.neutral.mediumGray,
        marginHorizontal: 4,
        borderWidth: selected ? 2 : 0,
        borderColor: theme.colors.neutral.white,
      }}
    />
  );

  const onDone = () => {
    console.log("Onboarding completed! Navigating to choose path...");
    router.push("/choose-path");
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <SafeAreaWrapper backgroundColor={theme.colors.background.primary}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background.primary}
          translucent={false}
        />

        <LinearGradient
          colors={[
            theme.colors.background.accent,
            theme.colors.background.primary,
            "rgba(27, 163, 163, 0.05)",
          ]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          locations={[0, 0.6, 1]}
        />

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator
            size="large"
            color={theme.colors.primary.teal}
            style={{ marginBottom: theme.spacing.lg }}
          />

          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              textAlign: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            Manvue
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: "center",
            }}
          >
            Checking your login status...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Only show onboarding if user is not authenticated
  if (!showOnboarding) {
    return null; // This shouldn't happen, but just in case
  }

  return (
    <SafeAreaWrapper backgroundColor={theme.colors.background.primary}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.primary}
        translucent={false}
      />

      <Onboarding
        pages={[
          {
            backgroundColor: theme.colors.background.primary,
            image: (
              <CustomPage
                title="Find Your Dream"
                highlightWord="Career Path"
                description="Skip the endless job listings. Connect directly with employers who value your unique skills and expertise."
                skills={[
                  "#Designer",
                  "#Manager",
                  "#Developer",
                  "#UX Expert",
                  "#Analyst",
                ]}
                gradientColors={[
                  theme.colors.background.accent,
                  theme.colors.background.primary,
                  "rgba(27, 163, 163, 0.03)",
                ]}
              />
            ),
            title: "",
            subtitle: "",
          },
          {
            backgroundColor: theme.colors.background.primary,
            image: (
              <CustomPage
                title="Skills-Based"
                highlightWord="Smart Matching"
                description="Our AI-powered system matches you with opportunities based on your actual skills, not just keywords."
                skills={[
                  "#React Native",
                  "#UI/UX",
                  "#Node.js",
                  "#Python",
                  "#Mobile",
                ]}
                gradientColors={[
                  "rgba(255, 138, 61, 0.08)",
                  theme.colors.background.primary,
                  "rgba(255, 138, 61, 0.03)",
                ]}
              />
            ),
            title: "",
            subtitle: "",
          },
          {
            backgroundColor: theme.colors.background.primary,
            image: (
              <CustomPage
                title="Direct"
                highlightWord="Connection"
                description="Chat, call, and interview directly with hiring managers. No middlemen, no spam, just real opportunities."
                skills={[
                  "#Remote Work",
                  "#Full-time",
                  "#Freelance",
                  "#Startup",
                  "#Enterprise",
                ]}
                gradientColors={[
                  "rgba(30, 74, 114, 0.08)",
                  theme.colors.background.primary,
                  "rgba(30, 74, 114, 0.03)",
                ]}
              />
            ),
            title: "",
            subtitle: "",
          },
        ]}
        onSkip={onDone}
        onDone={onDone}
        DotComponent={CustomDot}
        bottomBarHighlight={false}
        bottomBarColor={theme.colors.background.primary}
        controlStatusBar={false}
        showSkip={false}
        showNext={false}
        skipToPage={2}
        containerStyles={{
          paddingHorizontal: 0,
          paddingBottom: theme.spacing.xl,
        }}
        imageContainerStyles={{
          paddingBottom: 0,
          flex: 1,
        }}
        titleStyles={{
          display: "none",
        }}
        subTitleStyles={{
          display: "none",
        }}
        bottomBarStyle={{
          backgroundColor: theme.colors.background.primary,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
        }}
        dotStyle={{
          backgroundColor: theme.colors.neutral.mediumGray,
        }}
        activeDotStyle={{
          backgroundColor: theme.colors.primary.teal,
        }}
      />

      {/* Bottom CTA Section */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.background.primary,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
              letterSpacing: 0.2,
            }}
          >
            Start your journey now!{" "}
          </Text>
          <TouchableOpacity
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.borderRadius.sm,
            }}
            onPress={() => router.push("/choose-path")}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.teal,
                letterSpacing: 0.2,
              }}
            >
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 30 * 2 }} />
    </SafeAreaWrapper>
  );
}
