import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function ComingSoon() {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Slide up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };

    pulseAnimation();
  }, []);

  // Floating background blobs
  const FloatingElement = ({ size, color, top, left, delay = 0 }) => {
    const [floatAnim] = useState(new Animated.Value(0));

    useEffect(() => {
      const floatingAnimation = () => {
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]).start(() => floatingAnimation());
      };
      floatingAnimation();
    }, []);

    const translateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    return (
      <Animated.View
        style={{
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.3,
          transform: [{ translateY }],
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <SafeAreaWrapper>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Gradient Background */}
        <LinearGradient
          colors={[
            theme.colors.background.accent,
            "rgba(27, 163, 163, 0.1)",
            "rgba(255, 138, 61, 0.05)",
            theme.colors.background.primary,
          ]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          locations={[0, 0.3, 0.7, 1]}
        />

        {/* Floating Blobs */}
        <FloatingElement
          size={80}
          color={theme.colors.primary.teal}
          top="15%"
          left="10%"
        />
        <FloatingElement
          size={60}
          color={theme.colors.primary.orange}
          top="25%"
          left="80%"
          delay={500}
        />
        <FloatingElement
          size={40}
          color={theme.colors.primary.deepBlue}
          top="60%"
          left="15%"
          delay={1000}
        />
        <FloatingElement
          size={50}
          color={theme.colors.secondary.lightTeal}
          top="70%"
          left="75%"
          delay={1500}
        />
        <FloatingElement
          size={30}
          color={theme.colors.secondary.lightOrange}
          top="45%"
          left="85%"
          delay={800}
        />

        {/* Back Button */}
        <View
          style={{
            position: "absolute",
            top: 50,
            left: theme.spacing.lg,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              justifyContent: "center",
              alignItems: "center",
              elevation: 3,
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={theme.colors.primary.teal}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Main Content */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              width: "100%",
              alignItems: "center",
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Logo */}
            <Animated.View
              style={{
                marginBottom: theme.spacing.xl,
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: theme.colors.background.card,
                  justifyContent: "center",
                  alignItems: "center",
                  elevation: 8,
                  borderWidth: 3,
                  borderColor: theme.colors.primary.teal,
                }}
              >
                <Image
                  source={require("@/assets/images/company/logo.png")}
                  style={{ width: 60, height: 60 }}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            {/* Title + Subtitle */}
            <Text
              style={{
                fontSize: theme.typography.sizes.heading,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                textAlign: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              Coming Soon
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.primary.teal,
                textAlign: "center",
                marginBottom: theme.spacing.xl,
              }}
            >
              Something Amazing is on the Way
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: "center",
                lineHeight: theme.typography.sizes.base * 1.6,
                marginBottom: theme.spacing.xxxl,
                maxWidth: 320,
              }}
            >
              We're working hard to bring you an incredible new feature that
              will enhance your job search experience. Stay tuned for updates!
            </Text>

            {/* Features */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: theme.spacing.md,
                marginBottom: theme.spacing.xxxl,
              }}
            >
              {[
                {
                  icon: "rocket-outline",
                  title: "Advanced Matching",
                  color: theme.colors.primary.teal,
                },
                {
                  icon: "analytics-outline",
                  title: "Smart Insights",
                  color: theme.colors.primary.orange,
                },
                {
                  icon: "people-outline",
                  title: "Network Building",
                  color: theme.colors.primary.deepBlue,
                },
              ].map((feature, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: theme.colors.background.card,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    alignItems: "center",
                    width: width < 360 ? 90 : 100, // responsive cards
                    borderWidth: 1,
                    borderColor: theme.colors.border.light,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: `${feature.color}15`,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <Ionicons name={feature.icon} size={20} color={feature.color} />
                  </View>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.text.secondary,
                      textAlign: "center",
                    }}
                  >
                    {feature.title}
                  </Text>
                </View>
              ))}
            </View>

            {/* Progress */}
            <View
              style={{
                width: "80%",
                maxWidth: 240,
                height: 4,
                backgroundColor: theme.colors.neutral.lightGray,
                borderRadius: 2,
                marginBottom: theme.spacing.md,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
                style={{ width: "75%", height: "100%", borderRadius: 2 }}
              />
            </View>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.primary.teal,
                marginBottom: theme.spacing.xl,
              }}
            >
              75% Complete
            </Text>

            {/* CTA */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
                elevation: 5,
                marginBottom: theme.spacing.xxl,
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
                style={{
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={theme.colors.neutral.white}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  Go Back
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Decorative bottom dots */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["transparent", "rgba(27, 163, 163, 0.1)"]}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: theme.spacing.lg,
            }}
          >
            <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.colors.primary.teal,
                    opacity: 0.6,
                  }}
                />
              ))}
            </View>
          </LinearGradient>
        </View>
      </SafeAreaWrapper>
    </View>
  );
}
