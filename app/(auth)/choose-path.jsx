import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function UserTypeSelection() {
  // Content-only animation values (not the whole screen)
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideUpAnim = useRef(new Animated.Value(30)).current;
  const cardScale1 = useRef(new Animated.Value(0.9)).current;
  const cardScale2 = useRef(new Animated.Value(0.9)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const headerSlideDownAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Start main content animations
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
      Animated.timing(headerSlideDownAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    setTimeout(() => {
      Animated.timing(cardScale1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 300);

    setTimeout(() => {
      Animated.timing(cardScale2, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 450);

    // Floating animation for decorative elements
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

  const handleJobSeekerSelect = () => {
    console.log("Job Seeker selected");
    router.push("/signin");
  };

  const handleEmployerSelect = () => {
    console.log("Employer selected");
    router.push("/employer-login");
  };

  // Animated floating decorative element
  const FloatingElement = ({ style, color, size = 50 }) => {
    const translateY = floatingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
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

  // Streamlined User Type Card Component
  const UserTypeCard = ({ 
    title, 
    description, 
    icon, 
    gradientColors, 
    onPress, 
    animValue,
    iconBg,
    features,
    buttonTitle = "Continue as Job Seeker"
  }) => (
    <Animated.View
      style={{
        transform: [{ scale: animValue }],
        marginBottom: theme.spacing.sm,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        style={{
          backgroundColor: theme.colors.neutral.white,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        }}
      >
        {/* Subtle Background Gradient */}
        <LinearGradient
          colors={['transparent', `${gradientColors[0]}05`]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.xl,
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Icon Section */}
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: iconBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing.md,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}>
            <Ionicons
              name={icon}
              size={28}
              color={theme.colors.neutral.white}
            />
          </View>

          {/* Content Section */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}>
              {title}
            </Text>

            <Text style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.sizes.sm * 1.3,
              marginBottom: theme.spacing.sm,
            }}>
              {description}
            </Text>

            {/* Compact Features List */}
            <View style={{ marginBottom: theme.spacing.sm }}>
              {features.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: index < features.length - 1 ? theme.spacing.xs : 0,
                  }}
                >
                  <View style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: gradientColors[0],
                    marginRight: theme.spacing.sm,
                  }} />
                  <Text style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Button - Full Width */}
            <LinearGradient
              colors={gradientColors}
              style={{
                borderRadius: theme.borderRadius.md,
                marginTop: theme.spacing.sm,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={{
                paddingVertical: theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}>
                <Text style={{
                  color: theme.colors.neutral.white,
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.bold,
                  marginRight: theme.spacing.xs,
                }}>
                  {buttonTitle}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={theme.colors.neutral.white}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaWrapper backgroundColor={theme.colors.background.primary}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.primary}
        translucent={false}
      />

      {/* Enhanced Background Gradient - Always visible */}
      <LinearGradient
        colors={[
          theme.colors.background.accent,
          'rgba(27, 163, 163, 0.05)',
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

      {/* Floating Decorative Elements - Always visible */}
      <FloatingElement
        style={{ top: height * 0.15, right: -15 }}
        color="rgba(255, 138, 61, 0.06)"
        size={60}
      />
      <FloatingElement
        style={{ top: height * 0.45, left: -20 }}
        color="rgba(30, 74, 114, 0.06)"
        size={50}
      />
      <FloatingElement
        style={{ bottom: height * 0.25, right: -10 }}
        color="rgba(27, 163, 163, 0.06)"
        size={40}
      />

      {/* Header - Animated separately */}
      <Animated.View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.md,
          opacity: contentFadeAnim,
          transform: [{ translateY: headerSlideDownAnim }],
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: theme.typography.sizes.xl,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing.xs,
          }}>
            Choose Your Path
          </Text>
          <Text style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.tertiary,
            textAlign: 'center',
          }}>
            Select how you'd like to use Manvue
          </Text>
        </View>
      </Animated.View>

      {/* User Type Cards Container - Animated separately */}
      <Animated.View 
        style={{
          flex: 1,
          paddingHorizontal: theme.spacing.lg,
          justifyContent: 'center',
          paddingVertical: theme.spacing.lg,
          opacity: contentFadeAnim,
          transform: [{ translateY: contentSlideUpAnim }],
        }}
      >
        <UserTypeCard
          title="Job Seeker"
          description="Find your perfect career opportunity with personalized matching"
          features={[
            "Create comprehensive professional profile",
            "Get AI-powered job recommendations", 
            "Direct employer communication & interviews",
            "Video interview scheduling & reminders",
            "Skills-based matching system"
          ]}
          icon="person"
          iconBg={theme.colors.primary.teal}
          gradientColors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
          onPress={handleJobSeekerSelect}
          animValue={cardScale1}
          buttonTitle="Continue as Job Seeker"
        />

        <UserTypeCard
          title="Employer"
          description="Discover and hire talented candidates through advanced search"
          features={[
            "Advanced skill & experience filtering",
            "Swipe-based candidate shortlisting", 
            "Direct chat, voice & video interviews",
            "No spam applications or middlemen",
            "Free access with GST verification"
          ]}
          icon="business"
          iconBg={theme.colors.primary.deepBlue}
          gradientColors={[theme.colors.primary.deepBlue, theme.colors.secondary.darkBlue]}
          onPress={handleEmployerSelect}
          animValue={cardScale2}
          buttonTitle="Continue as Employer"
        />
      </Animated.View>

      {/* Bottom Helper Text - Animated separately */}
      <Animated.View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          opacity: contentFadeAnim,
        }}
      >
        <Text style={{
          fontSize: theme.typography.sizes.xs,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.tertiary,
          textAlign: 'center',
        }}>
          Choose your role to get started with the perfect experience
        </Text>
      </Animated.View>
    </SafeAreaWrapper>
  );
}