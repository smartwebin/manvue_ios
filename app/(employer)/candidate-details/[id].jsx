import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import ScheduleInterviewModal from '@/components/ScheduleInterviewModal';
import SendProposalModal from '@/components/SendProposalModal';
import apiService from '@/services/apiService';
import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function CandidateDetails() {
  const { id } = useLocalSearchParams();
  
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  // Interview scheduling states
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewDate, setInterviewDate] = useState(new Date());
  const [interviewTime, setInterviewTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [interviewType, setInterviewType] = useState('video');
  const [notes, setNotes] = useState('');
  const [schedulingInterview, setSchedulingInterview] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (id && userId && companyId) {
      loadCandidateDetails();
    }
  }, [id, userId, companyId]);

  const loadUserData = async () => {
    try {
      const user_id = await SecureStore.getItemAsync('user_id');
      const company_id = await SecureStore.getItemAsync('company_id');

      if (!user_id || !company_id) {
        router.replace('/(auth)/employer-login');
        return;
      }

      setUserId(user_id);
      setCompanyId(company_id);
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
    }
  };

  const loadCandidateDetails = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const response = await apiService.getCandidateDetails(parseInt(id));

      if (response.success && response.data) {
        setCandidateData(response.data);

        if (__DEV__) {
          console.log('✅ Candidate loaded:', response.data.name);
          console.log('📊 Status:', response.data.status);
          console.log('📊 Source:', response.data.proposal_details?.source);
        }
      }
    } catch (error) {
      console.error('❌ Load candidate error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleProposalSent = () => {
    loadCandidateDetails(true);
  };

  const handleSendProposal = () => {
    // Send Proposal - Requires candidate approval/response
    // This is different from Select Candidate which works immediately
    if (candidateData?.proposal_sent) {
      return;
    }
    setShowProposalModal(true);
  };

  // Check if this is a recruiter invited candidate
  const isRecruiterInvite = () => {
    return candidateData?.proposal_details?.source === 'recruiter_invite';
  };

  // Check if this is a direct application
  const isDirectApply = () => {
    return candidateData?.proposal_details?.source === 'direct_apply';
  };

  // Check if candidate can be contacted (shortlisted or better)
  const canContact = () => {
    if (!candidateData?.status) return false;
    
    const contactableStatuses = [
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'under_review',
      'offered',
      'hired'
    ];
    
    return contactableStatuses.includes(candidateData.status);
  };

  const handleScheduleInterview = () => {
    if (!candidateData?.proposal_details?.application_id) {
      return;
    }

    setSelectedCandidate({
      application_id: candidateData.proposal_details.application_id,
      job_id: candidateData.proposal_details.job_id,
      user_id: candidateData.user_id,
      name: candidateData.name,
      matchedJobTitle: candidateData.matchedJobTitle || 'Interview',
    });
    
    setShowScheduleInterviewModal(true);
  };

  const handleChatPress = () => {
    if (!candidateData?.proposal_details?.application_id) {
      return;
    }

    // Navigate to chat with application_id and conversation_id
    const jobseekerId = candidateData.user_id;
    const applicationId = candidateData.proposal_details.application_id;
    const conversationId = candidateData.conversation?.conversation_id || 0;

    router.push(`/chat/${jobseekerId}/${applicationId}/${conversationId}`);
  };

  const handleViewInterview = (interview) => {
    router.push({
      pathname: '/video-call',
      params: {
        interviewId: interview.interview_id,
        channelName: interview.meeting_link,
        jobTitle: interview.job_title,
        candidateName: candidateData.name,
        audio: interview.interview_type === "phone" ? "true" : "false"
      }
    });
  };

  const handleHireCandidate = () => {
  Alert.alert(
    'Hire Candidate',
    `Confirm hiring ${candidateData.name} for this position?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Hire',
        style: 'default',
        onPress: async () => {
          try {
            const response = await apiService.updateApplicationStatus({
              application_id: candidateData.proposal_details?.application_id,
              status: 'hired',
              employer_user_id: parseInt(userId),
            });

            if (response.success) {
              Alert.alert('Success', 'Candidate hired successfully!');
              loadCandidateDetails(true);
            } else {
              Alert.alert('Error', response.message || 'Failed to hire candidate');
            }
          } catch (error) {
            console.error('❌ Error hiring candidate:', error);
            Alert.alert('Error', 'Failed to hire candidate');
          }
        }
      }
    ]
  );
};


  // This is used AFTER candidate accepts proposal (for submitted status)
  const handleSelectCandidate = () => {
    Alert.alert(
      'Select & Shortlist',
      `Move ${candidateData.name} to shortlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Shortlist',
          style: 'default',
          onPress: async () => {
            try {
              const response = await apiService.updateApplicationStatus({
                application_id: candidateData.proposal_details?.application_id,
                status: 'shortlisted',
                employer_user_id: parseInt(userId),
              });

              if (response.success) {
                Alert.alert('Success', 'Candidate shortlisted successfully!');
                loadCandidateDetails(true);
              } else {
                Alert.alert('Error', response.message || 'Failed to shortlist candidate');
              }
            } catch (error) {
              console.error('❌ Error shortlisting candidate:', error);
              Alert.alert('Error', 'Failed to shortlist candidate');
            }
          }
        }
      ]
    );
  };

  const handleShortlistCandidate = () => {
    Alert.alert(
      'Shortlist Candidate',
      `Add ${candidateData.name} to shortlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Shortlist',
          style: 'default',
          onPress: async () => {
            try {
              const response = await apiService.updateApplicationStatus({
                application_id: candidateData.proposal_details?.application_id,
                status: 'shortlisted',
                employer_user_id: parseInt(userId),
              });

              if (response.success) {
                Alert.alert('Success', 'Candidate shortlisted successfully!');
                loadCandidateDetails(true);
              } else {
                Alert.alert('Error', response.message || 'Failed to shortlist candidate');
              }
            } catch (error) {
              console.error('❌ Error shortlisting candidate:', error);
              Alert.alert('Error', 'Failed to shortlist candidate');
            }
          }
        }
      ]
    );
  };

  const handleRejectCandidate = () => {
    Alert.alert(
      'Reject Candidate',
      `Are you sure you want to reject ${candidateData.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.updateApplicationStatus({
                application_id: candidateData.proposal_details?.application_id,
                status: 'rejected',
                employer_user_id: parseInt(userId),
              });

              if (response.success) {
                Alert.alert('Success', 'Candidate rejected');
                loadCandidateDetails(true);
              } else {
                Alert.alert('Error', response.message || 'Failed to reject candidate');
              }
            } catch (error) {
              console.error('❌ Error rejecting candidate:', error);
              Alert.alert('Error', 'Failed to reject candidate');
            }
          }
        }
      ]
    );
  };

  const handleUnderReview = async () => {
    try {
      const response = await apiService.updateApplicationStatus({
        application_id: candidateData.proposal_details?.application_id,
        status: 'under_review',
        employer_user_id: parseInt(userId),
      });

      if (response.success) {
        Alert.alert('Success', 'Application moved to under review');
        loadCandidateDetails(true);
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

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

  const handleScheduleInterviewSubmit = async () => {
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

      const response = await apiService.scheduleInterview(scheduleData);

      if (response.success) {
        Alert.alert('Success', 'Interview scheduled successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowScheduleInterviewModal(false);
              setSelectedCandidate(null);
              setNotes('');
              loadCandidateDetails(true);
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('❌ Error scheduling interview:', error);
      Alert.alert('Error', 'Failed to schedule interview');
    } finally {
      setSchedulingInterview(false);
    }
  };

  const getStatusInfo = () => {
    const status = candidateData?.status || 'discovered';
    
    const statusMap = {
      discovered: {
        color: theme.colors.primary.orange,
        text: 'New Discovery',
        icon: 'eye-outline',
        gradient: [theme.colors.primary.orange, theme.colors.secondary.darkOrange]
      },
      submitted: {
        color: theme.colors.primary.deepBlue,
        text: isRecruiterInvite() ? 'Proposal Sent' : 'Application Received',
        icon: isRecruiterInvite() ? 'paper-plane-outline' : 'document-text-outline',
        gradient: [theme.colors.primary.deepBlue, theme.colors.secondary.darkBlue]
      },
      under_review: {
        color: theme.colors.primary.deepBlue,
        text: 'Under Review',
        icon: 'hourglass-outline',
        gradient: [theme.colors.primary.deepBlue, theme.colors.secondary.darkBlue]
      },
      shortlisted: {
        color: theme.colors.status.success,
        text: 'Shortlisted',
        icon: 'checkmark-circle-outline',
        gradient: [theme.colors.status.success, '#0E8A5F']
      },
      interview_scheduled: {
        color: theme.colors.primary.teal,
        text: 'Interview Scheduled',
        icon: 'calendar-outline',
        gradient: [theme.colors.primary.teal, theme.colors.secondary.darkTeal]
      },
      interviewed: {
        color: theme.colors.primary.teal,
        text: 'Interviewed',
        icon: 'videocam-outline',
        gradient: [theme.colors.primary.teal, theme.colors.secondary.darkTeal]
      },
      offered: {
        color: theme.colors.status.warning,
        text: 'Offer Extended',
        icon: 'gift-outline',
        gradient: [theme.colors.status.warning, '#D97706']
      },
      hired: {
        color: theme.colors.status.success,
        text: 'Hired',
        icon: 'trophy-outline',
        gradient: [theme.colors.status.success, '#0E8A5F']
      },
      rejected: {
        color: theme.colors.status.error,
        text: 'Rejected',
        icon: 'close-circle-outline',
        gradient: [theme.colors.status.error, '#DC2626']
      },
    };

    return statusMap[status] || statusMap.discovered;
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not disclosed';
    const salaryNum = parseFloat(salary);
    if (salaryNum >= 100000) {
      return `₹${(salaryNum / 100000).toFixed(1)}L`;
    } else if (salaryNum >= 1000) {
      return `₹${(salaryNum / 1000).toFixed(0)}K`;
    }
    return `₹${salaryNum.toLocaleString('en-IN')}`;
  };

  const formatNoticePeriod = (period) => {
    if (!period) return 'Not specified';
    return period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Header Component
  const Header = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.background.accent,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.primary.teal} />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: theme.typography.sizes.md,
          fontFamily: theme.typography.fonts.semiBold,
          color: theme.colors.text.primary,
        }}
      >
        Candidate Profile
      </Text>

      <View style={{ width: 40 }} />
    </View>
  );

  // Modern Section Component
  const Section = ({ title, icon, children, headerAction }) => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.background.accent,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <Ionicons name={icon} size={16} color={theme.colors.primary.teal} />
          </View>
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
            }}
          >
            {title}
          </Text>
        </View>
        {headerAction}
      </View>
      {children}
    </View>
  );

  // Modern Info Row Component
  const InfoRow = ({ icon, label, value, action }) => {
    if (!value || value === 'Not specified' || value === 'null') return null;

    return (
      <TouchableOpacity
        onPress={action}
        disabled={!action}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light + '30',
        }}
        activeOpacity={action ? 0.7 : 1}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.background.accent,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing.md,
          }}
        >
          <Ionicons name={icon} size={16} color={theme.colors.primary.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.tertiary,
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.primary,
            }}
          >
            {value}
          </Text>
        </View>
        {action && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.text.tertiary}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Action Button Component
  const ActionButton = ({ icon, label, onPress, variant = 'primary', fullWidth = false }) => {
    const buttonColors = {
      primary: {
        bg: theme.colors.primary.teal,
        text: theme.colors.neutral.white,
      },
      secondary: {
        bg: theme.colors.primary.deepBlue,
        text: theme.colors.neutral.white,
      },
      success: {
        bg: theme.colors.status.success,
        text: theme.colors.neutral.white,
      },
      warning: {
        bg: theme.colors.status.warning,
        text: theme.colors.neutral.white,
      },
      danger: {
        bg: theme.colors.status.error,
        text: theme.colors.neutral.white,
      },
      outline: {
        bg: 'transparent',
        text: theme.colors.text.primary,
        border: theme.colors.border.default,
      },
    };

    const colors = buttonColors[variant] || buttonColors.primary;

    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flex: fullWidth ? 1 : 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
          borderRadius: theme.borderRadius.lg,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.xs,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          minWidth: fullWidth ? undefined : 100,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={18} color={colors.text} />
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.semiBold,
            color: colors.text,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Get available actions based on status
 const getAvailableActions = () => {
  const status = candidateData?.status;
  const hasApplication = candidateData?.proposal_details?.application_id;
  const actions = [];

  // BUILD ACTIONS (order does NOT matter here)
  if (hasApplication && status === 'submitted') {
    actions.push({
      key: "shortlist_select",
      icon: 'checkmark-circle-outline',
      label: 'Select & Shortlist',
      onPress: handleSelectCandidate,
      variant: 'success',
      fullWidth: false,
    });
  }

  if (hasApplication) {
    actions.push({
      key: "shortlist",
      icon: 'star-outline',
      label: 'Shortlist',
      onPress: handleShortlistCandidate,
      variant: 'success',
      fullWidth: false,
    });
  }

  if (hasApplication && status === 'submitted') {
    actions.push({
      key: "under_review",
      icon: 'hourglass-outline',
      label: 'Under Review',
      onPress: handleUnderReview,
      variant: 'warning',
      fullWidth: false,
    });
  }

  if (canContact()) {
    actions.push({
      key: "chat",
      icon: 'chatbubble-ellipses-outline',
      label: 'Chat',
      onPress: handleChatPress,
      variant: 'secondary',
      fullWidth: false,
    });
  }

  if (canContact()) {
    actions.push({
      key: "interview",
      icon: 'calendar-outline',
      label: 'Schedule Interview',
      onPress: handleScheduleInterview,
      variant: 'primary',
      fullWidth: false,
    });
  }

  if (hasApplication) {
    actions.push({
      key: "hire",
      icon: 'checkmark-circle-outline',
      label: 'Hire Candidate',
      onPress: handleHireCandidate,
      variant: 'success',
      fullWidth: false,
    });
  }

  if (hasApplication && status !== 'hired' && status !== 'rejected' && status !== 'discovered') {
    actions.push({
      key: "reject",
      icon: 'close-circle-outline',
      label: 'Reject',
      onPress: handleRejectCandidate,
      variant: 'danger',
      fullWidth: false,
    });
  }

  // 🔥 SORT ACTIONS IN THE REQUIRED ORDER
  const sortOrder = ["chat", "interview", "shortlist", "hire", "reject"];
  return actions.sort(
    (a, b) => sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key)
  );
};

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary.teal} />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.md,
            }}
          >
            Loading profile...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!candidateData) {
    return (
      <SafeAreaWrapper>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.background.accent,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            <Ionicons name="person-outline" size={48} color={theme.colors.primary.teal} />
          </View>
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Candidate Not Found
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: theme.spacing.xl,
            }}
          >
            This candidate profile is not available
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.md,
              backgroundColor: theme.colors.primary.teal,
              borderRadius: theme.borderRadius.lg,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.neutral.white,
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaWrapper>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      <View style={{ flex: 1, backgroundColor: theme.colors.background.secondary }}>
        <Header />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCandidateDetails(true)}
              colors={[theme.colors.primary.teal]}
              tintColor={theme.colors.primary.teal}
            />
          }
        >
          {/* Profile Header Card - Modern Design */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              marginHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.md,
              borderRadius: theme.borderRadius.xl,
              overflow: 'hidden',
              ...theme.shadows.md,
            }}
          >
            {/* Gradient Background */}
            <LinearGradient
              colors={statusInfo.gradient}
              style={{
                paddingTop: theme.spacing.xl,
                paddingBottom: theme.spacing.lg,
                paddingHorizontal: theme.spacing.lg,
              }}
            >
              {/* Profile Image */}
              <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.neutral.white,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    borderWidth: 4,
                    borderColor: theme.colors.neutral.white + '40',
                  }}
                >
                  {candidateData.profile_image ? (
                    <Image
                      source={{ 
                        uri: candidateData.profile_image.startsWith('http') 
                          ? candidateData.profile_image 
                          : `https://manvue.in/photos/medium/${candidateData.profile_image}`
                      }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={48} color={theme.colors.primary.teal} />
                  )}
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -10,
                    backgroundColor: theme.colors.neutral.white,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.full,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...theme.shadows.sm,
                  }}
                >
                  <Ionicons
                    name={statusInfo.icon}
                    size={14}
                    color={statusInfo.color}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.text}
                  </Text>
                </View>
              </View>

              {/* Name and Title */}
              <View style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xxl,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                    marginBottom: theme.spacing.xs,
                    textAlign: 'center',
                  }}
                >
                  {candidateData.name}
                </Text>

                {candidateData.current_title && (
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.neutral.white + 'DD',
                      marginBottom: theme.spacing.xs,
                      textAlign: 'center',
                    }}
                  >
                    {candidateData.current_title}
                  </Text>
                )}

                {candidateData.current_company && (
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: theme.colors.neutral.white + '20',
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.full,
                  }}>
                    <Ionicons
                      name="business-outline"
                      size={12}
                      color={theme.colors.neutral.white}
                      style={{ marginRight: theme.spacing.xs }}
                    />
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.neutral.white + 'DD',
                      }}
                    >
                      {candidateData.current_company}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Quick Stats */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingVertical: theme.spacing.lg,
                paddingHorizontal: theme.spacing.lg,
              }}
            >
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.background.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary.teal} />
                </View>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.md,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                  }}
                >
                  {candidateData.experience || '0'}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  Experience
                </Text>
              </View>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.background.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <Ionicons name="code-slash-outline" size={20} color={theme.colors.primary.teal} />
                </View>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.md,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                  }}
                >
                  {candidateData.skills?.length || 0}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  Skills
                </Text>
              </View>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.background.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary.teal} />
                </View>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.md,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                  }}
                >
                  {candidateData.profileCompletion || 0}%
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  Complete
                </Text>
              </View>
            </View>
          </View>

          {/* Scheduled Interviews - Only show if candidate can be contacted */}
          {canContact() && candidateData?.interviews && candidateData.interviews.length > 0 && (
            <Section
              title="Scheduled Interviews"
              icon="calendar-outline"
              headerAction={
                <View
                  style={{
                    backgroundColor: theme.colors.primary.orange + '20',
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: 4,
                    borderRadius: theme.borderRadius.full,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.bold,
                      color: theme.colors.primary.orange,
                    }}
                  >
                    {candidateData.interviews.length}
                  </Text>
                </View>
              }
            >
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: theme.spacing.xs }}
              >
                {candidateData.interviews.map((interview) => (
                  <TouchableOpacity
                    key={interview.interview_id}
                    onPress={() => handleViewInterview(interview)}
                    style={{
                      backgroundColor: interview.is_today 
                        ? theme.colors.primary.orange + '15' 
                        : theme.colors.background.accent,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                      marginRight: theme.spacing.md,
                      borderWidth: 2,
                      borderColor: interview.is_today 
                        ? theme.colors.primary.orange 
                        : theme.colors.border.light,
                      minWidth: 240,
                    }}
                    activeOpacity={0.7}
                  >
                  
                    {interview.is_today && (
                      <View
                        style={{
                          position: 'absolute',
                          top: theme.spacing.sm,
                          right: theme.spacing.sm,
                          backgroundColor: theme.colors.primary.orange,
                          borderRadius: theme.borderRadius.sm,
                          paddingHorizontal: theme.spacing.sm,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.bold,
                            color: theme.colors.neutral.white,
                          }}
                        >
                          TODAY
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: interview.is_today 
                            ? theme.colors.primary.orange 
                            : theme.colors.primary.teal,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        <Ionicons
                          name={interview.interview_type === 'Video' ? 'videocam-outline' : 'call-outline'}
                          size={16}
                          color={theme.colors.neutral.white}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: interview.is_today 
                            ? theme.colors.primary.orange 
                            : theme.colors.primary.teal,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {interview.interview_type}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.semiBold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                      }}
                      numberOfLines={2}
                    >
                      {interview.job_title}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={theme.colors.text.tertiary}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.medium,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {interview.scheduled_datetime}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name="stopwatch-outline"
                        size={14}
                        color={theme.colors.text.tertiary}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.tertiary,
                        }}
                      >
                        {interview.duration_minutes} minutes
                      </Text>
                    </View>

                    <View
                      style={{
                        marginTop: theme.spacing.md,
                        paddingTop: theme.spacing.sm,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border.light,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: interview.is_today 
                            ? theme.colors.primary.orange 
                            : theme.colors.primary.teal,
                          marginRight: theme.spacing.xs,
                        }}
                      >
                        Join Interview
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={interview.is_today 
                          ? theme.colors.primary.orange 
                          : theme.colors.primary.teal}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Section>
          )}
          {/* Actions Section */}
          {getAvailableActions().length > 0 && (
            <Section title="Actions" icon="options-outline">
              <View style={{ gap: theme.spacing.md }}>
                {/* Show single full-width action or multiple actions in rows */}
                {getAvailableActions().map((action, index) => {
                  const actions = getAvailableActions();

                  // If single action or this is a fullWidth action, show it alone
                  if (action.fullWidth) {
                    return (
                      <ActionButton
                        key={index}
                        icon={action.icon}
                        label={action.label}
                        onPress={action.onPress}
                        variant={action.variant}
                        fullWidth={true}
                      />
                    );
                  }

                  // Group actions in pairs for better layout
                  if (index % 2 === 0) {
                    const nextAction = actions[index + 1];
                    if (nextAction && !nextAction.fullWidth) {
                      // Two buttons in a row
                      return (
                        <View key={index} style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                          <ActionButton
                            icon={action.icon}
                            label={action.label}
                            onPress={action.onPress}
                            variant={action.variant}
                            fullWidth={true}
                          />
                          <ActionButton
                            icon={nextAction.icon}
                            label={nextAction.label}
                            onPress={nextAction.onPress}
                            variant={nextAction.variant}
                            fullWidth={true}
                          />
                        </View>
                      );
                    } else {
                      // Single button (next is fullWidth or doesn't exist)
                      return (
                        <ActionButton
                          key={index}
                          icon={action.icon}
                          label={action.label}
                          onPress={action.onPress}
                          variant={action.variant}
                          fullWidth={true}
                        />
                      );
                    }
                  }

                  // Skip rendering for odd indices (already rendered with previous)
                  return null;
                })}
              </View>
            </Section>
          )}

          {/* Contact Information */}
          <Section title="Contact Information" icon="mail-outline">
            <InfoRow icon="mail" label="Email" value={candidateData.email} />
            <InfoRow icon="call" label="Phone" value={candidateData.phone} />
            <InfoRow icon="location" label="Location" value={candidateData.location} />
            {candidateData.full_address && (
              <InfoRow icon="home" label="Address" value={candidateData.full_address} />
            )}
          </Section>

          {/* Bio */}
          {candidateData.bio && (
            <Section title="About" icon="document-text-outline">
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  lineHeight: theme.typography.sizes.sm * 1.6,
                }}
              >
                {candidateData.bio}
              </Text>
            </Section>
          )}

          {/* Professional Details */}
          <Section title="Professional Details" icon="briefcase-outline">
            <InfoRow icon="time" label="Experience" value={candidateData.experience} />
            {candidateData.area_of_interest && (
              <InfoRow icon="bulb" label="Interest" value={candidateData.area_of_interest} />
            )}
            {candidateData.function && (
              <InfoRow icon="code-working" label="Function" value={candidateData.function} />
            )}
            {candidateData.industry_nature && (
              <InfoRow icon="business" label="Industry" value={candidateData.industry_nature} />
            )}
            {candidateData.highest_education && (
              <InfoRow icon="school" label="Education" value={candidateData.highest_education} />
            )}
          </Section>

          {/* Job Preferences */}
          <Section title="Job Preferences" icon="settings-outline">
            <InfoRow 
              icon="briefcase" 
              label="Job Type" 
              value={candidateData.job_type_preference?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            />
            <InfoRow 
              icon="laptop" 
              label="Work Mode" 
              value={candidateData.work_mode_preference?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            />
            <InfoRow 
              icon="timer" 
              label="Notice Period" 
              value={formatNoticePeriod(candidateData.notice_period)} 
            />
            <InfoRow 
              icon="airplane" 
              label="Relocate" 
              value={candidateData.willing_to_relocate ? 'Yes' : 'No'} 
            />
            <InfoRow 
              icon="checkmark-circle" 
              label="Status" 
              value={candidateData.availability_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            />
          </Section>

          {/* Salary */}
          {(candidateData.current_salary || candidateData.expected_salary) && (
            <Section title="Salary Details" icon="cash-outline">
              {candidateData.current_salary && (
                <InfoRow 
                  icon="wallet" 
                  label="Current CTC" 
                  value={formatSalary(candidateData.current_salary)} 
                />
              )}
              {candidateData.expected_salary && (
                <InfoRow 
                  icon="trending-up" 
                  label="Expected CTC" 
                  value={formatSalary(candidateData.expected_salary)} 
                />
              )}
            </Section>
          )}

          {/* Skills */}
          {candidateData.skills && candidateData.skills.length > 0 && (
            <Section title="Skills" icon="code-slash-outline">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.xs }}>
                {candidateData.skills.map((skill, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: theme.colors.background.accent,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.full,
                      marginRight: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                      borderWidth: 1,
                      borderColor: theme.colors.primary.teal + '40',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.primary.teal,
                      }}
                    >
                      {skill.skill_name}
                    </Text>
                    {skill.years_of_experience > 0 && (
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.tertiary,
                          marginLeft: theme.spacing.xs,
                        }}
                      >
                        • {skill.years_of_experience}y
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Waiting for Response - When proposal sent but not accepted */}
          {candidateData?.status === 'discovered' && candidateData?.proposal_sent && !candidateData?.proposal_details?.application_id && (
            <View
              style={{
                backgroundColor: theme.colors.primary.orange + '15',
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.lg,
                marginHorizontal: theme.spacing.lg,
                marginBottom: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.primary.orange + '40',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.primary.orange,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: theme.spacing.md,
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={theme.colors.neutral.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.bold,
                      color: theme.colors.primary.orange,
                      marginBottom: 4,
                    }}
                  >
                    Proposal Sent - Awaiting Response
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Waiting for candidate to accept your job proposal
                  </Text>
                </View>
              </View>
            </View>
          )}

          

          {/* Work Experience */}
          {candidateData.workExperience && candidateData.workExperience.length > 0 && (
            <Section title="Work Experience" icon="briefcase-outline">
              {candidateData.workExperience.map((exp, index) => (
                <View
                  key={index}
                  style={{
                    marginBottom: index < candidateData.workExperience.length - 1 ? theme.spacing.lg : 0,
                    paddingBottom: index < candidateData.workExperience.length - 1 ? theme.spacing.lg : 0,
                    borderBottomWidth: index < candidateData.workExperience.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border.light + '40',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xs }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.base,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: theme.colors.text.primary,
                          marginBottom: 4,
                        }}
                      >
                        {exp.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.medium,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {exp.company}
                      </Text>
                    </View>
                    {exp.is_current && (
                      <View
                        style={{
                          backgroundColor: theme.colors.status.success,
                          paddingHorizontal: theme.spacing.sm,
                          paddingVertical: 4,
                          borderRadius: theme.borderRadius.sm,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.semiBold,
                            color: theme.colors.neutral.white,
                          }}
                        >
                          Current
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.xs }}>
                    {exp.employment_type && (
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        marginRight: theme.spacing.md,
                        marginBottom: theme.spacing.xs,
                      }}>
                        <Ionicons
                          name="briefcase-outline"
                          size={12}
                          color={theme.colors.text.tertiary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.regular,
                            color: theme.colors.text.tertiary,
                          }}
                        >
                          {exp.employment_type}
                        </Text>
                      </View>
                    )}
                    {exp.location && (
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        marginRight: theme.spacing.md,
                        marginBottom: theme.spacing.xs,
                      }}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color={theme.colors.text.tertiary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.regular,
                            color: theme.colors.text.tertiary,
                          }}
                        >
                          {exp.location}
                        </Text>
                      </View>
                    )}
                    {exp.duration && (
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        marginBottom: theme.spacing.xs,
                      }}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={theme.colors.text.tertiary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.regular,
                            color: theme.colors.text.tertiary,
                          }}
                        >
                          {exp.duration}
                        </Text>
                      </View>
                    )}
                  </View>

                  {exp.description && (
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.secondary,
                        marginTop: theme.spacing.sm,
                        lineHeight: theme.typography.sizes.sm * 1.5,
                      }}
                    >
                      {exp.description}
                    </Text>
                  )}
                </View>
              ))}
            </Section>
          )}

          {/* Education */}
          {candidateData.educationHistory && candidateData.educationHistory.length > 0 && (
            <Section title="Education" icon="school-outline">
              {candidateData.educationHistory.map((edu, index) => (
                <View
                  key={index}
                  style={{
                    marginBottom: index < candidateData.educationHistory.length - 1 ? theme.spacing.lg : 0,
                    paddingBottom: index < candidateData.educationHistory.length - 1 ? theme.spacing.lg : 0,
                    borderBottomWidth: index < candidateData.educationHistory.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border.light + '40',
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {edu.degree}
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.text.secondary,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {edu.institution}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    {edu.field_of_study && (
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.tertiary,
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        {edu.field_of_study}
                      </Text>
                    )}
                    {edu.duration && (
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.tertiary,
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        • {edu.duration}
                      </Text>
                    )}
                    {edu.grade && (
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.tertiary,
                        }}
                      >
                        • {edu.grade}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* Bottom padding - increase if floating button is shown */}
          <View style={{ height: candidateData?.status === 'discovered' && !candidateData?.proposal_sent ? 100 : 40 }} />
        </ScrollView>

        {/* Floating Send Proposal Button - Only for discovered candidates */}
        {candidateData?.status === 'discovered' && !candidateData?.proposal_sent && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.colors.background.card,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.xl,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border.light,
              ...theme.shadows.lg,
            }}
          >
            <TouchableOpacity
              onPress={handleSendProposal}
              style={{
                backgroundColor: theme.colors.primary.teal,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md + 2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...theme.shadows.md,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={20} color={theme.colors.neutral.white} />
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                  marginLeft: theme.spacing.sm,
                }}
              >
                Send Job Proposal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modals */}
        <SendProposalModal
          visible={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          candidate={candidateData}
          onProposalSent={handleProposalSent}
        />

        <ScheduleInterviewModal
          visible={showScheduleInterviewModal}
          onClose={() => {
            setShowScheduleInterviewModal(false);
            setSelectedCandidate(null);
            setNotes('');
          }}
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
          onSchedule={handleScheduleInterviewSubmit}
        />
      </View>
    </SafeAreaWrapper>
  );
}