import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
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
          Matching Candidates
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

// SearchAndFilters Component - UPDATED WITH NEW TABS
const SearchAndFilters = React.memo(
  ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter, stats }) => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.background.card,
          paddingHorizontal: theme.spacing.md,
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
            placeholder="Search candidates..."
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

        {/* Filter Tabs - UPDATED */}
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              id: "all",
              label: "All",
              count: stats.total_matches,
              icon: "people",
            },
            {
              id: "discovered",
              label: "New",
              count: stats.new_discoveries,
              icon: "star",
            },
            {
              id: "recruiter_invite",
              label: "Invited",
              count: stats.recruiter_invited,
              icon: "mail",
            },
            {
              id: "direct_apply",
              label: "Applied",
              count: stats.direct_applied,
              icon: "document-text",
            },
            {
              id: "shortlisted",
              label: "Shortlisted",
              count: stats.shortlisted,
              icon: "checkmark-circle",
            },
            {
              id: "interview",
              label: "Interviews",
              count: stats.interview,
              icon: "calendar",
            },
            {
              id: "hired",
              label: "Hired",
              count: stats.hired,
              icon: "trophy",
            },
            {
              id: "rejected",
              label: "Rejected",
              count: stats.rejected,
              icon: "close-circle",
            },
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
              <Ionicons
                name={filter.icon}
                size={14}
                color={
                  activeFilter === filter.id
                    ? theme.colors.neutral.white
                    : theme.colors.text.secondary
                }
                style={{ marginRight: theme.spacing.xs }}
              />
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
  },
);

