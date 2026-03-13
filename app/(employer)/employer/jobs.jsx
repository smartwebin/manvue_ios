import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// Header Component - MOVED OUTSIDE
const Header = React.memo(() => {
  return (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: theme.spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
          }}
        >
          Job Postings
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/post-job")}
          style={{
            backgroundColor: theme.colors.primary.teal,
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add"
            size={16}
            color={theme.colors.neutral.white}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.neutral.white,
            }}
          >
            Post Job
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// SearchAndFilters Component - MOVED OUTSIDE
const SearchAndFilters = React.memo(
  ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter, stats }) => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.background.card,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          marginBottom: theme.spacing.md,
        }}
      >
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
            placeholder="Search jobs..."
            placeholderTextColor={theme.colors.text.placeholder}
            style={{
              flex: 1,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.primary,
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={{ padding: theme.spacing.xs }}
            >
              <Ionicons
                name="close"
                size={16}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "all", label: "All", count: stats.all },
            { id: "active", label: "Active", count: stats.active },
            { id: "paused", label: "Paused", count: stats.paused },
            { id: "expired", label: "Expired", count: stats.expired },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.borderRadius.full,
                backgroundColor:
                  activeFilter === filter.id
                    ? theme.colors.primary.teal
                    : theme.colors.background.accent,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily:
                    activeFilter === filter.id
                      ? theme.typography.fonts.semiBold
                      : theme.typography.fonts.medium,
                  color:
                    activeFilter === filter.id
                      ? theme.colors.neutral.white
                      : theme.colors.text.secondary,
                }}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  style={{
                    backgroundColor:
                      activeFilter === filter.id
                        ? "rgba(255, 255, 255, 0.3)"
                        : theme.colors.primary.teal,
                    borderRadius: theme.borderRadius.full,
                    paddingHorizontal: theme.spacing.xs,
                    paddingVertical: 2,
                    marginLeft: theme.spacing.xs,
                    minWidth: 18,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.bold,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
);

// Job Item Component - MOVED OUTSIDE
const JobItem = React.memo(({ item }) => {
  const getStatusColor = () => {
    switch (item.status) {
      case "active":
        return theme.colors.status.success;
      case "paused":
        return theme.colors.status.warning;
      case "expired":
        return theme.colors.status.error;
      case "draft":
        return theme.colors.text.tertiary;
      default:
        return theme.colors.text.tertiary;
    }
  };

  const getUrgencyColor = () => {
    switch (item.urgency) {
      case "high":
        return theme.colors.status.error;
      case "urgent":
        return theme.colors.status.error;
      case "medium":
        return theme.colors.status.warning;
      default:
        return theme.colors.status.success;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/edit-jobs/${item.id}`)}
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        opacity: item.status === "expired" ? 0.7 : 1,
      }}
      activeOpacity={0.9}
    >
      {/* Header Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: theme.spacing.sm,
        }}
      >
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.isUrgent && (
              <View
                style={{
                  backgroundColor: theme.colors.status.error,
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: 2,
                  marginLeft: theme.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  URGENT
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {item.employmentType} • {item.experience}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{
              backgroundColor: `${getStatusColor()}15`,
              borderRadius: theme.borderRadius.sm,
              paddingHorizontal: theme.spacing.xs,
              paddingVertical: 2,
              marginBottom: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: getStatusColor(),
                textTransform: "capitalize",
              }}
            >
              {item.status}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: `${getUrgencyColor()}15`,
              borderRadius: theme.borderRadius.sm,
              paddingHorizontal: theme.spacing.xs,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: getUrgencyColor(),
                textTransform: "capitalize",
              }}
            >
              {item.urgency}
            </Text>
          </View>
        </View>
      </View>

      {/* Job Details */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: theme.spacing.md,
          gap: theme.spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minWidth: "45%",
          }}
        >
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

        {item.salary && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              minWidth: "45%",
            }}
          >
            <Ionicons
              name="cash-outline"
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
              {item.salary}
            </Text>
          </View>
        )}
      </View>

      {/* Skills */}
      {item.skills && item.skills.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: theme.spacing.md,
          }}
        >
          {item.skills.slice(0, 5).map((skill, index) => (
            <View
              key={index}
              style={{
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.sm,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                marginRight: theme.spacing.xs,
                marginBottom: theme.spacing.xs,
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
          {item.skills.length > 5 && (
            <View
              style={{
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.sm,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                marginRight: theme.spacing.xs,
                marginBottom: theme.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                }}
              >
                +{item.skills.length - 5}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="person-outline"
              size={16}
              color={theme.colors.primary.teal}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.primary.teal,
              }}
            >
              {item.applicationsCount}
            </Text>
            {item.newApplications > 0 && (
              <View
                style={{
                  backgroundColor: theme.colors.primary.orange,
                  borderRadius: theme.borderRadius.full,
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: 1,
                  marginLeft: theme.spacing.xs,
                  minWidth: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {item.newApplications}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="eye-outline"
              size={16}
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
              {item.viewsCount}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
            }}
          >
            Posted {item.postedDate}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color:
                item.status === "expired"
                  ? theme.colors.status.error
                  : theme.colors.text.tertiary,
            }}
          >
            Expires {item.expiryDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Empty State Component - MOVED OUTSIDE
const EmptyState = React.memo(({ searchQuery, activeFilter }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxxl,
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
        name={
          searchQuery
            ? "search-outline"
            : activeFilter === "active"
            ? "checkmark-circle-outline"
            : activeFilter === "paused"
            ? "pause-circle-outline"
            : activeFilter === "expired"
            ? "time-outline"
            : "briefcase-outline"
        }
        size={32}
        color={theme.colors.primary.teal}
      />
    </View>

    <Text
      style={{
        fontSize: theme.typography.sizes.lg,
        fontFamily: theme.typography.fonts.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: "center",
      }}
    >
      {searchQuery
        ? "No jobs found"
        : activeFilter === "active"
        ? "No active jobs"
        : activeFilter === "paused"
        ? "No paused jobs"
        : activeFilter === "expired"
        ? "No expired jobs"
        : "No jobs posted yet"}
    </Text>

    <Text
      style={{
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.secondary,
        textAlign: "center",
        lineHeight: theme.typography.sizes.base * 1.4,
        marginBottom: theme.spacing.lg,
      }}
    >
      {searchQuery
        ? "Try adjusting your search terms or filters"
        : activeFilter === "active"
        ? "Your active job postings will appear here"
        : activeFilter === "paused"
        ? "Jobs you pause will appear here"
        : activeFilter === "expired"
        ? "Expired job postings will appear here"
        : "Start by posting your first job to attract talented candidates"}
    </Text>

    {!searchQuery && activeFilter === "all" && (
      <TouchableOpacity
        onPress={() => router.push("/post-job")}
        style={{
          borderRadius: theme.borderRadius.lg,
          overflow: "hidden",
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="add"
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
            Post Your First Job
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
));

// List Header Component combining Header and SearchAndFilters
const ListHeader = React.memo(
  ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter, stats }) => (
    <>
      <Header />
      <SearchAndFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        stats={stats}
      />
    </>
  )
);

export default function EmployerJobs() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    active: 0,
    paused: 0,
    expired: 0,
    draft: 0,
  });

  const isInitialLoad = useRef(true);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId || companyId) {
        fetchJobs();
      }
    }, [userId, companyId])
  );

  useEffect(() => {
    if (!isInitialLoad.current && (userId || companyId)) {
      fetchJobs();
    }
  }, [activeFilter]);

  const loadUserData = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync("user_id");
      const storedCompanyId = await SecureStore.getItemAsync("company_id");

      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      }

      if (storedCompanyId) {
        setCompanyId(parseInt(storedCompanyId));
      }

      if (!storedUserId && !storedCompanyId) {
        Alert.alert("Error", "User not logged in");
        router.replace("/choose-path");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
    }
  };

  const fetchJobs = async (searchTerm = "") => {
    try {
      if (isInitialLoad.current || searchTerm === "") {
        setLoading(true);
      }

      const filters = {
        status: activeFilter,
        searchQuery: searchTerm,
        limit: 100,
        offset: 0,
      };

      const response = await apiService.getJobs(companyId, userId, filters);

      if (response.success && response.data) {
        const { jobs: jobsList, stats: statsData } = response.data;

        setAllJobs(jobsList || []);
        setJobs(jobsList || []);
        setStats({
          all: statsData?.total || 0,
          active: statsData?.active || 0,
          paused: statsData?.paused || 0,
          expired: statsData?.expired || 0,
          draft: statsData?.draft || 0,
        });

        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }
        setLoading(false);
      } else {
        Alert.alert("Error", response.message || "Failed to load jobs");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      Alert.alert("Error", "Failed to load jobs");
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery("");
    await fetchJobs();
    setRefreshing(false);
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (
        !isInitialLoad.current &&
        (userId || companyId) &&
        searchQuery.trim().length > 2
      ) {
        fetchJobs(searchQuery);
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const getFilteredJobs = () => {
    let filtered = allJobs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          (job.skills &&
            job.skills.some((skill) => skill.toLowerCase().includes(query)))
      );
    }

    return filtered;
  };

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.sizes.base,
            color: theme.colors.text.secondary,
          }}
        >
          Loading jobs...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
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

      <FlatList
        data={filteredJobs}
        renderItem={({ item }) => <JobItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            stats={stats}
          />
        }
        ListEmptyComponent={
          <EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />
        }
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
        keyboardShouldPersistTaps="always"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </View>
  );
}
