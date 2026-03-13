import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmployerLayout() {
  const pathname = usePathname();
  
  // State for company data
  const [companyProfile, setCompanyProfile] = useState({
    name: "Loading...",
    logo: null,
    company_id: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Use TanStack Query hook for real-time notification count
  const { count: notificationCount, isLoading: loadingCount, refetch: refetchCount } = useNotificationCount();

  // Load company data on mount
  useEffect(() => {
    loadCompanyData();
  }, []);

  // Refetch notification count when returning to app
  useEffect(() => {
    // Refetch when this layout mounts or when pathname changes
    refetchCount();
  }, [pathname, refetchCount]);

  // Load company data from SecureStore and API
  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      // console.log("📊 Loading company data for employer layout...");

      // Get stored company_id
      const companyId = await SecureStore.getItemAsync("company_id");
      // console.log("🔍 Found company_id:", companyId);

      if (!companyId) {
        console.warn("⚠️ No company_id found in SecureStore");
        // Try to get from user profile
        const response = await apiService.getProfile();
        if (response.success && response.data?.company) {
          setCompanyProfile({
            name: response.data.company.company_name || "Company",
            logo: response.data.company.company_logo || null,
            company_id: response.data.company.company_id,
          });
          
          // Store the company_id for future use
          if (response.data.company.company_id) {
            await SecureStore.setItemAsync(
              "company_id",
              response.data.company.company_id.toString()
            );
          }
        } else {
          setCompanyProfile({
            name: "Company",
            logo: null,
            company_id: null,
          });
        }
      } else {
        // Get company name from SecureStore (faster)
        const storedCompanyName = await SecureStore.getItemAsync("company_name");
        const storedCompanyLogo = await SecureStore.getItemAsync("company_logo");

        if (storedCompanyName) {
          // Use stored data immediately
          setCompanyProfile({
            name: storedCompanyName,
            logo: storedCompanyLogo,
            company_id: companyId,
          });
          console.log("✅ Loaded company from storage:", storedCompanyName);
        } else {
          // Fetch from API if not in storage
          // console.log("🌐 Fetching company data from API...");
          const response = await apiService.getProfile();
          
          if (response.success && response.data?.company) {
            const companyData = response.data.company;
            setCompanyProfile({
              name: companyData.company_name || "Company",
              logo: companyData.company_logo || null,
              company_id: companyData.company_id,
            });

            // Store for future use
            try {
              await SecureStore.setItemAsync(
                "company_name",
                companyData.company_name || ""
              );
              if (companyData.company_logo) {
                await SecureStore.setItemAsync(
                  "company_logo",
                  companyData.company_logo
                );
              }
              console.log("✅ Stored company data for future use");
            } catch (storageError) {
              console.log("Failed to store company data:", storageError);
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading company data:", error);
      setCompanyProfile({
        name: "Company",
        logo: null,
        company_id: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh company data (can be called from child screens)
  const refreshCompanyData = useCallback(() => {
    loadCompanyData();
  }, []);

  // Get current tab from pathname
  const getCurrentTab = () => {
    if (pathname.includes("/home")) return "home";
    if (pathname.includes("/candidates")) return "candidates";
    if (pathname.includes("/jobs")) return "jobs";
    if (pathname.includes("/chats")) return "messages";
    if (pathname.includes("/employer-interviews")) return "employer-interviews";
    if (pathname.includes("/company")) return "profile";
    return "home";
  };

  const currentTab = getCurrentTab();

  // Get page title based on current tab
  const getPageTitle = () => {
    switch (currentTab) {
      case "home":
        return "Manage your hiring pipeline";
      case "candidates":
        return "Discover top talent";
      case "jobs":
        return "Manage your job postings";
      case "messages":
        return "Connect with candidates";
      case "employer-interviews":
        return "Manage your interviews";
      case "profile":
        return "Company settings and profile";
      default:
        return "Manage your hiring pipeline";
    }
  };

  // Get welcome message based on current tab
  const getWelcomeMessage = () => {
    switch (currentTab) {
      case "home":
        return companyProfile.name;
      case "candidates":
        return "Candidate Discovery";
      case "jobs":
        return "Job Management";
      case "messages":
        return "Messages";
      case "employer-interviews":
        return "Interviews";
      case "profile":
        return "Company Profile";
      default:
        return companyProfile.name;
    }
  };

  // Header Component
  const Header = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        {/* Company Logo */}
        {isLoading ? (
          <View
            style={{
              width: 32,
              height: 32,
              marginRight: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.background.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary.teal} />
          </View>
        ) : companyProfile.logo ? (
          <Image
            source={{ uri: companyProfile.logo }}
            style={{
              width: 32,
              height: 32,
              marginRight: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.background.accent,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              marginRight: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.primary.teal + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="business"
              size={18}
              color={theme.colors.primary.teal}
            />
          </View>
        )}

        {/* Company Name and Page Title */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
            }}
          >
            {getWelcomeMessage()}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {getPageTitle()}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        {/* Post Job Button - only show on home and jobs */}
        {(currentTab === "home" || currentTab === "jobs") && (
          <TouchableOpacity
            onPress={() => router.push("/post-job")}
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.primary.teal,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={theme.colors.neutral.white} />
          </TouchableOpacity>
        )}

        {/* Notifications with Real-time Count */}
        <TouchableOpacity
          onPress={() => {
            router.push("/notifications");
            // Refetch count when returning from notifications screen
            setTimeout(() => refetchCount(), 100);
          }}
          style={{
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.full,
            backgroundColor: theme.colors.background.accent,
            position: 'relative',
          }}
          activeOpacity={0.7}
        >
          {loadingCount ? (
            <ActivityIndicator size="small" color={theme.colors.primary.teal} />
          ) : (
            <Ionicons
              name="notifications-outline"
              size={20}
              color={theme.colors.primary.teal}
            />
          )}
          
          {/* Notification badge with animated pulse effect */}
          {!loadingCount && notificationCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: theme.colors.status.error,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 1.5,
                borderColor: theme.colors.background.card,
              }}
            >
              {notificationCount <= 9 ? (
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {notificationCount}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  9+
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Bottom Tab Navigation
  const BottomTabs = () => {
    const tabs = [
      { id: "home", icon: "home", label: "Dashboard", route: "/employer/home" },
      {
        id: "candidates",
        icon: "people",
        label: "Candidates",
        route: "/employer/candidates",
      },
      { id: "jobs", icon: "briefcase", label: "Jobs", route: "/employer/jobs" },
      {
        id: "messages",
        icon: "chatbubbles",
        label: "Messages",
        route: "/employer/chats",
      },
      {
        id: "employer-interviews",
        icon: "videocam",
        label: "Interviews",
        route: "/employer/employer-interviews",
      },
      {
        id: "profile",
        icon: "business",
        label: "Company",
        route: "/employer/company",
      },
    ];

    return (
      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.colors.background.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
          paddingBottom: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
        }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => router.push(tab.route)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: theme.spacing.xs,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === tab.id ? tab.icon : `${tab.icon}-outline`}
              size={22}
              color={
                currentTab === tab.id
                  ? theme.colors.primary.teal
                  : theme.colors.text.tertiary
              }
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily:
                  currentTab === tab.id
                    ? theme.typography.fonts.semiBold
                    : theme.typography.fonts.regular,
                color:
                  currentTab === tab.id
                    ? theme.colors.primary.teal
                    : theme.colors.text.tertiary,
                marginTop: theme.spacing.xs,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.card}
      />

      <View
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <SafeAreaWrapper>
          <Header />

          <View style={{ flex: 1 }}>
            <Stack 
              screenOptions={{ 
                headerShown: false,
              }}
            >
              <Stack.Screen name="home" />
              <Stack.Screen name="candidates" />
              <Stack.Screen name="jobs" />
              <Stack.Screen name="chats" />
              <Stack.Screen name="employer-interviews" />
              <Stack.Screen name="company" />
            </Stack>
          </View>

          <BottomTabs />
        </SafeAreaWrapper>
      </View>
    </>
  );
}