// Candidate Item Component - UPDATED WITH STATUS-BASED ACTIONS
const CandidateItem = React.memo(
  ({
    item,
    index,
    onSendProposal,
    onViewCandidate,
    onStartConversation,
    onScheduleInterview,
  }) => {
    const [itemFade] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(itemFade, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

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
        case "under_review":
          return theme.colors.primary.orange;
        case "shortlisted":
          return theme.colors.status.success;
        case "rejected":
          return theme.colors.status.error;
        case "interview_scheduled":
          return "#8B5CF6"; // Violet/Purple
        case "interviewed":
          return "#6366F1"; // Indigo
        case "offered":
          return theme.colors.secondary.darkTeal;
        case "hired":
          return theme.colors.status.success;
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
        case "rejected":
          return "Rejected";
        case "interview_scheduled":
          return "Interview Scheduled";
        case "interviewed":
          return "Interviewed";
        case "offered":
          return "Offer Extended";
        case "hired":
          return "Hired";
        default:
          return item.status === "discovered" ? "New Discovery" : "Unknown";
      }
    };

    const getStatusIcon = () => {
      // Check if proposal sent but not accepted yet
      if (
        item.status === "discovered" &&
        item.proposal_sent &&
        !item.application_status
      ) {
        return "time-outline";
      }

      switch (item.application_status) {
        case "submitted":
          return item.source === "recruiter_invite"
            ? "checkmark-done"
            : "document-text";
        case "under_review":
          return "hourglass-outline";
        case "shortlisted":
          return "checkmark-circle";
        case "rejected":
          return "close-circle";
        case "interview_scheduled":
          return "calendar";
        case "interviewed":
          return "chatbubbles";
        case "offered":
          return "ribbon";
        case "hired":
          return "trophy";
        default:
          return item.status === "discovered" ? "star" : "help-circle";
      }
    };

    const getSourceBadge = () => {
      console.log("Item source:", item);
      if (item.source === "recruiter_invite") {
        return {
          text: "Invited by You",
          icon: "mail",
          color: theme.colors.primary.deepBlue,
        };
      } else if (item.source === "direct_apply") {
        return {
          text: "Direct Application",
          icon: "document-text",
          color: theme.colors.primary.teal,
        };
      }
      return null;
    };

    const sourceBadge = getSourceBadge();

    return (
      <Animated.View style={{ opacity: itemFade }}>
        <TouchableOpacity
          onPress={() => onViewCandidate(item.user_id)}
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.lg,
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            ...theme.shadows.sm,
          }}
          activeOpacity={0.8}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: theme.spacing.md,
            }}
          >
            {/* Candidate Avatar */}
            <View
              style={{ position: "relative", marginRight: theme.spacing.md }}
            >
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
                    {item.initials}
                  </Text>
                </LinearGradient>
              )}

              {/* Online status */}
              {item.isAvailable && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: theme.colors.status.success,
                    borderWidth: 2,
                    borderColor: theme.colors.background.card,
                  }}
                />
              )}
            </View>

            {/* Candidate Info */}
            <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.md,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
                numberOfLines={1}
              >
                {item.position}
                {item.company ? ` • ${item.company}` : ""}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.tertiary,
                }}
              >
                {item.experience}
              </Text>
            </View>

            {/* Status and Match */}
            <View style={{ alignItems: "flex-end" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: `${getStatusColor()}15`,
                  borderRadius: theme.borderRadius.md,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  marginBottom: theme.spacing.sm,
                }}
              >
                <Ionicons
                  name={getStatusIcon()}
                  size={12}
                  color={getStatusColor()}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: getStatusColor(),
                  }}
                >
                  {getStatusText()}
                </Text>
              </View>

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
                  {item.matchPercentage}% Match
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Source Badge */}
          {sourceBadge && (
            <View
              style={{
                backgroundColor: `${sourceBadge.color}15`,
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                marginBottom: theme.spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: sourceBadge.color,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={sourceBadge.icon}
                size={14}
                color={sourceBadge.color}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: sourceBadge.color,
                }}
              >
                {sourceBadge.text}
              </Text>
            </View>
          )}

          {/* Matched Job Title */}
          {item.matchedJobTitle && (
            <View
              style={{
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                marginBottom: theme.spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary.teal,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.primary.teal,
                }}
                numberOfLines={1}
              >
                <Ionicons
                  name="briefcase"
                  size={14}
                  color={theme.colors.primary.teal}
                />{" "}
                Matches: {item.matchedJobTitle}
              </Text>
            </View>
          )}

          {/* Details Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: theme.spacing.md,
              gap: theme.spacing.md,
            }}
          >
            {item.location && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  minWidth: "45%",
                }}
              >
                <Ionicons
                  name="location"
                  size={14}
                  color={theme.colors.text.tertiary}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.location}
                </Text>
              </View>
            )}

            {item.salary && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  minWidth: "45%",
                }}
              >
                <Ionicons
                  name="cash"
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
                  {item.salary}
                </Text>
              </View>
            )}

            {item.education && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  minWidth: "45%",
                }}
              >
                <Ionicons
                  name="school"
                  size={14}
                  color={theme.colors.text.tertiary}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.education}
                </Text>
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                minWidth: "45%",
              }}
            >
              <Ionicons
                name="time"
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
                {item.lastActive}
              </Text>
            </View>
          </View>

          {/* Skills */}
          {item.skills && item.skills.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: theme.spacing.md,
                gap: theme.spacing.xs,
              }}
            >
              {item.skills.slice(0, 5).map((skill, skillIndex) => (
                <View
                  key={`skill_${item.id}_${skillIndex}_${skill}`}
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
              {item.skills.length > 5 && (
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
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.tertiary,
                    }}
                  >
                    +{item.skills.length - 5}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Profile Completion Bar */}
          {item.profileCompletion > 0 && (
            <View style={{ marginTop: theme.spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                  Profile Completion
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.semiBold,
                    color:
                      item.profileCompletion >= 80
                        ? theme.colors.status.success
                        : item.profileCompletion >= 50
                          ? theme.colors.primary.orange
                          : theme.colors.status.error,
                  }}
                >
                  {item.profileCompletion}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: theme.colors.neutral.lightGray,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={
                    item.profileCompletion >= 80
                      ? [theme.colors.status.success, "#0D9488"]
                      : item.profileCompletion >= 50
                        ? [
                            theme.colors.primary.orange,
                            theme.colors.secondary.darkOrange,
                          ]
                        : [theme.colors.status.error, "#DC2626"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: `${item.profileCompletion}%`,
                    height: "100%",
                  }}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// Loading State - MOVED OUTSIDE
const LoadingState = React.memo(() => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing.xxxl,
      minHeight: 400,
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
      Finding matching candidates...
    </Text>
  </View>
));

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
    <LinearGradient
      colors={[theme.colors.background.accent, theme.colors.background.primary]}
      style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: theme.spacing.xl,
      }}
    >
      <Ionicons
        name={
          searchQuery
            ? "search"
            : activeFilter === "discovered"
              ? "star"
              : activeFilter === "recruiter_invite"
                ? "mail"
                : activeFilter === "direct_apply"
                  ? "document-text"
                  : activeFilter === "shortlisted"
                    ? "checkmark-circle"
                    : "people"
        }
        size={40}
        color={theme.colors.primary.teal}
      />
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
      {searchQuery
        ? "No candidates found"
        : activeFilter === "discovered"
          ? "No new discoveries"
          : activeFilter === "recruiter_invite"
            ? "No invited candidates"
            : activeFilter === "direct_apply"
              ? "No direct applications"
              : activeFilter === "shortlisted"
                ? "No shortlisted candidates"
                : "No candidate matches yet"}
    </Text>

    <Text
      style={{
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.secondary,
        textAlign: "center",
        lineHeight: theme.typography.sizes.base * 1.5,
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
      }}
    >
      {searchQuery
        ? "Try adjusting your search terms or filters"
        : activeFilter === "discovered"
          ? "New candidate matches will appear here as they become available"
          : activeFilter === "recruiter_invite"
            ? "Candidates you invite to jobs will appear here"
            : activeFilter === "direct_apply"
              ? "Candidates who apply directly to your jobs will appear here"
              : activeFilter === "shortlisted"
                ? "Candidates you shortlist will appear here"
                : "Create job postings to start discovering matching candidates"}
    </Text>

    {!searchQuery && activeFilter === "all" && (
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
    )}
  </View>
));

