import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function MatchingJobsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  // Jobs data
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Add debounce timer ref
  const searchTimeoutRef = useRef(null);

  const LIMIT = 10;

  // Load user ID on mount
  useEffect(() => {
    loadUserId();
  }, []);

  // Load jobs when userId is available (only on initial load)
  useEffect(() => {
    if (userId) {
      loadJobs(true);
    }
  }, [userId]);

  // Debounced search effect - separate from initial load
  useEffect(() => {
    if (!userId) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      loadJobs(true);
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedEmploymentType, selectedWorkMode]);

  const loadUserId = async () => {
    try {
      const id = await SecureStore.getItemAsync("user_id");

      if (!id) {
        setError("User not found. Please log in again.");
        router.replace("/(auth)/login");
        return;
      }

      setUserId(id);
    } catch (error) {
      console.error("❌ Failed to get user ID:", error);
      setError("Failed to load user data.");
    }
  };

  const loadJobs = useCallback(
    async (reset = false, showLoader = true) => {
      if (!userId) return;
      if (!reset && !hasMore) return;

      try {
        if (showLoader && !refreshing) {
          if (reset) {
            // Only show full-screen loader on initial load (when currentPage is 0)
            if (currentPage === 0) {
              setLoading(true);
            } else {
              // Show searching indicator for filter/search changes
              setIsSearching(true);
            }
          } else {
            setLoadingMore(true);
          }
        }

        const offset = reset ? 0 : currentPage * LIMIT;

        const params = {
          user_id: parseInt(userId),
          search_query: searchQuery,
          limit: LIMIT,
          offset: offset,
          employment_type: selectedEmploymentType,
          work_mode: selectedWorkMode,
          exclude_applied: "true",
        };

        if (__DEV__) {
          console.log("📤 Loading matching jobs with params:", params);
        }

        const response = await apiService.getMatchingJobs(params);

        if (__DEV__) {
          console.log("📦 Matching jobs response:", response);
        }

        if (response.success) {
          const newJobs = response.data.jobs || [];

          setJobs((prevJobs) => (reset ? newJobs : [...prevJobs, ...newJobs]));
          setCurrentPage((prevPage) => (reset ? 1 : prevPage + 1));
          setTotalCount(response.data.total_count || 0);
          setHasMore(response.data.pagination?.has_more || false);
          setError(null);
        } else {
          console.error("❌ Failed to load matching jobs:", response.message);
          if (reset) {
            setJobs([]);
          }
          setError(response.message);
        }
      } catch (error) {
        console.error("❌ Error loading matching jobs:", error);
        if (reset) {
          setJobs([]);
        }
        setError("Failed to load jobs. Please try again.");
      } finally {
        if (showLoader) {
          setLoading(false);
          setIsSearching(false);
          setLoadingMore(false);
        }
      }
    },
    [
      userId,
      currentPage,
      hasMore,
      refreshing,
      searchQuery,
      selectedEmploymentType,
      selectedWorkMode,
    ],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs(true, false);
    setRefreshing(false);
  }, [loadJobs]);

  const loadMoreJobs = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadJobs(false, true);
    }
  }, [loadingMore, hasMore, loadJobs]);

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedEmploymentType("");
    setSelectedWorkMode("");
    setShowFilters(false);
  }, []);

  // Job Card Component - Memoized to prevent unnecessary re-renders
  const JobCard = React.memo(({ item }) => (
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
  ));

  // Empty State
  const EmptyState = React.memo(() => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        marginHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        marginTop: theme.spacing.lg,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.background.accent,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: theme.spacing.md,
        }}
      >
        <Ionicons
          name="briefcase-outline"
          size={40}
          color={theme.colors.primary.teal}
        />
      </View>
      <Text
        style={{
          fontSize: theme.typography.sizes.lg,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.xs,
          textAlign: "center",
        }}
      >
        No Matching Jobs Found
      </Text>
      <Text
        style={{
          fontSize: theme.typography.sizes.sm,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.secondary,
          textAlign: "center",
          lineHeight: theme.typography.sizes.sm * 1.5,
          marginBottom: theme.spacing.lg,
        }}
      >
        {searchQuery || selectedEmploymentType || selectedWorkMode
          ? "Try adjusting your filters to see more jobs"
          : "Add more skills to your profile to see matching jobs"}
      </Text>
      {(searchQuery || selectedEmploymentType || selectedWorkMode) && (
        <TouchableOpacity
          onPress={clearFilters}
          style={{
            backgroundColor: theme.colors.primary.teal,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.neutral.white,
            }}
          >
            Clear Filters
          </Text>
        </TouchableOpacity>
      )}
    </View>
  ));

  // Filter Pills Component
  const FilterPills = React.memo(() => {
    const employmentTypes = [
      "full_time",
      "part_time",
      "contract",
      "freelance",
      "internship",
    ];
    const workModes = ["remote", "hybrid", "on_site"];

    if (!showFilters) return null;

    return (
      <View
        style={{
          backgroundColor: theme.colors.background.card,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        }}
      >
        {/* Employment Type */}
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.semiBold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
          }}
        >
          Employment Type
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.md,
          }}
        >
          {employmentTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() =>
                setSelectedEmploymentType(
                  selectedEmploymentType === type ? "" : type,
                )
              }
              style={{
                backgroundColor:
                  selectedEmploymentType === type
                    ? theme.colors.primary.teal
                    : theme.colors.background.accent,
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderWidth: 1,
                borderColor:
                  selectedEmploymentType === type
                    ? theme.colors.primary.teal
                    : theme.colors.border.light,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color:
                    selectedEmploymentType === type
                      ? theme.colors.neutral.white
                      : theme.colors.text.secondary,
                }}
              >
                {type
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Work Mode */}
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.semiBold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
          }}
        >
          Work Mode
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.xs,
          }}
        >
          {workModes.map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() =>
                setSelectedWorkMode(selectedWorkMode === mode ? "" : mode)
              }
              style={{
                backgroundColor:
                  selectedWorkMode === mode
                    ? theme.colors.primary.teal
                    : theme.colors.background.accent,
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderWidth: 1,
                borderColor:
                  selectedWorkMode === mode
                    ? theme.colors.primary.teal
                    : theme.colors.border.light,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color:
                    selectedWorkMode === mode
                      ? theme.colors.neutral.white
                      : theme.colors.text.secondary,
                }}
              >
                {mode
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  });

  // Footer Component
  const FooterComponent = React.memo(() => {
    if (loadingMore) {
      return (
        <View
          style={{ paddingVertical: theme.spacing.lg, alignItems: "center" }}
        >
          <ActivityIndicator size="small" color={theme.colors.primary.teal} />
        </View>
      );
    }

    if (!hasMore && jobs.length > 0) {
      return (
        <View
          style={{ paddingVertical: theme.spacing.lg, alignItems: "center" }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
            }}
          >
            No more jobs to load
          </Text>
        </View>
      );
    }

    return null;
  });

  const renderItem = useCallback(({ item }) => <JobCard item={item} />, []);
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Loading Screen - Only show on initial load, not during search/filter changes
  if (loading && !isSearching) {
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
          Finding matching jobs...
        </Text>
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

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.background.card,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: theme.spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: theme.spacing.md }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.xl,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
              }}
            >
              Matching Jobs
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
            >
              {totalCount} jobs found
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.neutral.lightGray,
              borderRadius: theme.borderRadius.lg,
              paddingHorizontal: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
            }}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.colors.text.tertiary}
              style={{ marginRight: theme.spacing.sm }}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.primary,
                paddingVertical: theme.spacing.sm,
              }}
              placeholder="Search jobs..."
              placeholderTextColor={theme.colors.text.placeholder}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {searchQuery !== "" && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: showFilters
                ? theme.colors.primary.teal
                : theme.colors.neutral.lightGray,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.sm,
              borderWidth: 1,
              borderColor: showFilters
                ? theme.colors.primary.teal
                : theme.colors.border.light,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="filter"
              size={20}
              color={
                showFilters
                  ? theme.colors.neutral.white
                  : theme.colors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <FilterPills />

      {/* Jobs List */}
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isSearching}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.teal]}
            tintColor={theme.colors.primary.teal}
          />
        }
        ListEmptyComponent={EmptyState}
        ListFooterComponent={FooterComponent}
        onEndReached={loadMoreJobs}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
}
