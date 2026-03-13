import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function EmployerHome() {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [employerUserId, setEmployerUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    company: {
      name: "",
      plan: "Free",
      planType: "free",
      planExpiry: null,
    },
    stats: {
      activeJobs: 0,
      totalCandidateMatches: 0,
      newMatches: 0,
      proposalsSent: 0,
      proposalsAccepted: 0,
      hiredThisMonth: 0,
    },
    matchedCandidates: [],
  });

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Load dashboard when user data is available
  useEffect(() => {
    if (employerUserId && companyId) {
      loadDashboard();
    }
  }, [employerUserId, companyId]);

  const loadUserData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const storedCompanyId = await SecureStore.getItemAsync("company_id");

      if (userId && storedCompanyId) {
        setEmployerUserId(userId);
        setCompanyId(storedCompanyId);
      } else {
        Alert.alert("Error", "User session not found. Please login again.");
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("❌ Failed to load user data:", error);
      Alert.alert("Error", "Failed to load user data");
    }
  };

  const loadDashboard = async () => {
    if (!employerUserId || !companyId) return;

    try {
      setIsLoading(true);

      const params = {
        employer_user_id: parseInt(employerUserId),
        company_id: parseInt(companyId),
        match_limit: 5, // Show 5 recent matches
      };

      if (__DEV__) {
        console.log("📤 Loading dashboard with params:", params);
      }

      const response = await apiService.getEmployerHomeDashboard(params);

      // if (__DEV__) {
      //   console.log('📦 Dashboard response:', response);
      // }

      if (response.success) {
        setDashboardData(response.data);
      } else {
        console.error("❌ Failed to load dashboard:", response.message);
        // Alert.alert('Error', response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error("❌ Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [employerUserId, companyId]);

  // Stats Cards Component
  const StatsCards = () => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      {[
        {
          title: "Active Jobs",
          value: dashboardData.stats.activeJobs,
          icon: "briefcase-outline",
          color: theme.colors.primary.teal,
          onPress: () => router.push("/employer/jobs"),
        },
        {
          title: "New Matches",
          value: dashboardData.stats.newMatches,
          icon: "people-outline",
          color: theme.colors.primary.orange,
          onPress: () => router.push("/employer/candidates"),
        },
        {
          title: "Proposals Sent",
          value: dashboardData.stats.proposalsSent,
          icon: "paper-plane-outline",
          color: theme.colors.status.success,
          onPress: () => router.push("/employer/candidates"),
        },
        {
          title: "Accepted",
          value: dashboardData.stats.proposalsAccepted,
          icon: "checkmark-circle-outline",
          color: theme.colors.primary.deepBlue,
          onPress: () => router.push("/employer/candidates"),
        },
      ].map((stat, index) => (
        <TouchableOpacity
          key={index}
          onPress={stat.onPress}
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            width: (width - theme.spacing.lg * 2 - theme.spacing.sm) / 2,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            ...theme.shadows.sm,
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["transparent", `${stat.color}10`]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: theme.borderRadius.lg,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={stat.icon}
              size={20}
              color={stat.color}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
                flex: 1,
              }}
            >
              {stat.title}
            </Text>
          </View>
          <Text
            style={{
              fontSize: theme.typography.sizes.xxl,
              fontFamily: theme.typography.fonts.bold,
              color: stat.color,
              marginTop: theme.spacing.xs,
            }}
          >
            {stat.value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Candidate Match Card Component
  // Enhanced Candidate Match Card Component with Availability Status
  const CandidateMatchCard = ({ item }) => {
    const getStatusColor = () => {
      // Check if proposal sent but not accepted yet
      if (
        item.status === "discovered" &&
        item.proposal_sent &&
        !item.application_status
      ) {
        return theme.colors.primary.deepBlue;
      }

      switch (item.application_status) {
        case "submitted":
          return theme.colors.primary.orange;
        case "under_review":
          return theme.colors.primary.orange;
        case "shortlisted":
          return theme.colors.status.success;
        case "interview_scheduled":
          return "#8B5CF6"; // Violet/Purple
        case "interviewed":
          return "#6366F1"; // Indigo
        case "offered":
          return theme.colors.secondary.darkTeal;
        case "hired":
          return theme.colors.status.success;
        case "rejected":
          return theme.colors.status.error;
        default:
          return item.status === "discovered"
            ? theme.colors.primary.orange
            : theme.colors.text.tertiary;
      }
    };

    const getStatusText = () => {
      // Check if proposal sent but not accepted yet
      if (
        item.status === "discovered" &&
        item.proposal_sent &&
        !item.application_status
      ) {
        return "Awaiting Response";
      }

      switch (item.application_status) {
        case "submitted":
          return item.source === "recruiter_invite" ? "Accepted" : "Applied";
        case "under_review":
          return "Under Review";
        case "shortlisted":
          return "Shortlisted";
        case "interview_scheduled":
          return "Interview Scheduled";
        case "interviewed":
          return "Interviewed";
        case "offered":
          return "Offer Extended";
        case "hired":
          return "Hired";
        case "rejected":
          return "Rejected";
        default:
          return item.status === "discovered" ? "New Match" : "";
      }
    };

    const getAvailabilityConfig = (status) => {
      switch (status) {
        case "open_to_work":
          return {
            label: "Open to work",
            icon: "checkmark-circle",
            color: theme.colors.status.success,
            bgColor: `${theme.colors.status.success}15`,
          };
        case "not_looking":
          return {
            label: "Not looking",
            icon: "pause-circle",
            color: theme.colors.status.error,
            bgColor: `${theme.colors.status.error}15`,
          };
        case "passively_looking":
          return {
            label: "Passively looking",
            icon: "eye",
            color: theme.colors.primary.orange,
            bgColor: `${theme.colors.primary.orange}15`,
          };
        default:
          return {
            label: "Not specified",
            icon: "help-circle",
            color: theme.colors.text.tertiary,
            bgColor: theme.colors.background.accent,
          };
      }
    };

    const availability = getAvailabilityConfig(item.availability_status);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/candidate-details/${item.user_id}`)}
        style={{
          backgroundColor: theme.colors.background.card,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          ...theme.shadows.md,
        }}
        activeOpacity={0.9}
      >
        {/* Header with Profile and Match Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: theme.spacing.md,
          }}
        >
          {/* Profile Image/Avatar */}
          <View style={{ position: "relative", marginRight: theme.spacing.md }}>
            {item.profileImage ? (
              <Image
                source={{ uri: item.profileImage }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 2,
                  borderColor: getStatusColor(),
                }}
              />
            ) : (
              <LinearGradient
                colors={
                  item.status === "discovered"
                    ? [
                        theme.colors.primary.orange,
                        theme.colors.secondary.darkOrange,
                      ]
                    : [
                        theme.colors.primary.teal,
                        theme.colors.secondary.darkTeal,
                      ]
                }
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: getStatusColor(),
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.lg,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {item.candidateInitials}
                </Text>
              </LinearGradient>
            )}

            {/* Availability Indicator Badge */}
            <View
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                backgroundColor: availability.color,
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: theme.colors.background.card,
              }}
            >
              <Ionicons
                name={availability.icon}
                size={14}
                color={theme.colors.neutral.white}
              />
            </View>
          </View>

          {/* Candidate Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
              numberOfLines={1}
            >
              {item.candidateName}
            </Text>

            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
              numberOfLines={1}
            >
              {item.matchedJobTitle}
            </Text>

            {/* Availability Status Pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                backgroundColor: availability.bgColor,
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                marginTop: theme.spacing.xs,
              }}
            >
              <Ionicons
                name={availability.icon}
                size={12}
                color={availability.color}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: availability.color,
                }}
              >
                {availability.label}
              </Text>
            </View>
          </View>

          {/* Right Side Badges */}
          <View
            style={{ alignItems: "flex-end", marginLeft: theme.spacing.sm }}
          >
            {/* Application Status Badge */}
            {getStatusText() ? (
              <View
                style={{
                  backgroundColor: `${getStatusColor()}15`,
                  borderRadius: theme.borderRadius.md,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  marginBottom: theme.spacing.sm,
                  borderWidth: 1,
                  borderColor: getStatusColor(),
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.bold,
                    color: getStatusColor(),
                  }}
                >
                  {getStatusText()}
                </Text>
              </View>
            ) : null}

            {/* Match Percentage Badge */}
            <LinearGradient
              colors={
                item.matchPercentage >= 80
                  ? [theme.colors.status.success, "#0D9488"]
                  : item.matchPercentage >= 60
                    ? [
                        theme.colors.primary.teal,
                        theme.colors.secondary.darkTeal,
                      ]
                    : [
                        theme.colors.primary.orange,
                        theme.colors.secondary.darkOrange,
                      ]
              }
              style={{
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                {item.matchPercentage}%
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.border.light,
            marginBottom: theme.spacing.md,
          }}
        />

        {/* Details Row */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: theme.spacing.md,
            gap: theme.spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.xs,
              }}
            >
              <Ionicons
                name="location"
                size={14}
                color={theme.colors.primary.teal}
              />
            </View>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              }}
            >
              {item.location}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.xs,
              }}
            >
              <Ionicons
                name="briefcase"
                size={14}
                color={theme.colors.primary.orange}
              />
            </View>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              }}
            >
              {item.experience}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.xs,
              }}
            >
              <Ionicons
                name="time"
                size={14}
                color={theme.colors.text.tertiary}
              />
            </View>
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.tertiary,
              }}
            >
              {item.discoveredTime}
            </Text>
          </View>
        </View>

        {/* Skills Section */}
        {item.skills && item.skills.length > 0 && (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: theme.spacing.sm,
              }}
            >
              <Ionicons
                name="code-slash"
                size={14}
                color={theme.colors.text.secondary}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.secondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Top Skills
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: theme.spacing.xs,
              }}
            >
              {item.skills.slice(0, 4).map((skill, index) => (
                <View
                  key={`${item.id}_skill_${index}_${skill}`}
                  style={{
                    backgroundColor: theme.colors.background.accent,
                    borderRadius: theme.borderRadius.md,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderWidth: 1,
                    borderColor: theme.colors.primary.teal,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.primary.teal,
                    }}
                  >
                    {skill}
                  </Text>
                </View>
              ))}
              {item.skills.length > 4 && (
                <View
                  style={{
                    backgroundColor: theme.colors.neutral.lightGray,
                    borderRadius: theme.borderRadius.md,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderWidth: 1,
                    borderColor: theme.colors.border.light,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.tertiary,
                    }}
                  >
                    +{item.skills.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Loading State
  const LoadingState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: theme.spacing.xxxl,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary.teal} />
      <Text
        style={{
          marginTop: theme.spacing.lg,
          fontSize: theme.typography.sizes.base,
          fontFamily: theme.typography.fonts.medium,
          color: theme.colors.text.secondary,
        }}
      >
        Loading dashboard...
      </Text>
    </View>
  );

  // Empty State
  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxxl,
      }}
    >
      <LinearGradient
        colors={[
          theme.colors.background.accent,
          theme.colors.background.primary,
        ]}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: theme.spacing.xl,
        }}
      >
        <Ionicons name="people" size={40} color={theme.colors.primary.teal} />
      </LinearGradient>

      <Text
        style={{
          fontSize: theme.typography.sizes.xl,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          textAlign: "center",
        }}
      >
        No Candidate Matches Yet
      </Text>

      <Text
        style={{
          fontSize: theme.typography.sizes.base,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.secondary,
          textAlign: "center",
          lineHeight: theme.typography.sizes.base * 1.5,
          marginBottom: theme.spacing.xl,
        }}
      >
        Create job postings to start discovering matching candidates
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/post-job")}
        style={{
          backgroundColor: theme.colors.primary.teal,
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.xxl,
          paddingVertical: theme.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          ...theme.shadows.md,
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add-circle"
          size={20}
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
          Post a Job
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Create FlatList data
  const createFlatListData = () => {
    const data = [{ type: "stats", id: "stats" }];

    if (dashboardData.matchedCandidates.length > 0) {
      data.push({ type: "matches-header", id: "matches-header" });
      dashboardData.matchedCandidates.forEach((item) => {
        data.push({ type: "candidate_match", ...item });
      });
    }

    return data;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "stats":
        return <StatsCards />;

      case "matches-header":
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: theme.spacing.lg,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
              }}
            >
              Recent Candidate Matches
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/employer/candidates")}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.primary.teal,
                }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>
        );

      case "candidate_match":
        return <CandidateMatchCard item={item} />;

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          theme.colors.background.accent,
          "rgba(27, 163, 163, 0.02)",
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

      {isLoading ? (
        <LoadingState />
      ) : dashboardData.matchedCandidates.length === 0 ? (
        <View style={{ flex: 1 }}>
          <StatsCards />
          <EmptyState />
        </View>
      ) : (
        <FlatList
          data={createFlatListData()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary.teal]}
              tintColor={theme.colors.primary.teal}
            />
          }
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        />
      )}
    </View>
  );
}
