import apiService from "@/services/apiService";
import theme from "@/theme";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList, Image, RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

// Header Component - MOVED OUTSIDE
const Header = React.memo(
  ({
    totalCount,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    stats,
  }) => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        marginBottom: theme.spacing.md,
      }}
    >
      {/* Title */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: theme.spacing.md,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
            }}
          >
            Interviews
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {totalCount} total interview{totalCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/schedule-interview")}
          style={{
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.full,
            backgroundColor: theme.colors.primary.teal,
          }}
          activeOpacity={0.7}
        >
          <AntDesign name="plus" size={20} color={theme.colors.neutral.white} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.neutral.lightGray,
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        <Ionicons
          name="search"
          size={16}
          color={theme.colors.text.tertiary}
          style={{ marginRight: theme.spacing.sm }}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search candidates..."
          placeholderTextColor={theme.colors.text.placeholder}
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.primary,
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close"
              size={16}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        {[
          {
            key: "applications",
            label: "Applications",
            count: stats.applications.total,
          },
          {
            key: "proposals",
            label: "Proposals",
            count: stats.proposals.total,
          },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.borderRadius.lg,
              backgroundColor:
                activeTab === tab.key
                  ? theme.colors.primary.teal
                  : theme.colors.background.accent,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily:
                  activeTab === tab.key
                    ? theme.typography.fonts.semiBold
                    : theme.typography.fonts.medium,
                color:
                  activeTab === tab.key
                    ? theme.colors.neutral.white
                    : theme.colors.text.primary,
              }}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.bold,
                  color:
                    activeTab === tab.key
                      ? theme.colors.neutral.white
                      : theme.colors.primary.teal,
                  marginTop: 2,
                }}
              >
                {tab.count}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Filters */}
      <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
        {[
          { key: "all", label: "All" },
          { key: "scheduled", label: "Scheduled" },
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setStatusFilter(filter.key)}
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.borderRadius.full,
              backgroundColor:
                statusFilter === filter.key
                  ? theme.colors.primary.teal
                  : theme.colors.background.accent,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily:
                  statusFilter === filter.key
                    ? theme.typography.fonts.semiBold
                    : theme.typography.fonts.medium,
                color:
                  statusFilter === filter.key
                    ? theme.colors.neutral.white
                    : theme.colors.text.secondary,
              }}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
);

// Interview Card Component - MOVED OUTSIDE
const InterviewCard = React.memo(({ item, onJoinInterview }) => {
  const getStatusColor = () => {
    switch (item.interview_status) {
      case "scheduled":
        return theme.colors.primary.teal;
      case "completed":
        return theme.colors.status.success;
      case "cancelled":
        return theme.colors.status.error;
      default:
        return theme.colors.text.tertiary;
    }
  };

  return (
    <View
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
    >
      {/* Status Badge */}
      <View
        style={{
          position: "absolute",
          top: theme.spacing.sm,
          right: theme.spacing.sm,
          backgroundColor: getStatusColor() + "20",
          borderRadius: theme.borderRadius.sm,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.semiBold,
            color: getStatusColor(),
            textTransform: "capitalize",
          }}
        >
          {item.interview_status}
        </Text>
      </View>

      {/* Candidate Info */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        <View style={{ marginRight: theme.spacing.md }}>
          {item.candidate_image ? (
            <Image
              source={{ uri: item.candidate_image }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: getStatusColor(),
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.primary.teal,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                {item.candidate_initials}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, paddingRight: theme.spacing.xl }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
            }}
            numberOfLines={1}
          >
            {item.candidate_name}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
            numberOfLines={1}
          >
            {item.current_position}
          </Text>
        </View>
      </View>

      {/* Job Title */}
      <View
        style={{
          backgroundColor: theme.colors.background.accent,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.primary,
          }}
          numberOfLines={1}
        >
          {item.job_title}
        </Text>
      </View>

      {/* Interview Details */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.md,
          marginBottom: theme.spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="calendar-outline"
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
          >
            {item.scheduled_datetime}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="time-outline"
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
          >
            {item.duration_minutes} mins
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name={item.interview_type === 'video' ? 'videocam-outline' : 'call-outline'}
            size={14}
            color={theme.colors.text.tertiary}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textTransform: "capitalize",
            }}
          >
            {item.interview_type}
          </Text>
        </View>
      </View>

      {/* Time Until */}
      {item.interview_status === "scheduled" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: theme.spacing.sm,
          }}
        >
          <Ionicons
            name={item.can_join ? "radio-button-on" : "alarm-outline"}
            size={16}
            color={
              item.can_join
                ? theme.colors.status.success
                : theme.colors.primary.orange
            }
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: item.can_join
                ? theme.colors.status.success
                : theme.colors.primary.orange,
            }}
          >
            {item.time_until}
          </Text>
        </View>
      )}

      {/* Actions */}
      {item.interview_status === "scheduled" && (
        <TouchableOpacity
          onPress={() => onJoinInterview(item)}
          style={{
            backgroundColor: item.can_join
              ? theme.colors.primary.teal
              : theme.colors.neutral.gray,
            borderRadius: theme.borderRadius.lg,
            paddingVertical: theme.spacing.sm,
            alignItems: "center",
          }}
          activeOpacity={0.8}
          disabled={!item.can_join}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.neutral.white,
            }}
          >
            {item.can_join ? "Join Interview" : "Not Yet Started"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// Empty State Component - MOVED OUTSIDE
const EmptyState = React.memo(({ searchQuery }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxxl * 2,
      minHeight: 400,
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
        marginBottom: theme.spacing.lg,
      }}
    >
      <Ionicons
        name="calendar-outline"
        size={32}
        color={theme.colors.primary.teal}
      />
    </View>

    <Text
      style={{
        fontSize: theme.typography.sizes.lg,
        fontFamily: theme.typography.fonts.semiBold,
        color: theme.colors.text.primary,
        textAlign: "center",
        marginBottom: theme.spacing.sm,
      }}
    >
      No Interviews Yet
    </Text>

    <Text
      style={{
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.secondary,
        textAlign: "center",
      }}
    >
      {searchQuery
        ? "No interviews match your search"
        : "Schedule interviews for your candidates"}
    </Text>
  </View>
));

