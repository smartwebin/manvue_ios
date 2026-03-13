import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import ScheduleInterviewModal from '@/components/ScheduleInterviewModal';
import apiService from '@/services/apiService';
import theme from '@/theme';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Stats Bar Component - MOVED OUTSIDE
const StatsBar = React.memo(({ stats }) => {
  if (!stats) return null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        marginBottom: theme.spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <StatItem 
          label="Total" 
          value={stats.total} 
          color={theme.colors.primary.teal} 
        />
        <StatItem 
          label="New" 
          value={stats.new_applications} 
          color={theme.colors.primary.blue} 
        />
        <StatItem 
          label="Shortlisted" 
          value={stats.shortlisted} 
          color={theme.colors.status.success} 
        />
        <StatItem 
          label="Not Interviewed" 
          value={stats.not_interviewed} 
          color={theme.colors.primary.orange} 
        />
      </View>
    </View>
  );
});

const StatItem = React.memo(({ label, value, color }) => (
  <View style={{ alignItems: 'center' }}>
    <Text
      style={{
        fontSize: theme.typography.sizes.xl,
        fontFamily: theme.typography.fonts.bold,
        color: color,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: theme.typography.sizes.xs,
        fontFamily: theme.typography.fonts.regular,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
      }}
    >
      {label}
    </Text>
  </View>
));

// Header Component - MOVED OUTSIDE
const Header = React.memo(({ candidatesCount, searchQuery, setSearchQuery }) => (
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
    {/* Title */}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.sizes.xl,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
          }}
        >
          Schedule Interview
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.secondary,
          }}
        >
          {candidatesCount} eligible candidates
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.background.accent,
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={20} color={theme.colors.text.primary} />
      </TouchableOpacity>
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
        marginBottom: theme.spacing.sm,
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
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
));

// Candidate Card Component - MOVED OUTSIDE
const CandidateCard = React.memo(({ item, onSchedulePress }) => (
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
    {/* Status Badge + Interview Badge */}
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
      <View
        style={{
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.borderRadius.sm,
          backgroundColor: 
            item.status_color === 'green' ? theme.colors.status.success + '20' :
            item.status_color === 'blue' ? theme.colors.primary.blue + '20' :
            item.status_color === 'orange' ? theme.colors.primary.orange + '20' :
            item.status_color === 'purple' ? '#9333ea20' :
            theme.colors.neutral.lightGray,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.semiBold,
            color: 
              item.status_color === 'green' ? theme.colors.status.success :
              item.status_color === 'blue' ? theme.colors.primary.blue :
              item.status_color === 'orange' ? theme.colors.primary.orange :
              item.status_color === 'purple' ? '#9333ea' :
              theme.colors.text.secondary,
          }}
        >
          {item.status_label}
        </Text>
      </View>

      {item.has_interview && (
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.colors.primary.teal + '20',
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
          }}
        >
          <AntDesign name="calendar" size={10} color={theme.colors.primary.teal} />
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.primary.teal,
            }}
          >
            Interview Scheduled
          </Text>
        </View>
      )}
    </View>

    {/* Candidate Info */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
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
          {item.initials || 'JS'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.semiBold,
            color: theme.colors.text.primary,
          }}
          numberOfLines={1}
        >
          {item.name || 'Job Seeker'}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.secondary,
          }}
          numberOfLines={1}
        >
          {item.position || 'Job Seeker'}
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
        Applied for: {item.matchedJobTitle || 'Position'}
      </Text>
    </View>

    {/* Details */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
      {item.experience && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
          >
            {item.experience}
          </Text>
        </View>
      )}

      {item.matchPercentage > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name="star"
            size={14}
            color={theme.colors.primary.orange}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.primary.orange,
            }}
          >
            {item.matchPercentage}% Match
          </Text>
        </View>
      )}

      {item.location && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
    </View>

    {/* Skills */}
    {item.skills && item.skills.length > 0 && (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        {item.skills.slice(0, 3).map((skill, index) => (
          <View
            key={index}
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.secondary.lightTeal,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.neutral.white,
              }}
            >
              {skill}
            </Text>
          </View>
        ))}
        {item.skills.length > 3 && (
          <View
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.neutral.lightGray,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              }}
            >
              +{item.skills.length - 3}
            </Text>
          </View>
        )}
      </View>
    )}

    {/* Schedule Button - REMOVED disabled condition to allow multiple interviews */}
    <TouchableOpacity
      onPress={() => onSchedulePress(item)}
      style={{
        backgroundColor: theme.colors.primary.teal,
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
      }}
      activeOpacity={0.8}
    >
      <AntDesign 
        name="calendar" 
        size={16} 
        color={theme.colors.neutral.white} 
      />
      <Text
        style={{
          fontSize: theme.typography.sizes.base,
          fontFamily: theme.typography.fonts.semiBold,
          color: theme.colors.neutral.white,
        }}
      >
        {item.has_interview ? 'Schedule Another Interview' : 'Schedule Interview'}
      </Text>
    </TouchableOpacity>
  </View>
));

// Empty State Component - MOVED OUTSIDE
const EmptyState = React.memo(({ searchQuery }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
      }}
    >
      <Ionicons name="people-outline" size={32} color={theme.colors.primary.teal} />
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
      No Candidates Found
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
        ? 'No candidates match your search'
        : 'No eligible candidates available for interview scheduling'}
    </Text>
  </View>
));

