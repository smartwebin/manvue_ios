import apiService from '@/services/apiService';
import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// ==================== MEMOIZED HEADER COMPONENT ====================
const InterviewsHeader = React.memo(({ 
  stats, 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onFilterChange 
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
    setLocalSearchQuery('');
    onSearchChange('');
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
      {/* Title and Stats */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            My Interviews
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {stats.scheduled} scheduled • {stats.today} today
          </Text>
        </View>

        {stats.today > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.primary.orange + '20',
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.orange,
              }}
            >
              {stats.today} Today
            </Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
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
          placeholder="Search companies or jobs..."
          placeholderTextColor={theme.colors.text.placeholder}
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.primary,
          }}
        />
        {localSearchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <StatusFilters 
        stats={stats}
        statusFilter={statusFilter}
        onFilterChange={onFilterChange}
      />
    </View>
  );
});

InterviewsHeader.displayName = 'InterviewsHeader';

// ==================== MEMOIZED STATUS FILTERS ====================
const StatusFilters = React.memo(({ stats, statusFilter, onFilterChange }) => {
  const filters = useMemo(() => [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'scheduled', label: 'Scheduled', count: stats.scheduled },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ], [stats]);

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
      {filters.map((filter) => (
        <FilterButton
          key={filter.key}
          filter={filter}
          isActive={statusFilter === filter.key}
          onPress={onFilterChange}
        />
      ))}
    </View>
  );
});

StatusFilters.displayName = 'StatusFilters';

