import apiService from '@/services/apiService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * Custom hook to fetch and manage unread notification count
 * Auto-refetches on app focus and when new push notification is received
 */
export function useNotificationCount() {
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      try {
        const result = await apiService.getNotifications({
          filter: 'unread',
          limit: 1, // We only need the count, not the actual notifications
          offset: 0,
        });

        if (result.success) {
          return result.data?.stats?.unread || 0;
        }
        return 0;
      } catch (error) {
        console.error('Error fetching notification count:', error);
        return 0;
      }
    },
    staleTime: 1000 * 60 * 2, // Consider data stale after 2 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchInterval: 1000 * 60 * 3, // Auto-refetch every 3 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Listen for new notifications and refetch count
  useEffect(() => {
    // Refetch when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refetch();
      }
    });

    // Listen for incoming notifications
    const notificationSubscription = Notifications.addNotificationReceivedListener(() => {
      // Invalidate and refetch when new notification is received
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
      refetch();
    });

    // ✅ FIXED: Proper cleanup - call .remove() directly on each subscription
    return () => {
      appStateSubscription.remove();
      notificationSubscription.remove(); // ✅ NOT Notifications.removeNotificationSubscription()
    };
  }, [queryClient, refetch]);

  return {
    count: data || 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Custom hook for notification stats (all categories)
 */
export function useNotificationStats() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notificationStats'],
    queryFn: async () => {
      try {
        const result = await apiService.getNotifications({
          filter: 'all',
          limit: 1,
          offset: 0,
        });

        if (result.success) {
          return result.data?.stats || {
            all: 0,
            unread: 0,
            job: 0,
            system: 0,
            admin: 0,
            messages: 0,
          };
        }
        return {
          all: 0,
          unread: 0,
          job: 0,
          system: 0,
          admin: 0,
          messages: 0,
        };
      } catch (error) {
        console.error('Error fetching notification stats:', error);
        return {
          all: 0,
          unread: 0,
          job: 0,
          system: 0,
          admin: 0,
          messages: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 3,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Listen for new notifications
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refetch();
      }
    });

    const notificationSubscription = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
      refetch();
    });

    // ✅ FIXED: Proper cleanup
    return () => {
      appStateSubscription.remove();
      notificationSubscription.remove(); // ✅ Call .remove() directly
    };
  }, [queryClient, refetch]);

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Helper function to manually update notification count
 * Useful after marking notifications as read
 */
export function useUpdateNotificationCount() {
  const queryClient = useQueryClient();

  const updateCount = (newCount) => {
    queryClient.setQueryData(['notificationCount'], newCount);
  };

  const decrementCount = (amount = 1) => {
    queryClient.setQueryData(['notificationCount'], (old) => 
      Math.max(0, (old || 0) - amount)
    );
  };

  const incrementCount = (amount = 1) => {
    queryClient.setQueryData(['notificationCount'], (old) => 
      (old || 0) + amount
    );
  };

  const invalidateCount = () => {
    queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    queryClient.invalidateQueries({ queryKey: ['notificationStats'] });
  };

  return {
    updateCount,
    decrementCount,
    incrementCount,
    invalidateCount,
  };
}