import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function JobSeekerHome() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [jobseekerId, setJobseekerId] = useState(null);
  const [error, setError] = useState(null);

  // Matching Jobs data
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [totalJobsCount, setTotalJobsCount] = useState(0);

  // Stats data
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });

  // Additional stats
  const [interviewsCount, setInterviewsCount] = useState(0);

  // Load user data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when jobseeker ID is available
  useEffect(() => {
    if (jobseekerId) {
      loadMatchingJobs();
      loadProposalsStats();
      loadInterviews();
    }
  }, [jobseekerId]);

  const loadInitialData = async () => {
    try {
      setError(null);
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        setError("User not found. Please log in again.");
        router.replace("/(auth)/login");
        return;
      }

      setJobseekerId(userId);

      // Load user dashboard data
      const response = await apiService.getHomeDashboard(userId, "jobseeker");

      if (response.success) {
        setUserData(response.data);
      } else {
        console.error("❌ Failed to load user data:", response.message);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadMatchingJobs = async (showLoader = true) => {
    if (!jobseekerId) return;

    try {
      if (showLoader && !refreshing) setLoading(true);

      const params = {
        user_id: parseInt(jobseekerId),
        search_query: "",
        limit: 10, // Show top 10 matching jobs
        offset: 0,
        employment_type: "",
        work_mode: "",
        exclude_applied: "true", // Added as per instruction
      };

      if (__DEV__) {
        console.log("📤 Loading matching jobs with params:", params);
      }

      const response = await apiService.getMatchingJobs(params);

      if (__DEV__) {
        console.log("📦 Matching jobs response:", response);
      }

      if (response.success) {
        setMatchingJobs(response.data.jobs || []);
        setTotalJobsCount(response.data.total_count || 0);
      } else {
        console.error("❌ Failed to load matching jobs:", response.message);
        setMatchingJobs([]);
        setTotalJobsCount(0);
      }
    } catch (error) {
      console.error("❌ Error loading matching jobs:", error);
      setMatchingJobs([]);
      setTotalJobsCount(0);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const loadProposalsStats = async () => {
    if (!jobseekerId) return;

    try {
      const params = {
        jobseeker_id: parseInt(jobseekerId),
        status: "all",
        search_query: "",
        limit: 1, // Just need stats
        offset: 0,
      };

      const response = await apiService.getJobseekerProposals(params);

      if (response.success) {
        setStats(
          response.data.stats || {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
          },
        );
      }
    } catch (error) {
      console.error("❌ Error loading proposals stats:", error);
    }
  };

  const loadInterviews = async () => {
    if (!jobseekerId) return;

    try {
      const params = {
        jobseeker_user_id: parseInt(jobseekerId),
        status: "scheduled",
        search_query: "",
        limit: 1, // Just need count
        offset: 0,
      };

      const response = await apiService.getJobseekerInterviews(params);

      if (response.success) {
        setInterviewsCount(response.data.stats?.scheduled || 0);
      }
    } catch (error) {
      console.error("❌ Error loading interviews count:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadInitialData(),
      loadMatchingJobs(false),
      loadProposalsStats(),
      loadInterviews(),
    ]);
    setRefreshing(false);
  }, [jobseekerId]);

  // Stats Cards Component
  const StatsCards = () => (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      {/* Jobs Card */}
      <TouchableOpacity
        onPress={() => router.push("/jobseeker/matching-jobs")}
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.card,
          borderRadius: theme.borderRadius.lg,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xs,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          alignItems: "center",
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["transparent", "rgba(27, 163, 163, 0.05)"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.lg,
          }}
        />
        <Ionicons
          name="briefcase-outline"
          size={24}
          color={theme.colors.primary.teal}
          style={{ marginBottom: theme.spacing.xs }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.primary.teal,
            marginBottom: 2,
          }}
        >
          {totalJobsCount}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          Jobs
        </Text>
      </TouchableOpacity>

      {/* Matches Card */}
      <TouchableOpacity
        onPress={() => router.push("/jobseeker/matches")}
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.card,
          borderRadius: theme.borderRadius.lg,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xs,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          alignItems: "center",
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["transparent", "rgba(255, 138, 61, 0.05)"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.lg,
          }}
        />
        <Ionicons
          name="heart-outline"
          size={24}
          color={theme.colors.primary.orange}
          style={{ marginBottom: theme.spacing.xs }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.primary.orange,
            marginBottom: 2,
          }}
        >
          {stats.total || 0}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          Matches
        </Text>
      </TouchableOpacity>

      {/* Interviews Card */}
      <TouchableOpacity
        onPress={() => router.push("/jobseeker/interviews")}
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.card,
          borderRadius: theme.borderRadius.lg,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xs,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          alignItems: "center",
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["transparent", "rgba(30, 74, 114, 0.05)"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.lg,
          }}
        />
        <Ionicons
          name="calendar-outline"
          size={24}
          color={theme.colors.primary.deepBlue}
          style={{ marginBottom: theme.spacing.xs }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.primary.deepBlue,
            marginBottom: 2,
          }}
        >
          {interviewsCount}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          Interviews
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Job Card Component (matching the structure from matching-jobs screen)
  const JobCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/details/${item.job_id}`)}
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        ...theme.shadows.sm,
      }}
      activeOpacity={0.9}
    >
      {/* Match percentage badge */}
      <View
        style={{
          position: "absolute",
          top: theme.spacing.sm,
          right: theme.spacing.sm,
          zIndex: 1,
        }}
      >
        <LinearGradient
          colors={
            item.match_percentage >= 80
              ? [theme.colors.status.success, "#0D9488"]
              : item.match_percentage >= 60
                ? [theme.colors.primary.teal, theme.colors.secondary.darkTeal]
                : [
                    theme.colors.primary.orange,
                    theme.colors.secondary.darkOrange,
                  ]
          }
          style={{
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.neutral.white,
            }}
          >
            {item.match_percentage}% Match
          </Text>
        </LinearGradient>
      </View>

      {/* Company header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        {item.profile_img ? (
          <Image
            source={{ uri: item.profile_img }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              marginRight: theme.spacing.sm,
              borderWidth: 2,
              borderColor: theme.colors.primary.teal,
            }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.background.accent,
              justifyContent: "center",
              alignItems: "center",
              marginRight: theme.spacing.sm,
              borderWidth: 2,
              borderColor: theme.colors.primary.teal,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.teal,
              }}
            >
              {item.company_name?.charAt(0)?.toUpperCase() || "C"}
            </Text>
          </View>
        )}

        <View
          style={{ flex: 1, paddingRight: theme.spacing.xl + theme.spacing.md }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
            }}
            numberOfLines={1}
          >
            {item.company_name}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
            }}
          >
            {item.posted_time}
          </Text>
        </View>
      </View>

      {/* Job Title */}
      <Text
        style={{
          fontSize: theme.typography.sizes.md,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.xs,
        }}
        numberOfLines={2}
      >
        {item.job_title}
      </Text>

      {/* Job Details */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: theme.spacing.sm,
          gap: theme.spacing.md,
        }}
      >
        {item.location && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.colors.text.tertiary}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
        )}

        {item.experience_range && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="briefcase-outline"
              size={14}
              color={theme.colors.text.tertiary}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
              numberOfLines={1}
            >
              {item.experience_range}
            </Text>
          </View>
        )}

        {item.work_mode && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="laptop-outline"
              size={14}
              color={theme.colors.text.tertiary}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
              numberOfLines={1}
            >
              {item.work_mode.replace("_", " ")}
            </Text>
          </View>
        )}
      </View>

      {/* Salary */}
      {item.salary_range && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: theme.spacing.sm,
          }}
        >
          <Ionicons
            name="cash-outline"
            size={16}
            color={theme.colors.primary.teal}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.primary.teal,
            }}
            numberOfLines={1}
          >
            {item.salary_range}
          </Text>
        </View>
      )}

      {/* Matching Skills */}
      {item.matching_skills && item.matching_skills.length > 0 && (
        <View style={{ marginBottom: theme.spacing.sm }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Matching Skills ({item.matching_skills_count}/
            {item.total_required_skills})
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.spacing.xs,
            }}
          >
            {item.matching_skills.slice(0, 4).map((skill, index) => (
              <View
                key={`${item.id}_skill_${index}`}
                style={{
                  backgroundColor: theme.colors.background.accent,
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderWidth: 1,
                  borderColor: theme.colors.primary.teal,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.primary.teal,
                  }}
                >
                  {skill}
                </Text>
              </View>
            ))}
            {item.matching_skills.length > 4 && (
              <View
                style={{
                  backgroundColor: theme.colors.neutral.lightGray,
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderWidth: 1,
                  borderColor: theme.colors.border.light,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  +{item.matching_skills.length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Apply / Applied Button */}
      <TouchableOpacity
        style={{
          borderRadius: theme.borderRadius.md,
          overflow: "hidden",
        }}
        onPress={() => router.push(`/details/${item.job_id}`)}
        activeOpacity={0.9}
      >
        {item.has_applied ? (
          <LinearGradient
            colors={[theme.colors.status.info, theme.colors.status.info]}
            style={{
              paddingVertical: theme.spacing.sm,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.neutral.white,
                marginRight: theme.spacing.xs,
              }}
            >
              Application Submitted
            </Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={[
              theme.colors.primary.teal,
              theme.colors.secondary.darkTeal,
            ]}
            style={{
              paddingVertical: theme.spacing.sm,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.neutral.white,
                marginRight: theme.spacing.xs,
              }}
            >
              Apply Now
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={theme.colors.neutral.white}
            />
          </LinearGradient>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Empty State for Jobs
  const EmptyJobsState = () => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        marginHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        marginBottom: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.colors.background.accent,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: theme.spacing.md,
        }}
      >
        <Ionicons
          name="briefcase-outline"
          size={28}
          color={theme.colors.primary.teal}
        />
      </View>
      <Text
        style={{
          fontSize: theme.typography.sizes.base,
          fontFamily: theme.typography.fonts.semiBold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.xs,
          textAlign: "center",
        }}
      >
        No Matching Jobs Yet
      </Text>
      <Text
        style={{
          fontSize: theme.typography.sizes.sm,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.secondary,
          textAlign: "center",
          lineHeight: theme.typography.sizes.sm * 1.4,
        }}
      >
        Add more skills to your profile to see matching jobs
      </Text>
    </View>
  );

  // Create FlatList data
  const createFlatListData = () => {
    const data = [{ type: "stats", id: "stats" }];

    // Add matching jobs section
    data.push({ type: "jobs-header", id: "jobs-header" });

    if (matchingJobs.length > 0) {
      // Show latest 10 matching jobs
      matchingJobs.forEach((job) => {
        data.push({ type: "job", ...job });
      });
    } else {
      data.push({ type: "empty-jobs", id: "empty-jobs" });
    }

    return data;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "stats":
        return <StatsCards />;

      case "jobs-header":
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
              Matching Jobs {totalJobsCount > 0 && `(${totalJobsCount})`}
            </Text>
            {matchingJobs.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/jobseeker/matching-jobs")}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.primary.teal,
                  }}
                >
                  See All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case "job":
        return <JobCard item={item} />;

      case "empty-jobs":
        return <EmptyJobsState />;

      default:
        return null;
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
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
        <ActivityIndicator
          size="large"
          color={theme.colors.primary.teal}
          style={{ marginBottom: theme.spacing.md }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
            textAlign: "center",
          }}
        >
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  // Error Screen
  if (error && !userData) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        }}
      >
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
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.status.error}
          style={{ marginBottom: theme.spacing.lg }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
            textAlign: "center",
            marginBottom: theme.spacing.sm,
          }}
        >
          Oops! Something went wrong
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.secondary,
            textAlign: "center",
            marginBottom: theme.spacing.xl,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadInitialData}
          style={{
            backgroundColor: theme.colors.primary.teal,
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.neutral.white,
            }}
          >
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      {/* Welcome Header */}
      {userData && (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
            }}
          >
            Welcome back, {userData.first_name}!
          </Text>
          {userData.profile?.current_job_title && (
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.xs,
              }}
            >
              {userData.profile.current_job_title}
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={createFlatListData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.job_id?.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.teal]}
            tintColor={theme.colors.primary.teal}
          />
        }
      />
    </View>
  );
}
