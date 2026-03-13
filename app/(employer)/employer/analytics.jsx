import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function EmployerAnalytics() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // '7', '30', '90', 'all'

  // Mock analytics data
  const [analyticsData] = useState({
    overview: {
      totalJobs: 24,
      activeJobs: 12,
      totalApplications: 486,
      totalViews: 2340,
      hiredCandidates: 8,
      averageTimeToHire: 18, // days
      costPerHire: 15000, // rupees
      applicationRate: 12.5, // percentage
    },
    recentMetrics: {
      applicationsThisWeek: 45,
      viewsThisWeek: 234,
      responsesThisWeek: 18,
      interviewsThisWeek: 8,
    },
    topPerformingJobs: [
      {
        id: '1',
        title: 'Senior React Developer',
        applications: 67,
        views: 445,
        conversionRate: 15.1,
        status: 'active',
        postedDate: '2024-01-05',
      },
      {
        id: '2',
        title: 'Frontend Developer',
        applications: 52,
        views: 389,
        conversionRate: 13.4,
        status: 'active',
        postedDate: '2024-01-08',
      },
      {
        id: '3',
        title: 'Full Stack Developer',
        applications: 43,
        views: 298,
        conversionRate: 14.4,
        status: 'paused',
        postedDate: '2024-01-10',
      },
    ],
    skillsDemand: [
      { skill: 'React', demand: 85, jobs: 8 },
      { skill: 'Node.js', demand: 72, jobs: 6 },
      { skill: 'TypeScript', demand: 68, jobs: 7 },
      { skill: 'Python', demand: 55, jobs: 4 },
      { skill: 'AWS', demand: 48, jobs: 5 },
    ],
    applicationTrends: [
      { period: 'Week 1', applications: 28, views: 156 },
      { period: 'Week 2', applications: 35, views: 203 },
      { period: 'Week 3', applications: 42, views: 278 },
      { period: 'Week 4', applications: 38, views: 245 },
    ],
    candidateInsights: {
      averageExperience: '3.2 years',
      topLocations: ['Mumbai', 'Bangalore', 'Pune', 'Delhi'],
      educationLevels: {
        'B.Tech': 45,
        'M.Tech': 25,
        'MCA': 15,
        'Others': 15,
      },
    },
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // Period selector
  const periods = [
    { value: '7', label: '7D' },
    { value: '30', label: '30D' },
    { value: '90', label: '90D' },
    { value: 'all', label: 'All' },
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          Hiring Analytics
        </Text>

        {/* Period Selector */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              onPress={() => setSelectedPeriod(period.value)}
              style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.md,
                backgroundColor: selectedPeriod === period.value 
                  ? theme.colors.primary.teal 
                  : theme.colors.background.accent,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: selectedPeriod === period.value 
                    ? theme.colors.neutral.white 
                    : theme.colors.text.secondary,
                }}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Overview Cards Component
  const OverviewCards = () => (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      {[
        {
          title: 'Total Applications',
          value: analyticsData.overview.totalApplications,
          icon: 'person-outline',
          color: theme.colors.primary.teal,
          change: '+12%',
          changeType: 'positive',
        },
        {
          title: 'Profile Views',
          value: analyticsData.overview.totalViews,
          icon: 'eye-outline',
          color: theme.colors.primary.orange,
          change: '+8%',
          changeType: 'positive',
        },
        {
          title: 'Active Jobs',
          value: analyticsData.overview.activeJobs,
          icon: 'briefcase-outline',
          color: theme.colors.status.success,
          change: '+2',
          changeType: 'positive',
        },
        {
          title: 'Hired',
          value: analyticsData.overview.hiredCandidates,
          icon: 'checkmark-circle-outline',
          color: theme.colors.primary.deepBlue,
          change: '+3',
          changeType: 'positive',
        },
      ].map((stat, index) => (
        <View
          key={index}
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            width: (width - theme.spacing.lg * 2 - theme.spacing.sm) / 2,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
          }}
        >
          <LinearGradient
            colors={['transparent', `${stat.color}10`]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: theme.borderRadius.lg,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <Ionicons
              name={stat.icon}
              size={18}
              color={stat.color}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {stat.title}
            </Text>
          </View>
          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: stat.color,
              marginBottom: theme.spacing.xs,
            }}
          >
            {stat.value}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={stat.changeType === 'positive' ? 'trending-up' : 'trending-down'}
              size={12}
              color={stat.changeType === 'positive' ? theme.colors.status.success : theme.colors.status.error}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: stat.changeType === 'positive' ? theme.colors.status.success : theme.colors.status.error,
              }}
            >
              {stat.change}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Key Metrics Component
  const KeyMetrics = () => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        margin: theme.spacing.lg,
        marginTop: 0,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.sizes.md,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md,
        }}
      >
        Key Hiring Metrics
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg }}>
        <View style={{ flex: 1, minWidth: '45%' }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Avg. Time to Hire
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.primary.teal,
            }}
          >
            {analyticsData.overview.averageTimeToHire} days
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: '45%' }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Cost per Hire
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.primary.orange,
            }}
          >
            ₹{(analyticsData.overview.costPerHire / 1000).toFixed(0)}K
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: '45%' }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Application Rate
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.status.success,
            }}
          >
            {analyticsData.overview.applicationRate}%
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: '45%' }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Avg. Experience
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.primary.deepBlue,
            }}
          >
            {analyticsData.candidateInsights.averageExperience}
          </Text>
        </View>
      </View>
    </View>
  );

  // Top Performing Jobs Component
  const TopPerformingJobs = () => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        margin: theme.spacing.lg,
        marginTop: 0,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.sizes.md,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md,
        }}
      >
        Top Performing Jobs
      </Text>

      {analyticsData.topPerformingJobs.map((job, index) => (
        <View
          key={job.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            borderBottomWidth: index < analyticsData.topPerformingJobs.length - 1 ? 1 : 0,
            borderBottomColor: theme.colors.border.light,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {job.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                }}
              >
                {job.applications} applications
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                }}
              >
                {job.views} views
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.teal,
                marginBottom: theme.spacing.xs,
              }}
            >
              {job.conversionRate}%
            </Text>
            <View
              style={{
                backgroundColor: job.status === 'active' 
                  ? `${theme.colors.status.success}15`
                  : `${theme.colors.status.warning}15`,
                borderRadius: theme.borderRadius.sm,
                paddingHorizontal: theme.spacing.xs,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: job.status === 'active' 
                    ? theme.colors.status.success
                    : theme.colors.status.warning,
                  textTransform: 'capitalize',
                }}
              >
                {job.status}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Skills in Demand Component
  const SkillsInDemand = () => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        margin: theme.spacing.lg,
        marginTop: 0,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.sizes.md,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.md,
        }}
      >
        Skills in Demand
      </Text>

      {analyticsData.skillsDemand.map((skill, index) => (
        <View
          key={index}
          style={{
            marginBottom: theme.spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.primary,
              }}
            >
              {skill.skill}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.primary.teal,
              }}
            >
              {skill.demand}%
            </Text>
          </View>

          <View
            style={{
              height: 6,
              backgroundColor: theme.colors.neutral.lightGray,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${skill.demand}%`,
                height: '100%',
                backgroundColor: theme.colors.primary.teal,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
              marginTop: theme.spacing.xs,
            }}
          >
            Used in {skill.jobs} job postings
          </Text>
        </View>
      ))}
    </View>
  );

  // Create FlatList data
  const createFlatListData = () => {
    const data = [
      { type: 'overview', id: 'overview' },
      { type: 'metrics', id: 'metrics' },
      { type: 'top-jobs', id: 'top-jobs' },
      { type: 'skills', id: 'skills' },
    ];
    return data;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'overview':
        return <OverviewCards />;
      case 'metrics':
        return <KeyMetrics />;
      case 'top-jobs':
        return <TopPerformingJobs />;
      case 'skills':
        return <SkillsInDemand />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          theme.colors.background.accent,
          'rgba(27, 163, 163, 0.02)',
          theme.colors.background.primary,
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        locations={[0, 0.3, 1]}
      />

      <Header />

      <FlatList
        data={createFlatListData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
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