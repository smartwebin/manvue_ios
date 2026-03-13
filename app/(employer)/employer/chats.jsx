import apiService from "@/services/apiService";
import theme from "@/theme";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Header Component - MOVED OUTSIDE
const Header = React.memo(
  ({
    stats,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filters,
  }) => (
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
      {/* Header Title */}
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
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
            }}
          >
            Messages
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {stats.unread > 0
              ? `${stats.unread} unread conversations`
              : "All caught up!"}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <TouchableOpacity
            onPress={() => router.push("/employer/employer-interviews")}
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.background.accent,
            }}
            activeOpacity={0.7}
          >
            <AntDesign
              name="schedule"
              size={20}
              color={theme.colors.status.error}
            />
          </TouchableOpacity>
        </View>
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
          placeholder="Search candidates or messages..."
          placeholderTextColor={theme.colors.text.placeholder}
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.primary,
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
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
          gap: theme.spacing.xs,
        }}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setActiveFilter(filter.key)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              backgroundColor:
                activeFilter === filter.key
                  ? theme.colors.primary.teal
                  : theme.colors.neutral.lightGray,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily:
                  activeFilter === filter.key
                    ? theme.typography.fonts.semiBold
                    : theme.typography.fonts.medium,
                color:
                  activeFilter === filter.key
                    ? theme.colors.neutral.white
                    : theme.colors.text.secondary,
              }}
            >
              {filter.label}
            </Text>
            {filter.count > 0 && (
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.bold,
                  color:
                    activeFilter === filter.key
                      ? theme.colors.neutral.white
                      : theme.colors.primary.teal,
                  marginTop: 2,
                }}
              >
                {filter.count}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
);

