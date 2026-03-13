import { useUpdateNotificationCount } from "@/hooks/useNotificationCount";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Notifications() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    unread: 0,
    job: 0,
    system: 0,
    admin: 0,
    messages: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ Get functions to update notification count in real-time
  const { decrementCount, invalidateCount } = useUpdateNotificationCount();

  // Fetch notifications from API
  const fetchNotifications = async (
    showLoader = true,
    isRefresh = false,
    loadMore = false
  ) => {
    try {
      if (showLoader && !isRefresh && !loadMore) {
        setLoading(true);
      }

      const offset = loadMore ? pagination.offset + pagination.limit : 0;

      const result = await apiService.getNotifications({
        filter: activeFilter,
        limit: 20,
        offset: offset,
      });

      if (result.success) {
        const newNotifications = result.data.notifications || [];

        if (loadMore) {
          setNotifications((prev) => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        setStats(
          result.data.stats || {
            all: 0,
            unread: 0,
            job: 0,
            system: 0,
            admin: 0,
            messages: 0,
          }
        );

        setPagination(
          result.data.pagination || {
            total: 0,
            limit: 20,
            offset: 0,
            has_more: false,
          }
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
      if (loadMore) {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchNotifications(false);
    }
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(false, true);
    // Also invalidate the count query
    invalidateCount();
  }, [activeFilter, invalidateCount]);

  const handleLoadMore = () => {
    if (!loadingMore && pagination.has_more) {
      setLoadingMore(true);
      fetchNotifications(false, false, true);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notif = notifications.find((n) => n.id === notificationId);
      const wasUnread = notif && !notif.isRead;

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      if (wasUnread) {
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
        // ✅ Update the global notification count
        decrementCount(1);
      }

      // Call API
      const result = await apiService.markNotificationsRead(
        [parseInt(notificationId)],
        false
      );

      if (!result.success) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: false } : n
          )
        );
        if (wasUnread) {
          setStats((prev) => ({
            ...prev,
            unread: prev.unread + 1,
          }));
          decrementCount(-1); // Increment back
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadCount = stats.unread;

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setStats((prev) => ({ ...prev, unread: 0 }));

      // ✅ Update the global notification count to 0
      decrementCount(unreadCount);

      // Call API
      const result = await apiService.markNotificationsRead([], true);

      if (!result.success) {
        fetchNotifications(false);
        // Invalidate to get the real count
        invalidateCount();
      } else {
        // Invalidate to ensure sync
        invalidateCount();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      fetchNotifications(false);
      invalidateCount();
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const deletedNotif = notifications.find(
                (n) => n.id === notificationId
              );
              const wasUnread = deletedNotif && !deletedNotif.isRead;

              // Optimistically update UI
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== notificationId)
              );

              setStats((prev) => ({
                ...prev,
                all: Math.max(0, prev.all - 1),
                unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread,
              }));

              if (wasUnread) {
                // ✅ Decrement the global count
                decrementCount(1);
              }

              // Call API
              const result = await apiService.deleteNotifications([
                parseInt(notificationId),
              ]);

              if (!result.success) {
                fetchNotifications(false);
                invalidateCount();
              }
            } catch (error) {
              console.error("Error deleting notification:", error);
              fetchNotifications(false);
              invalidateCount();
            }
          },
        },
      ]
    );
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const filterButtons = [
    { id: "all", label: "All", count: stats.all },
    { id: "unread", label: "Unread", count: stats.unread },
    { id: "job", label: "Jobs", count: stats.job },
    { id: "system", label: "System", count: stats.system },
  ];

  // Header Component
  const Header = () => (
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
        <View>
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
            }}
          >
            Notifications
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {stats.unread > 0
              ? `${stats.unread} unread notifications`
              : "All caught up!"}
          </Text>
        </View>

        {stats.unread > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={{
              backgroundColor: theme.colors.background.accent,
              borderRadius: theme.borderRadius.md,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.primary.teal,
              }}
            >
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {filterButtons.map((filter) => (
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

  // Notification Item Component
  const NotificationItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}
      style={{
        backgroundColor: item.isRead
          ? theme.colors.background.card
          : theme.colors.background.accent,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        flexDirection: "row",
        alignItems: "flex-start",
      }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${item.iconColor}15`,
          justifyContent: "center",
          alignItems: "center",
          marginRight: theme.spacing.md,
        }}
      >
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: item.isRead
                ? theme.typography.fonts.medium
                : theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              flex: 1,
              marginRight: theme.spacing.sm,
            }}
          >
            {item.title}
          </Text>

          {!item.isRead && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.primary.teal,
                marginTop: 4,
              }}
            />
          )}
        </View>

        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.secondary,
            lineHeight: theme.typography.sizes.sm * 1.4,
            marginBottom: theme.spacing.xs,
          }}
        >
          {item.message}
        </Text>

        {item.senderType !== "system" && item.senderName && (
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.primary.teal,
              marginBottom: theme.spacing.xs,
            }}
          >
            From: {item.companyName || item.senderName}
          </Text>
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

      <Ionicons
        name="chevron-forward"
        size={16}
        color={theme.colors.text.tertiary}
        style={{ marginLeft: theme.spacing.sm, marginTop: 2 }}
      />
    </TouchableOpacity>
  );

  // Empty State Component
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
            activeFilter === "unread"
              ? "mail-unread-outline"
              : activeFilter === "job"
              ? "briefcase-outline"
              : activeFilter === "system"
              ? "settings-outline"
              : "notifications-outline"
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
        {activeFilter === "unread"
          ? "No unread notifications"
          : activeFilter === "job"
          ? "No job notifications"
          : activeFilter === "system"
          ? "No system notifications"
          : "No notifications yet"}
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
        {activeFilter === "unread"
          ? "All your notifications have been read"
          : activeFilter === "job"
          ? "Job-related notifications will appear here"
          : activeFilter === "system"
          ? "System updates and alerts will appear here"
          : "When you receive notifications, they will appear here"}
      </Text>
    </View>
  );

  const FooterLoader = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: theme.spacing.lg }}>
        <ActivityIndicator size="small" color={theme.colors.primary.teal} />
      </View>
    );
  };

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
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => <NotificationItem item={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={<FooterLoader />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        stickyHeaderIndices={[0]}
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
      />
    </View>
  );
}