// ==================== MEMOIZED FILTER BUTTON ====================
const FilterButton = React.memo(({ filter, isActive, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(filter.key);
  }, [filter.key, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: isActive
          ? theme.colors.primary.teal
          : theme.colors.background.accent,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
      }}
      activeOpacity={0.8}
    >
      <Text
        style={{
          fontSize: theme.typography.sizes.xs,
          fontFamily: isActive
            ? theme.typography.fonts.semiBold
            : theme.typography.fonts.medium,
          color: isActive
            ? theme.colors.neutral.white
            : theme.colors.text.secondary,
        }}
      >
        {filter.label}
      </Text>
      {filter.count > 0 && (
        <View
          style={{
            backgroundColor: isActive
              ? 'rgba(255, 255, 255, 0.3)'
              : theme.colors.primary.teal,
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: theme.spacing.xs,
            paddingVertical: 2,
            minWidth: 18,
            alignItems: 'center',
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
  );
});

FilterButton.displayName = 'FilterButton';

// ==================== MEMOIZED INTERVIEW CARD ====================
const InterviewCard = React.memo(({ item, onJoin }) => {
  const getStatusColor = useCallback(() => {
    switch (item.interview_status) {
      case 'scheduled':
        return theme.colors.primary.teal;
      case 'completed':
        return theme.colors.status.success;
      case 'cancelled':
        return theme.colors.status.error;
      default:
        return theme.colors.text.tertiary;
    }
  }, [item.interview_status]);

  const handleJoin = useCallback(() => {
    onJoin(item);
  }, [item, onJoin]);

  return (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: item.is_today ? theme.colors.primary.orange : theme.colors.border.light,
        ...theme.shadows.sm,
      }}
    >
      {/* Status and Today Badge */}
      <View
        style={{
          position: 'absolute',
          top: theme.spacing.sm,
          right: theme.spacing.sm,
          flexDirection: 'row',
          gap: theme.spacing.xs,
        }}
      >
        {item.is_today && (
          <View
            style={{
              backgroundColor: theme.colors.primary.orange + '20',
              borderRadius: theme.borderRadius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.orange,
              }}
            >
              Today
            </Text>
          </View>
        )}
        <View
          style={{
            backgroundColor: getStatusColor() + '20',
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
              textTransform: 'capitalize',
            }}
          >
            {item.interview_status}
          </Text>
        </View>
      </View>

      {/* Company Info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingRight: theme.spacing.xl * 2 }}>
        {item.profile_img ? (
          <Image
            source={{ uri: item.profile_img }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              marginRight: theme.spacing.md,
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
              backgroundColor: theme.colors.primary.teal,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: theme.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.neutral.white,
              }}
            >
              {item.company_initial}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
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
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
            numberOfLines={1}
          >
            {item.industry}
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
          numberOfLines={2}
        >
          {item.job_title}
        </Text>
      </View>

      {/* Interview Details */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              textTransform: 'capitalize',
            }}
          >
            {item.interview_type}
          </Text>
        </View>
      </View>

      {/* Interviewer */}
      {item.interviewer_name && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          <Ionicons
            name="person-outline"
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
            Interviewer: {item.interviewer_name}
          </Text>
        </View>
      )}

      {/* Time Until */}
      {item.interview_status === 'scheduled' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          <Ionicons
            name={item.can_join ? 'radio-button-on' : 'alarm-outline'}
            size={16}
            color={item.can_join ? theme.colors.status.success : theme.colors.primary.orange}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: item.can_join ? theme.colors.status.success : theme.colors.primary.orange,
            }}
          >
            {item.time_until}
          </Text>
        </View>
      )}

      {/* Actions */}
      {item.interview_status === 'scheduled' && (
        <TouchableOpacity
          onPress={handleJoin}
          style={{
            backgroundColor: item.can_join ? theme.colors.primary.teal : theme.colors.neutral.gray,
            borderRadius: theme.borderRadius.lg,
            paddingVertical: theme.spacing.sm,
            alignItems: 'center',
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
            {item.can_join ? 'Join Interview' : 'Not Yet Started'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

InterviewCard.displayName = 'InterviewCard';

// ==================== MEMOIZED EMPTY STATE ====================
const EmptyState = React.memo(({ searchQuery }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxxl * 2,
    }}
  >
    <View
      style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.background.accent,
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
      }}
    >
      No Interviews Scheduled
    </Text>

    <Text
      style={{
        fontSize: theme.typography.sizes.base,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.secondary,
        textAlign: 'center',
      }}
    >
      {searchQuery
        ? 'No interviews match your search'
        : 'Your scheduled interviews will appear here'}
    </Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ==================== MAIN COMPONENT ====================
export default function JobseekerInterviews() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  // Interviews data
  const [interviews, setInterviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
  });

  const LIMIT = 10;

  // Load user data on mount
  useEffect(() => {
    loadUserId();
  }, []);

  // Load interviews when dependencies change
  useEffect(() => {
    if (userId) {
      loadInterviews(true);
    }
  }, [userId, statusFilter, searchQuery]);

  const loadUserId = async () => {
    try {
      const id = await SecureStore.getItemAsync('user_id');

      if (!id) {
        setError('User not found. Please log in again.');
        router.replace('/(auth)/login');
        return;
      }

      setUserId(id);
    } catch (error) {
      console.error('❌ Failed to get user ID:', error);
      setError('Failed to load user data.');
    }
  };

  const loadInterviews = async (reset = false, showLoader = true) => {
    if (!userId) return;
    if (!reset && !hasMore) return;

    try {
      if (showLoader && !refreshing) {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
      }

      const offset = reset ? 0 : currentPage * LIMIT;

      const params = {
        jobseeker_user_id: parseInt(userId),
        status: statusFilter,
        search_query: searchQuery,
        limit: LIMIT,
        offset: offset,
      };

      if (__DEV__) {
        console.log('📤 Loading interviews with params:', params);
      }

      const response = await apiService.getJobseekerInterviews(params);

      if (response.success) {
        const newInterviews = response.data.interviews || [];

        if (reset) {
          setInterviews(newInterviews);
          setCurrentPage(1);
        } else {
          setInterviews([...interviews, ...newInterviews]);
          setCurrentPage(currentPage + 1);
        }

        setTotalCount(response.data.total_count || 0);
        setStats(response.data.stats || stats);
        setHasMore(response.data.pagination?.has_more || false);
        setError(null);
      } else {
        console.error('❌ Failed to load interviews:', response.message);
        if (reset) {
          setInterviews([]);
        }
        setError(response.message);
      }
    } catch (error) {
      console.error('❌ Error loading interviews:', error);
      if (reset) {
        setInterviews([]);
      }
      setError('Failed to load interviews. Please try again.');
    } finally {
      if (showLoader) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInterviews(true, false);
    setRefreshing(false);
  }, [userId, statusFilter, searchQuery]);

  const loadMoreInterviews = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadInterviews(false, true);
    }
  }, [loadingMore, hasMore]);

  const handleJoinInterview = useCallback((interview) => {
    if (!interview.can_join) {
      Alert.alert(
        'Cannot Join Yet',
        interview.time_until === 'Completed'
          ? 'This interview has ended.'
          : `Interview starts ${interview.time_until}.`
      );
      return;
    }

    // Use interview_id as channel name for Agora
    const channelName = `interview_${interview.interview_id}`;
    
    // Navigate with proper channel name
    router.push({
      pathname: '/video-call',
      params: {
        interviewId: interview.interview_id,
        channelName: channelName,
        jobTitle: interview.job_title,
        companyName: interview.company_name,
        audio: interview.interview_type === "phone" ? "true" : "false"
      }
    });
  }, []);

  // Memoized handlers
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setStatusFilter(filter);
  }, []);

  const renderEmptyState = useCallback(() => (
    <EmptyState searchQuery={searchQuery} />
  ), [searchQuery]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: theme.spacing.lg }}>
        <ActivityIndicator size="small" color={theme.colors.primary.teal} />
      </View>
    );
  }, [loadingMore]);

  const renderItem = useCallback(({ item }) => (
    <InterviewCard item={item} onJoin={handleJoinInterview} />
  ), [handleJoinInterview]);

  const keyExtractor = useCallback((item) => `interview_${item.interview_id}`, []);

  // Loading Screen
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <InterviewsHeader
          stats={stats}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onFilterChange={handleFilterChange}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Fixed Header - Outside FlatList to prevent re-renders */}
      <InterviewsHeader
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onFilterChange={handleFilterChange}
      />
      
      <FlatList
        data={interviews}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.teal]}
            tintColor={theme.colors.primary.teal}
          />
        }
        contentContainerStyle={{paddingTop: theme.spacing.md}}
        onEndReached={loadMoreInterviews}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}