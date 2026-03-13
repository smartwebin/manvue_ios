import JobApplicationModal from "@/components/JobApplicationModal";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams(); // job_id from route params
  console.log("🔍 Viewing details for job ID:", id);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [error, setError] = useState(null);

  // Application modal
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId && id) {
      loadJobDetails();
    }
  }, [userId, id]);

  const loadUserId = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync("user_id");
      if (!storedUserId) {
        setError("User not found. Please log in again.");
        router.replace("/(auth)/login");
        return;
      }
      setUserId(storedUserId);
    } catch (error) {
      console.error("❌ Failed to get user ID:", error);
      setError("Failed to load user data.");
    }
  };

  const loadJobDetails = async (showLoader = true) => {
    if (!userId || !id) return;

    try {
      if (showLoader) setLoading(true);
      setError(null);

      const params = {
        job_id: parseInt(id),
        user_id: parseInt(userId),
      };

      if (__DEV__) {
        console.log("📤 Loading job details with params:", params);
      }

      const response = await apiService.getJobDetails(params);

      if (__DEV__) {
        console.log("📦 Job details response:", response);
      }

      if (response.success) {
        setJobDetails(response.data);
      } else {
        console.error("❌ Failed to load job details:", response.message);
        setError(response.message);
      }
    } catch (error) {
      console.error("❌ Error loading job details:", error);
      setError("Failed to load job details. Please try again.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobDetails(false);
    setRefreshing(false);
  }, [userId, id]);

  const handleApplyPress = () => {
    if (jobDetails?.has_applied) {
      Alert.alert(
        "Already Applied",
        `You have already applied for this position. Your application status is: ${jobDetails.application_status?.replace(
          "_",
          " "
        )}`,
        [{ text: "OK" }]
      );
      return;
    }
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!coverLetter.trim()) {
      Alert.alert("Required", "Please enter a cover letter");
      return;
    }

    try {
      setSubmitting(true);

      const params = {
        job_id: parseInt(id),
        jobseeker_id: parseInt(userId),
        cover_letter: coverLetter.trim(),
        expected_salary: expectedSalary ? parseFloat(expectedSalary) : null,
        availability_date: availabilityDate || null,
      };

      if (__DEV__) {
        console.log("📤 Submitting application:", params);
      }

      const response = await apiService.submitJobApplication(params);

      if (__DEV__) {
        console.log("📦 Submit application response:", response);
      }

      if (response.success) {
        setShowApplicationModal(false);
        setCoverLetter("");
        setExpectedSalary("");
        setAvailabilityDate("");

        Alert.alert(
          "Success!",
          "Your application has been submitted successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                // Reload job details to reflect applied status
                loadJobDetails(false);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to submit application"
        );
      }
    } catch (error) {
      console.error("❌ Error submitting application:", error);
      Alert.alert("Error", "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Section Header Component
  const SectionHeader = ({ icon, title }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.lg,
      }}
    >
      <Ionicons name={icon} size={24} color={theme.colors.primary.teal} />
      <Text
        style={{
          fontSize: theme.typography.sizes.lg,
          fontFamily: theme.typography.fonts.bold,
          color: theme.colors.text.primary,
          marginLeft: theme.spacing.sm,
        }}
      >
        {title}
      </Text>
    </View>
  );

  // Bullet List Component
  const BulletList = ({ items }) => (
    <View style={{ gap: theme.spacing.sm }}>
      {items.map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.colors.primary.teal,
              marginTop: 6,
              marginRight: theme.spacing.sm,
            }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.sizes.base * 1.5,
            }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );

  // Info Row Component
  const InfoRow = ({ icon, label, value }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={theme.colors.primary.teal}
        style={{ width: 30 }}
      />
      <Text
        style={{
          fontSize: theme.typography.sizes.sm,
          fontFamily: theme.typography.fonts.medium,
          color: theme.colors.text.tertiary,
          width: 120,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          fontSize: theme.typography.sizes.base,
          fontFamily: theme.typography.fonts.semiBold,
          color: theme.colors.text.primary,
        }}
      >
        {value}
      </Text>
    </View>
  );

  // Loading Screen
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
        <ActivityIndicator
          size="large"
          color={theme.colors.primary.teal}
          style={{ marginBottom: theme.spacing.md }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
          }}
        >
          Loading job details...
        </Text>
      </View>
    );
  }

  // Error Screen
  if (error && !jobDetails) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.status.error}
          style={{ marginBottom: theme.spacing.lg }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
            textAlign: "center",
            marginBottom: theme.spacing.sm,
          }}
        >
          Unable to Load Job
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.secondary,
            textAlign: "center",
            marginBottom: theme.spacing.xl,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => loadJobDetails(true)}
          style={{
            backgroundColor: theme.colors.primary.teal,
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
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
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!jobDetails) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.status.error}
          style={{ marginBottom: theme.spacing.lg }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
            textAlign: "center",
            marginBottom: theme.spacing.sm,
          }}
        >
          Job Details Unavailable
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.secondary,
            textAlign: "center",
            marginBottom: theme.spacing.xl,
          }}
        >
          The job information you're looking for does not exist or may have been
          removed.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper>
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: theme.spacing.md }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              Job Details
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          // contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary.teal]}
              tintColor={theme.colors.primary.teal}
            />
          }
        >
          {/* Company Header */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              padding: theme.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
          >
            <View
              style={{ flexDirection: "row", marginBottom: theme.spacing.md }}
            >
              {jobDetails.company?.company_logo ? (
                <Image
                  source={{ uri: jobDetails.company.company_logo }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    marginRight: theme.spacing.md,
                    borderWidth: 2,
                    borderColor: theme.colors.border.light,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: theme.colors.background.accent,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: theme.spacing.md,
                    borderWidth: 2,
                    borderColor: theme.colors.primary.teal,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xl,
                      fontFamily: theme.typography.fonts.bold,
                      color: theme.colors.primary.teal,
                    }}
                  >
                    {jobDetails.company?.company_name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xl,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                  }}
                  numberOfLines={2}
                >
                  {jobDetails.job_title}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.primary.teal,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {jobDetails.company?.company_name}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  {jobDetails.posted_time}
                </Text>
              </View>
            </View>

            {/* Match Badge */}
            <View
              style={{
                alignSelf: "flex-start",
                borderRadius: theme.borderRadius.full,
                overflow: "hidden",
                marginBottom: theme.spacing.md,
              }}
            >
              <LinearGradient
                colors={
                  jobDetails.match_percentage >= 80
                    ? [theme.colors.status.success, "#0D9488"]
                    : jobDetails.match_percentage >= 60
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
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {jobDetails.match_percentage}% Match •{" "}
                  {jobDetails.matching_skills_count}/
                  {jobDetails.total_required_skills} Skills
                </Text>
              </LinearGradient>
            </View>

            {/* Quick Info */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: theme.spacing.md,
              }}
            >
              {jobDetails.location && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="location-outline"
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
                    {jobDetails.location}
                  </Text>
                </View>
              )}

              {jobDetails.work_mode && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="laptop-outline"
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
                    {jobDetails.work_mode.replace("_", " ")}
                  </Text>
                </View>
              )}

              {jobDetails.employment_type && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="briefcase-outline"
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
                    {jobDetails.employment_type.replace("_", " ")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Job Information */}
          <View style={{ padding: theme.spacing.lg }}>
            {/* Salary & Experience */}
            {jobDetails.salary_range && (
              <InfoRow
                icon="cash-outline"
                label="Salary"
                value={jobDetails.salary_range}
              />
            )}
            {jobDetails.experience_range && (
              <InfoRow
                icon="time-outline"
                label="Experience"
                value={jobDetails.experience_range}
              />
            )}
            {jobDetails.positions_available && (
              <InfoRow
                icon="people-outline"
                label="Openings"
                value={`${jobDetails.positions_available} position${
                  jobDetails.positions_available > 1 ? "s" : ""
                }`}
              />
            )}
            {jobDetails.application_deadline && (
              <InfoRow
                icon="calendar-outline"
                label="Deadline"
                value={new Date(
                  jobDetails.application_deadline
                ).toLocaleDateString()}
              />
            )}

            {/* Description */}
            <SectionHeader
              icon="document-text-outline"
              title="Job Description"
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                lineHeight: theme.typography.sizes.base * 1.6,
                marginBottom: theme.spacing.md,
              }}
            >
              {jobDetails.job_description}
            </Text>

            {/* Requirements */}
            {jobDetails.job_requirements &&
              jobDetails.job_requirements.length > 0 && (
                <>
                  <SectionHeader
                    icon="checkmark-circle-outline"
                    title="Requirements"
                  />
                  <BulletList items={jobDetails.job_requirements} />
                </>
              )}

            {/* Responsibilities */}
            {jobDetails.job_responsibilities &&
              jobDetails.job_responsibilities.length > 0 && (
                <>
                  <SectionHeader icon="list-outline" title="Responsibilities" />
                  <BulletList items={jobDetails.job_responsibilities} />
                </>
              )}

            {/* Skills */}
            {jobDetails.skills && jobDetails.skills.length > 0 && (
              <>
                <SectionHeader
                  icon="code-slash-outline"
                  title="Required Skills"
                />
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: theme.spacing.xs,
                  }}
                >
                  {jobDetails.skills.map((skill, index) => {
                    const isMatching = jobDetails.matching_skills?.includes(
                      skill.skill_name
                    );
                    return (
                      <View
                        key={`skill_${index}`}
                        style={{
                          backgroundColor: isMatching
                            ? theme.colors.background.accent
                            : theme.colors.neutral.lightGray,
                          borderRadius: theme.borderRadius.md,
                          paddingHorizontal: theme.spacing.md,
                          paddingVertical: theme.spacing.sm,
                          borderWidth: 1,
                          borderColor: isMatching
                            ? theme.colors.primary.teal
                            : theme.colors.border.light,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.sm,
                            fontFamily: theme.typography.fonts.medium,
                            color: isMatching
                              ? theme.colors.primary.teal
                              : theme.colors.text.secondary,
                          }}
                        >
                          {skill.skill_name}
                          {isMatching && " ✓"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Benefits */}
            {jobDetails.benefits && jobDetails.benefits.length > 0 && (
              <>
                <SectionHeader icon="gift-outline" title="Benefits" />
                <BulletList items={jobDetails.benefits} />
              </>
            )}

            {/* Company Info */}
            {jobDetails.company && (
              <>
                <SectionHeader icon="business-outline" title="About Company" />
                {jobDetails.company.company_description && (
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      lineHeight: theme.typography.sizes.base * 1.6,
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    {jobDetails.company.company_description}
                  </Text>
                )}

                <View style={{ gap: theme.spacing.xs }}>
                  {jobDetails.company.industry && (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="apps-outline"
                        size={18}
                        color={theme.colors.text.tertiary}
                        style={{ width: 30 }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        Industry: {jobDetails.company.industry}
                      </Text>
                    </View>
                  )}

                  {jobDetails.company.company_size && (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="people-outline"
                        size={18}
                        color={theme.colors.text.tertiary}
                        style={{ width: 30 }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        Company Size: {jobDetails.company.company_size}
                      </Text>
                    </View>
                  )}

                  {jobDetails.company.location && (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={theme.colors.text.tertiary}
                        style={{ width: 30 }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {jobDetails.company.location}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <View
          style={{
            // position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.background.card,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.light,
            ...theme.shadows.lg,
          }}
        >
          {jobDetails.has_applied ? (
            <View
              style={{
                backgroundColor: theme.colors.status.info,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.colors.neutral.white}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.md,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                Already Applied •{" "}
                {jobDetails.application_status?.replace("_", " ")}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
              }}
              onPress={handleApplyPress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[
                  theme.colors.primary.teal,
                  theme.colors.secondary.darkTeal,
                ]}
                style={{
                  paddingVertical: theme.spacing.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.md,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                    marginRight: theme.spacing.xs,
                  }}
                >
                  Apply Now
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors.neutral.white}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Replace ApplicationModal with component */}
        <JobApplicationModal
          visible={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          coverLetter={coverLetter}
          setCoverLetter={setCoverLetter}
          expectedSalary={expectedSalary}
          setExpectedSalary={setExpectedSalary}
          availabilityDate={availabilityDate}
          setAvailabilityDate={setAvailabilityDate}
          submitting={submitting}
          onSubmit={handleSubmitApplication}
        />
      </View>
    </SafeAreaWrapper>
  );
}