// Footer Loading Indicator - MOVED OUTSIDE
const FooterLoadingIndicator = React.memo(({ isLoadingMore }) => {
  if (!isLoadingMore) return null;

  return (
    <View style={{ paddingVertical: theme.spacing.xl, alignItems: "center" }}>
      <ActivityIndicator size="small" color={theme.colors.primary.teal} />
      <Text
        style={{
          marginTop: theme.spacing.sm,
          fontSize: theme.typography.sizes.sm,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.tertiary,
        }}
      >
        Loading more candidates...
      </Text>
    </View>
  );
});

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
  ),
);

export default function EmployerCandidates() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    total_matches: 0,
    new_discoveries: 0,
    recruiter_invited: 0,
    direct_applied: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
  });
  const [employerUserId, setEmployerUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const refreshIntervalRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    refreshIntervalRef.current = setInterval(() => {
      if (employerUserId && companyId) {
        loadCandidates(true, true);
      }
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (employerUserId && companyId) {
        loadCandidates(true);
      }
    }, [activeFilter, employerUserId, companyId]),
  );

  const loadUserData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const storedCompanyId = await SecureStore.getItemAsync("company_id");

      if (userId && storedCompanyId) {
        setEmployerUserId(userId);
        setCompanyId(storedCompanyId);
      } else {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("❌ Failed to load user data:", error);
    }
  };

  const loadCandidates = async (
    resetPagination = false,
    silentRefresh = false,
  ) => {
    if (!employerUserId || !companyId) return;

    try {
      if (resetPagination) {
        if (!silentRefresh) {
          setIsLoading(true);
        }
        setPagination({ limit: 20, offset: 0 });
      } else {
        setIsLoadingMore(true);
      }

      const params = {
        employer_user_id: parseInt(employerUserId),
        company_id: parseInt(companyId),
        status: activeFilter,
        search_query: searchQuery,
        limit: resetPagination ? 20 : pagination.limit,
        offset: resetPagination ? 0 : pagination.offset,
      };

      if (__DEV__ && !silentRefresh) {
        console.log("📤 Loading candidates with params:", params);
      }

      const response = await apiService.getMatchingCandidates(params);

      if (__DEV__ && !silentRefresh) {
        console.log("📦 Candidates response:", response);
      }

      if (response.success) {
        let newCandidates = response.data.candidates || [];

        // Backend handles filtering now, so we just use the candidates as returned
        // newCandidates = newCandidates.filter((c) => ... removed ... );
        const newStats = response.data.stats || {};
        const paginationData = response.data.pagination || {};
        const newTotalCount = response.data.total_count || 0;

        if (resetPagination) {
          setCandidates(newCandidates);
        } else {
          setCandidates((prev) => {
            const existingIds = new Set(prev.map((c) => c.user_id));
            const uniqueNew = newCandidates.filter(
              (c) => !existingIds.has(c.user_id),
            );
            return [...prev, ...uniqueNew];
          });
        }

        setStats(newStats);
        setTotalCount(newTotalCount);
        setHasMore(paginationData.has_more || false);
        setPagination({
          limit: paginationData.limit || 20,
          offset: paginationData.offset + paginationData.current_count || 0,
        });
      } else {
        console.error("❌ Failed to load candidates:", response.message);
      }
    } catch (error) {
      console.error("❌ Error loading candidates:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCandidates(true);
  }, [employerUserId, companyId, activeFilter, searchQuery]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      loadCandidates(false);
    }
  };

  const handleSendProposal = useCallback((candidateUserId) => {
    router.push(`/candidate-details/${candidateUserId}`);
  }, []);

  const handleViewCandidate = useCallback((candidateUserId) => {
    router.push(`/candidate-details/${candidateUserId}`);
  }, []);

  const handleStartConversation = useCallback((item) => {
    router.push(
      `/chat/${item.jobseeker_id}/${item.application_id}/${item.conversation_id}`,
    );
  }, []);

  const handleScheduleInterview = useCallback((item) => {
    router.push(`/schedule-interview/${item.application_id}`);
  }, []);

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
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
        <LoadingState />
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

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={candidates}
          renderItem={({ item, index }) => (
            <CandidateItem
              item={item}
              index={index}
              onSendProposal={handleSendProposal}
              onViewCandidate={handleViewCandidate}
              onStartConversation={handleStartConversation}
              onScheduleInterview={handleScheduleInterview}
            />
          )}
          keyExtractor={(item) => item.id}
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <FooterLoadingIndicator isLoadingMore={isLoadingMore} />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
        />
      </Animated.View>
    </View>
  );
}