// Message Item Component - MOVED OUTSIDE
const MessageItem = React.memo(({ item, onLongPress }) => {
  const getConversationTypeIcon = () => {
    switch (item.conversationType) {
      case "interview":
        return "calendar-outline";
      case "application":
        return "briefcase-outline";
      default:
        return "chatbubble-outline";
    }
  };

  const getConversationTypeColor = () => {
    switch (item.conversationType) {
      case "interview":
        return theme.colors.primary.orange;
      case "application":
        return theme.colors.primary.teal;
      default:
        return theme.colors.text.tertiary;
    }
  };

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/chat/${item.jobseeker_id}/${item.application_id}/${item.conversation_id}`
        )
      }
      onLongPress={() => onLongPress(item)}
      style={{
        backgroundColor: theme.colors.background.card,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: item.isBlocked
          ? theme.colors.status.error + "30"
          : item.unreadCount > 0
          ? theme.colors.primary.teal + "30"
          : theme.colors.border.light,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          padding: theme.spacing.md,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* Avatar */}
        <View style={{ marginRight: theme.spacing.md, position: "relative" }}>
          {item.candidateProfilePicture ? (
            <Image
              source={{ uri: item.candidateProfilePicture }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: item.isBlocked
                  ? theme.colors.status.error
                  : item.unreadCount > 0
                  ? theme.colors.primary.teal
                  : theme.colors.border.light,
                opacity: item.isBlocked ? 0.6 : 1,
              }}
              onError={() => (item.candidateProfilePicture = null)}
            />
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: item.isBlocked
                  ? theme.colors.neutral.mediumGray
                  : theme.colors.primary.teal,
                justifyContent: "center",
                alignItems: "center",
                opacity: item.isBlocked ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                {item.candidateInitials}
              </Text>
            </View>
          )}

          {/* Online indicator - hide if blocked */}
          {item.isOnline && !item.isBlocked && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: theme.colors.status.success,
                borderWidth: 2,
                borderColor: theme.colors.background.card,
              }}
            />
          )}

          {/* Blocked indicator overlay */}
          {item.isBlocked && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: theme.colors.status.error,
                borderWidth: 2,
                borderColor: theme.colors.background.card,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="ban"
                size={10}
                color={theme.colors.neutral.white}
              />
            </View>
          )}
        </View>

        {/* Message Content */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: theme.spacing.xs,
            }}
          >
            <View
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily:
                    item.unreadCount > 0
                      ? theme.typography.fonts.semiBold
                      : theme.typography.fonts.medium,
                  color: item.isBlocked
                    ? theme.colors.text.secondary
                    : theme.colors.text.primary,
                  marginRight: theme.spacing.xs,
                }}
                numberOfLines={1}
              >
                {item.candidateName}
              </Text>

              {/* Conversation type indicator */}
              {!item.isBlocked && (
                <View
                  style={{
                    backgroundColor: `${getConversationTypeColor()}15`,
                    borderRadius: theme.borderRadius.sm,
                    paddingHorizontal: theme.spacing.xs,
                    paddingVertical: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name={getConversationTypeIcon()}
                    size={10}
                    color={getConversationTypeColor()}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.medium,
                      color: getConversationTypeColor(),
                      textTransform: "capitalize",
                    }}
                  >
                    {item.conversationType}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.xs,
              }}
            >
              {/* Message type indicator */}
              {item.messageType === "file" && !item.isBlocked && (
                <Ionicons
                  name="document-attach-outline"
                  size={14}
                  color={theme.colors.text.tertiary}
                />
              )}

              {/* Blocked indicator */}
              {item.isBlocked && (
                <View
                  style={{
                    backgroundColor: theme.colors.status.error + "20",
                    borderRadius: theme.borderRadius.sm,
                    paddingHorizontal: theme.spacing.xs,
                    paddingVertical: 2,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="ban"
                    size={12}
                    color={theme.colors.status.error}
                    style={{ marginRight: 2 }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.error,
                    }}
                  >
                    Blocked
                  </Text>
                </View>
              )}

              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                {item.timestamp}
              </Text>
            </View>
          </View>

          {/* Position and Experience */}
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}
          >
            {item.position} • {item.candidateExperience}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: item.isBlocked
                  ? theme.colors.text.tertiary
                  : item.unreadCount > 0
                  ? theme.colors.text.primary
                  : theme.colors.text.secondary,
                flex: 1,
                marginRight: theme.spacing.sm,
                fontStyle: item.isBlocked ? "italic" : "normal",
              }}
              numberOfLines={1}
            >
              {item.isBlocked ? "Conversation blocked" : item.lastMessage}
            </Text>

            {/* Unread count badge - hide if blocked */}
            {item.unreadCount > 0 && !item.isBlocked && (
              <View
                style={{
                  backgroundColor: theme.colors.primary.teal,
                  borderRadius: theme.borderRadius.full,
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: 2,
                  minWidth: 20,
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
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Empty State Component - MOVED OUTSIDE
const EmptyState = React.memo(({ activeFilter, searchQuery }) => (
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
          activeFilter === "blocked"
            ? "ban-outline"
            : activeFilter === "unread"
            ? "mail-unread-outline"
            : activeFilter === "interviews"
            ? "calendar-outline"
            : activeFilter === "proposals"
            ? "briefcase-outline"
            : searchQuery
            ? "search-outline"
            : "chatbubbles-outline"
        }
        size={32}
        color={
          activeFilter === "blocked"
            ? theme.colors.status.error
            : theme.colors.primary.teal
        }
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
        ? "No conversations found"
        : activeFilter === "blocked"
        ? "No blocked candidates"
        : activeFilter === "unread"
        ? "No unread messages"
        : activeFilter === "interviews"
        ? "No interview conversations"
        : activeFilter === "proposals"
        ? "No proposal conversations"
        : "No conversations yet"}
    </Text>

    <Text
      style={{
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.secondary,
        textAlign: "center",
        lineHeight: theme.typography.sizes.base * 1.4,
      }}
    >
      {searchQuery
        ? "Try adjusting your search terms"
        : activeFilter === "blocked"
        ? "Candidates you've blocked will appear here"
        : activeFilter === "unread"
        ? "All your messages have been read"
        : activeFilter === "interviews"
        ? "Interview-related conversations will appear here"
        : activeFilter === "proposals"
        ? "Job proposal conversations will appear here"
        : "When candidates respond to your job postings, conversations will appear here"}
    </Text>
  </View>
));

export default function EmployerMessages() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    unread: 0,
    interviews: 0,
    proposals: 0,
    blocked: 0,
  });

  // Block/Unblock state
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter buttons data
  const filters = [
    { key: "all", label: "All", count: stats.all },
    { key: "unread", label: "Unread", count: stats.unread },
    { key: "interviews", label: "Interviews", count: stats.interviews },
    { key: "proposals", label: "Proposals", count: stats.proposals },
    { key: "blocked", label: "Blocked", count: stats.blocked },
  ];

  // Fetch conversations from API
  const fetchConversations = async (showLoader = true, isRefresh = false) => {
    try {
      if (showLoader && !isRefresh) {
        setLoading(true);
      }

      const result = await apiService.getEmployerConversations({
        filter: activeFilter,
        search_query: searchQuery.trim(),
      });

      if (result.success) {
        setMessages(result.data.conversations || []);
        setStats(
          result.data.stats || {
            all: 0,
            unread: 0,
            interviews: 0,
            proposals: 0,
            blocked: 0,
          }
        );
      } else {
        Alert.alert("Error", result.message || "Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || searchQuery === "") {
        fetchConversations(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations(false, true);
  }, [activeFilter, searchQuery]);

  // Handle long press on conversation item
  const handleLongPress = (item) => {
    setSelectedConversation(item);
    setShowActionModal(true);
  };

  // Handle block conversation
  const handleBlockConversation = async () => {
    if (!selectedConversation) return;

    setIsProcessing(true);
    try {
      const result = await apiService.blockConversation(
        selectedConversation.conversation_id,
        "block"
      );

      if (result.success) {
        setShowActionModal(false);
        Alert.alert("Success", "Candidate has been blocked successfully");
        // Refetch conversations to get updated list
        fetchConversations(false);
      } else {
        Alert.alert("Error", result.message || "Failed to block candidate");
      }
    } catch (error) {
      console.error("Error blocking conversation:", error);
      Alert.alert("Error", "Failed to block candidate. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedConversation(null);
    }
  };

  // Handle unblock conversation
  const handleUnblockConversation = async () => {
    if (!selectedConversation) return;

    setIsProcessing(true);
    try {
      const result = await apiService.blockConversation(
        selectedConversation.conversation_id,
        "unblock"
      );

      if (result.success) {
        setShowActionModal(false);
        Alert.alert("Success", "Candidate has been unblocked successfully");
        // Refetch conversations to get updated list
        fetchConversations(false);
      } else {
        Alert.alert("Error", result.message || "Failed to unblock candidate");
      }
    } catch (error) {
      console.error("Error unblocking conversation:", error);
      Alert.alert("Error", "Failed to unblock candidate. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedConversation(null);
    }
  };

  // Loading State
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
        <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
          }}
        >
          Loading conversations...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageItem item={item} onLongPress={handleLongPress} />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Header
            stats={stats}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filters={filters}
          />
        }
        ListEmptyComponent={
          <EmptyState activeFilter={activeFilter} searchQuery={searchQuery} />
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
        stickyHeaderIndices={[0]}
      />

      {/* Action Modal for Block/Unblock */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderTopLeftRadius: theme.borderRadius.xl,
              borderTopRightRadius: theme.borderRadius.xl,
              paddingBottom: theme.spacing.xl,
            }}
          >
            <View
              style={{
                alignItems: "center",
                paddingVertical: theme.spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: theme.colors.neutral.mediumGray,
                  borderRadius: 2,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: theme.spacing.xl,
                paddingBottom: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                {selectedConversation?.candidateName}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs,
                }}
              >
                {selectedConversation?.position}
              </Text>
            </View>

            {/* Actions */}
            {selectedConversation?.isBlocked ? (
              // Unblock option
              <TouchableOpacity
                onPress={handleUnblockConversation}
                disabled={isProcessing}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.lg,
                  opacity: isProcessing ? 0.5 : 1,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.status.success}
                  style={{ marginRight: theme.spacing.md }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.success,
                    }}
                  >
                    Unblock Candidate
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    Allow messaging with this candidate again
                  </Text>
                </View>
                {isProcessing && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.status.success}
                  />
                )}
              </TouchableOpacity>
            ) : (
              // Block option
              <TouchableOpacity
                onPress={handleBlockConversation}
                disabled={isProcessing}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.lg,
                  opacity: isProcessing ? 0.5 : 1,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="ban"
                  size={24}
                  color={theme.colors.status.error}
                  style={{ marginRight: theme.spacing.md }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.error,
                    }}
                  >
                    Block Candidate
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    Prevent all messaging with this candidate
                  </Text>
                </View>
                {isProcessing && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.status.error}
                  />
                )}
              </TouchableOpacity>
            )}

            {/* Cancel button */}
            <TouchableOpacity
              onPress={() => setShowActionModal(false)}
              disabled={isProcessing}
              style={{
                marginHorizontal: theme.spacing.xl,
                marginTop: theme.spacing.md,
                backgroundColor: theme.colors.neutral.lightGray,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}