// List Header combining Header and StatsBar
const ListHeaderComponent = React.memo(({ candidatesCount, searchQuery, setSearchQuery, stats }) => (
  <>
    <Header 
      candidatesCount={candidatesCount}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
    <StatsBar stats={stats} />
  </>
));

export default function ScheduleInterviewScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [schedulingInterview, setSchedulingInterview] = useState(false);

  const [interviewDate, setInterviewDate] = useState(new Date());
  const [interviewTime, setInterviewTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [interviewType, setInterviewType] = useState('video');
  const [notes, setNotes] = useState('');

  const searchTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadUserData();
    
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userId && companyId && isInitialMount.current) {
      loadCandidates();
      isInitialMount.current = false;
    }
  }, [userId, companyId]);

  // Debounced search effect - FIX: Prevents input from losing focus
  useEffect(() => {
    // Skip if initial mount or no user data
    if (isInitialMount.current || !userId || !companyId) {
      return;
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        loadCandidates();
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadUserData = async () => {
    try {
      const id = await SecureStore.getItemAsync('user_id');
      const cId = await SecureStore.getItemAsync('company_id');

      if (!id || !cId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        router.replace('/(auth)/employer-login');
        return;
      }

      setUserId(id);
      setCompanyId(cId);
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    if (!userId || !companyId) return;

    try {
      // Only show loading indicator on initial load, not on search
      if (isInitialMount.current) {
        setLoading(true);
      }

      const params = {
        employer_user_id: parseInt(userId),
        company_id: parseInt(companyId),
        search_query: searchQuery,
        limit: 100,
        offset: 0,
      };

      const response = await apiService.getInterviewEligibleCandidates(params);

      if (response.success && isMountedRef.current) {
        setCandidates(response.data.candidates || []);
        setStats(response.data.stats || null);
        
        if (__DEV__) {
          console.log('✅ Loaded candidates:', response.data.candidates?.length || 0);
          console.log('📊 Stats:', response.data.stats);
        }
      } else {
        console.error('❌ Failed to load candidates:', response.message);
        if (isMountedRef.current) {
          setCandidates([]);
          setStats(null);
        }
      }
    } catch (error) {
      console.error('❌ Error loading candidates:', error);
      if (isMountedRef.current) {
        setCandidates([]);
        setStats(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  }, [userId, companyId, searchQuery]);

  const handleSchedulePress = useCallback((candidate) => {
    if (__DEV__) {
      console.log('📅 Schedule interview for candidate:', candidate.name);
    }
    setSelectedCandidate(candidate);
    setShowScheduleModal(true);
    setInterviewDate(new Date());
    setInterviewTime(new Date());
    setDuration('60');
    setInterviewType('video');
    setNotes('');
  }, []);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate) return;

    if (!duration || parseInt(duration) < 15) {
      Alert.alert('Validation Error', 'Duration must be at least 15 minutes');
      return;
    }

    try {
      setSchedulingInterview(true);

      const scheduleData = {
        employer_user_id: parseInt(userId),
        application_id: selectedCandidate.application_id,
        job_id: selectedCandidate.job_id,
        jobseeker_id: selectedCandidate.user_id,
        scheduled_date: formatDate(interviewDate),
        scheduled_time: formatTime(interviewTime),
        duration_minutes: parseInt(duration),
        interview_type: interviewType,
        meeting_notes: notes,
      };

      if (__DEV__) {
        console.log('📅 Scheduling interview:', scheduleData);
      }

      const response = await apiService.scheduleInterview(scheduleData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Interview scheduled successfully! The candidate will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowScheduleModal(false);
                setSelectedCandidate(null);
                loadCandidates();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('❌ Error scheduling interview:', error);
      Alert.alert('Error', 'Failed to schedule interview. Please try again.');
    } finally {
      setSchedulingInterview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary.teal} />
            <Text
              style={{
                marginTop: theme.spacing.md,
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
            >
              Loading candidates...
            </Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <FlatList
          data={candidates}
          renderItem={({ item }) => (
            <CandidateCard 
              item={item} 
              onSchedulePress={handleSchedulePress}
            />
          )}
          keyExtractor={(item) => `candidate_${item.application_id}`}
          ListHeaderComponent={
            <ListHeaderComponent
              candidatesCount={candidates.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              stats={stats}
            />
          }
          ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingVertical: candidates.length > 0 ? theme.spacing.sm : 0 
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
          keyboardShouldPersistTaps="handled"
        />

        <ScheduleInterviewModal
          visible={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          selectedCandidate={selectedCandidate}
          interviewDate={interviewDate}
          setInterviewDate={setInterviewDate}
          interviewTime={interviewTime}
          setInterviewTime={setInterviewTime}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          showTimePicker={showTimePicker}
          setShowTimePicker={setShowTimePicker}
          duration={duration}
          setDuration={setDuration}
          interviewType={interviewType}
          setInterviewType={setInterviewType}
          notes={notes}
          setNotes={setNotes}
          schedulingInterview={schedulingInterview}
          onSchedule={handleScheduleInterview}
        />
      </View>
    </SafeAreaWrapper>
  );
}