// Footer Loading Component - MOVED OUTSIDE
const FooterLoading = React.memo(({ loadingMore }) => {
  if (!loadingMore) return null;

  return (
    <View style={{ paddingVertical: theme.spacing.lg }}>
      <ActivityIndicator size="small" color={theme.colors.primary.teal} />
    </View>
  );
});

export default function EmployerInterviews() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [error, setError] = useState(null);

  const [interviews, setInterviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [activeTab, setActiveTab] = useState("applications");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    applications: { total: 0, scheduled: 0, completed: 0, cancelled: 0 },
    proposals: { total: 0, scheduled: 0, completed: 0, cancelled: 0 },
  });

  const LIMIT = 10;

  const isMounted = useRef(true);
  const isInitialMount = useRef(true);
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef(null); // ADD THIS

  useEffect(() => {
    loadUserData();

    return () => {
      isMounted.current = false;
      // Clean up search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Load interviews after user data is available
  useEffect(() => {
    if (userId && companyId && isInitialMount.current) {
      console.log("✅ User data loaded, loading interviews...");
      loadInterviews(true);
      isInitialMount.current = false;
    }
  }, [userId, companyId]);

  // Reload when TAB or STATUS FILTER changes (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount.current && userId && companyId && !loadingRef.current) {
      console.log("🔄 Filter/tab changed, reloading interviews...");
      loadInterviews(true);
    }
  }, [activeTab, statusFilter]); // REMOVED searchQuery from here

  // DEBOUNCED SEARCH EFFECT - ADD THIS NEW EFFECT
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Skip if initial mount or no user data
    if (isInitialMount.current || !userId || !companyId) {
      return;
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      if (!loadingRef.current) {
        console.log("🔍 Search query changed, reloading interviews...");
        loadInterviews(true);
      }
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Only watch searchQuery

  const loadUserData = async () => {
    try {
      const id = await SecureStore.getItemAsync("user_id");
      const cId = await SecureStore.getItemAsync("company_id");

      console.log("👤 Loaded user data:", { userId: id, companyId: cId });

      if (!id || !cId) {
        setError("User not found. Please log in again.");
        router.replace("/(auth)/employer-login");
        return;
      }

      setUserId(id);
      setCompanyId(cId);
    } catch (error) {
      console.error("❌ Failed to get user data:", error);
      setError("Failed to load user data.");
      setLoading(false);
    }
  };

  const loadInterviews = async (reset = false, showLoader = true) => {
    if (loadingRef.current) {
      console.log("⏸️ Already loading, skipping...");
      return;
    }

    if (!userId || !companyId) {
      console.log("⏸️ No user data, skipping load...");
      return;
    }

    if (!reset && !hasMore) {
      console.log("⏸️ No more data, skipping load...");
      return;
    }

    try {
      loadingRef.current = true;

      if (showLoader && !refreshing) {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
      }

      const offset = reset ? 0 : currentPage * LIMIT;

      const params = {
        employer_user_id: parseInt(userId),
        company_id: parseInt(companyId),
        tab: activeTab,
        status: statusFilter,
        search_query: searchQuery,
        limit: LIMIT,
        offset: offset,
      };

      console.log("📤 Loading interviews:", { reset, offset, params });

      const response = await apiService.getEmployerInterviews(params);

      if (!isMounted.current) return;

      if (response.success) {
        const newInterviews = response.data.interviews || [];

        console.log("✅ Loaded interviews:", {
          count: newInterviews.length,
          total: response.data.total_count,
          hasMore: response.data.pagination?.has_more,
        });

        if (reset) {
          setInterviews(newInterviews);
          setCurrentPage(1);
        } else {
          setInterviews((prev) => [...prev, ...newInterviews]);
          setCurrentPage((prev) => prev + 1);
        }

        setTotalCount(response.data.total_count || 0);
        setStats(response.data.stats || stats);
        setHasMore(response.data.pagination?.has_more || false);
        setError(null);
      } else {
        console.error("❌ Failed to load interviews:", response.message);
        if (reset) {
          setInterviews([]);
          setTotalCount(0);
          setHasMore(false);
        }
        setError(response.message);
      }
    } catch (error) {
      console.error("❌ Error loading interviews:", error);
      if (reset) {
        setInterviews([]);
        setTotalCount(0);
        setHasMore(false);
      }
      setError("Failed to load interviews. Please try again.");
    } finally {
      if (isMounted.current) {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    if (loadingRef.current) {
      console.log("⏸️ Already loading, skipping refresh...");
      return;
    }

    console.log("🔄 Refreshing interviews...");
    setRefreshing(true);
    await loadInterviews(true, false);
    setRefreshing(false);
  }, [userId, companyId, activeTab, statusFilter, searchQuery]);

  const loadMoreInterviews = useCallback(() => {
    if (!loadingMore && hasMore && !loadingRef.current) {
      console.log("📥 Loading more interviews...");
      loadInterviews(false, true);
    }
  }, [loadingMore, hasMore, currentPage]);

  const handleJoinInterview = useCallback((interview) => {
    if (!interview.can_join) {
      Alert.alert(
        "Cannot Join Yet",
        interview.time_until === "Completed"
          ? "This interview has ended."
          : `Interview starts ${interview.time_until}.`
      );
      return;
    }

    const channelName = `interview_${interview.interview_id}`;

    console.log("🎥 Employer joining video call:", {
      interviewId: interview.interview_id,
      channelName: channelName,
      jobTitle: interview.job_title,
      candidateName: interview.candidate_name,
    });

    router.push({
      pathname: "/video-call",
      params: {
        interviewId: interview.interview_id.toString(),
        channelName: channelName,
        jobTitle: interview.job_title || "Interview",
        candidateName: interview.candidate_name || "Candidate",
        audio: interview.interview_type === "phone" ? "true" : "false",
      },
    });
  }, []);

  // Loading Screen
  if (loading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary.teal} />
          <Text
            style={{
              marginTop: theme.spacing.md,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            Loading interviews...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <FlatList
        data={interviews}
        renderItem={({ item }) => (
          <InterviewCard item={item} onJoinInterview={handleJoinInterview} />
        )}
        keyExtractor={(item) => `interview_${item.interview_id}`}
        ListHeaderComponent={
          <Header
            totalCount={totalCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            stats={stats}
          />
        }
        ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.teal]}
            tintColor={theme.colors.primary.teal}
          />
        }
        onEndReached={loadMoreInterviews}
        onEndReachedThreshold={0.5}
        ListFooterComponent={<FooterLoading loadingMore={loadingMore} />}
      />
    </View>
  );
}
