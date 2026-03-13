import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

// ==================== MEMOIZED HEADER COMPONENT ====================
const MessagesHeader = React.memo(
  ({
    searchQuery,
    onSearchChange,
    activeFilter,
    onFilterChange,
    filterCounts,
  }) => {
    // Debounced search handler
    const searchTimeoutRef = useRef(null);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Sync local search with prop
    useEffect(() => {
      setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    const handleSearchChange = (text) => {
      setLocalSearchQuery(text);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search - wait 500ms after user stops typing
      searchTimeoutRef.current = setTimeout(() => {
        onSearchChange(text);
      }, 500);
    };

    const handleClearSearch = () => {
      setLocalSearchQuery("");
      onSearchChange("");
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, []);

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
            value={localSearchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search conversations..."
            placeholderTextColor={theme.colors.text.placeholder}
            style={{
              flex: 1,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.primary,
            }}
          />
          {localSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
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

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {[
            { id: "all", label: "All", count: filterCounts.all },
            { id: "unread", label: "Unread", count: filterCounts.unread },
            { id: "blocked", label: "Blocked", count: filterCounts.blocked },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => onFilterChange(filter.id)}
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
              activeOpacity={0.8}
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

MessagesHeader.displayName = "MessagesHeader";

// ==================== MEMOIZED MESSAGE ITEM ====================
const MessageItem = React.memo(({ item, onPress, onLongPress }) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(item);
    }
  }, [item, onLongPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={{
        flexDirection: "row",
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
      }}
      activeOpacity={0.7}
    >
      {
        console.log("Message Item Rendered:", item)
      }
      <View style={{ marginRight: theme.spacing.md, position: "relative" }}>
        {item.companyProfileImage ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.borderRadius.full,
              overflow: "hidden",
              borderWidth: item.unreadCount > 0 ? 2 : 1,
              borderColor:
                item.unreadCount > 0
                  ? theme.colors.primary.teal
                  : theme.colors.border.light,
            }}
          >
            <Image
              source={{ uri: item.companyProfileImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.borderRadius.full,
              backgroundColor:
                item.unreadCount > 0
                  ? theme.colors.primary.teal
                  : theme.colors.background.accent,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: item.unreadCount > 0 ? 2 : 1,
              borderColor:
                item.unreadCount > 0
                  ? theme.colors.primary.teal
                  : theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.bold,
                color:
                  item.unreadCount > 0
                    ? theme.colors.neutral.white
                    : theme.colors.primary.teal,
              }}
            >
              {item.companyInitial}
            </Text>
          </View>
        )}

        {/* Online / blocked dots remain unchanged */}
        {item.isOnline && !item.isBlocked && (
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.colors.status.success,
              borderWidth: 2,
              borderColor: theme.colors.background.card,
            }}
          />
        )}
        {item.isBlocked && (
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.colors.status.error,
              borderWidth: 2,
              borderColor: theme.colors.background.card,
            }}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
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
              fontSize: theme.typography.sizes.base,
              fontFamily:
                item.unreadCount > 0
                  ? theme.typography.fonts.semiBold
                  : theme.typography.fonts.medium,
              color: theme.colors.text.primary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.companyName}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            {item.messageType === "file" && (
              <Ionicons
                name="document-attach-outline"
                size={14}
                color={theme.colors.text.tertiary}
              />
            )}

            {item.isBlocked && (
              <Ionicons
                name="ban-outline"
                size={14}
                color={theme.colors.status.error}
              />
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
              color:
                item.unreadCount > 0
                  ? theme.colors.text.primary
                  : theme.colors.text.secondary,
              flex: 1,
              marginRight: theme.spacing.sm,
            }}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
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
    </TouchableOpacity>
  );
});

MessageItem.displayName = "MessageItem";

// ==================== MEMOIZED EMPTY STATE ====================
const EmptyState = React.memo(({ searchQuery, activeFilter }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxxl,
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
            : searchQuery
            ? "search-outline"
            : "chatbubbles-outline"
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
        ? "No results found"
        : activeFilter === "blocked"
        ? "No blocked conversations"
        : activeFilter === "unread"
        ? "No unread messages"
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
        ? "You haven't blocked any companies yet"
        : activeFilter === "unread"
        ? "All messages have been read"
        : "When companies send you proposals, your conversations will appear here"}
    </Text>
  </View>
));

EmptyState.displayName = "EmptyState";

// ==================== MAIN COMPONENT ====================
export default function Messages() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [messages, setMessages] = useState([]);
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    unread: 0,
    blocked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchConversations();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchConversations = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);

      const result = await apiService.getJobseekerChatList(
        searchQuery,
        activeFilter,
        50,
        0
      );

      if (result.success) {
        setMessages(result.data.conversations || []);
        setFilterCounts(
          result.data.filter_counts || { all: 0, unread: 0, blocked: 0 }
        );
      } else {
        console.error("Error fetching conversations:", result.message);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([]);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations(false);
    setRefreshing(false);
  };

  const handleChatPress = useCallback((item) => {
    router.push(`/message-details/${item.conversation_id}`);
  }, []);

  const handleLongPress = useCallback((item) => {
    setSelectedConversation(item);
    setShowActionModal(true);
  }, []);

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
        Alert.alert("Success", "Company has been blocked successfully");
        fetchConversations(false);
      } else {
        Alert.alert("Error", result.message || "Failed to block company");
      }
    } catch (error) {
      console.error("Error blocking conversation:", error);
      Alert.alert("Error", "Failed to block company. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedConversation(null);
    }
  };

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
        Alert.alert("Success", "Company has been unblocked successfully");
        fetchConversations(false);
      } else {
        Alert.alert("Error", result.message || "Failed to unblock company");
      }
    } catch (error) {
      console.error("Error unblocking conversation:", error);
      Alert.alert("Error", "Failed to unblock company. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedConversation(null);
    }
  };

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <MessageItem
        item={item}
        onPress={handleChatPress}
        onLongPress={handleLongPress}
      />
    ),
    [handleChatPress, handleLongPress]
  );

  const renderEmptyComponent = useCallback(
    () => <EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />,
    [searchQuery, activeFilter]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  if (isLoading) {
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
      {/* Header - Outside FlatList */}
      <MessagesHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        filterCounts={filterCounts}
      />

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
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
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
                {selectedConversation?.companyName}
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
                    Unblock Company
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    Allow messaging with this company again
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
                    Block Company
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    Prevent all messaging with this company
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
