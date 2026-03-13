import CustomDropdown from "@/components/CustomDropdown";
import CustomInput from "@/components/CustomInput";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SafeAreaWrapper from "./SafeAreaWrapper";

/**
 * SendProposalModal Component
 *
 * A reusable modal for employers to send job proposals to candidates
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {object} candidate - Candidate data { user_id, name, skills, ... }
 * @param {function} onProposalSent - Callback after successful proposal send
 * @param {string} preSelectedJobId - Optional job ID to pre-select
 */
const SendProposalModal = ({
  visible,
  onClose,
  candidate,
  onProposalSent,
  preSelectedJobId = null,
}) => {
  const [selectedJobId, setSelectedJobId] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [errors, setErrors] = useState({});

  // Load employer's active jobs when modal opens
  useEffect(() => {
    if (visible) {
      loadActiveJobs();

      // Pre-select job if provided
      if (preSelectedJobId) {
        setSelectedJobId(preSelectedJobId);
      }

      // Generate default proposal message
      if (candidate) {
        generateDefaultProposalMessage();
      }
    } else {
      // Reset form when modal closes
      resetForm();
    }
  }, [visible, preSelectedJobId, candidate]);

  const loadActiveJobs = async () => {
    setIsLoadingJobs(true);
    setErrors({});

    try {
      const response = await apiService.getEmployerActiveJobs();

      if (response.success && response.data?.jobs) {
        setAvailableJobs(response.data.jobs);
      } else {
        setErrors({ jobs: response.message || "Failed to load jobs" });
      }
    } catch (error) {
      console.error("❌ Load jobs error:", error);
      setErrors({ jobs: "Failed to load available jobs" });
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const generateDefaultProposalMessage = () => {
    if (!candidate) return;

    const candidateName = candidate.name || candidate.first_name || "Candidate";
    const skills =
      candidate.skills
        ?.slice(0, 3)
        .map((s) => s.skill_name || s)
        .join(", ") || "your skills";

    const defaultMessage = `Dear ${candidateName},

We came across your profile and were impressed by your experience and skills, particularly in ${skills}.

We believe you would be a great fit for this role at our company. We would love to discuss this opportunity with you further.

Looking forward to hearing from you!

Best regards,
[Your Company Name]`;

    setProposalMessage(defaultMessage);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedJobId) {
      newErrors.job = "Please select a job position";
    }

    if (!proposalMessage.trim()) {
      newErrors.message = "Please write a proposal message";
    } else if (proposalMessage.trim().length < 50) {
      newErrors.message = "Proposal message should be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendProposal = async () => {
    if (!validateForm()) {
      return;
    }

    if (!candidate?.user_id && !candidate?.id) {
      Alert.alert("Error", "Invalid candidate data");
      return;
    }

    setIsSendingProposal(true);
    setErrors({});

    try {
      const jobseekerId = candidate.user_id || candidate.id;

      const response = await apiService.sendJobProposal({
        jobId: parseInt(selectedJobId),
        jobseekerId: parseInt(jobseekerId),
        proposalMessage: proposalMessage.trim(),
        applicationType: "manual",
        matchScore: candidate.matchPercentage || candidate.match_score || null,
      });

      if (response.success) {
        Alert.alert(
          "Proposal Sent!",
          `Your job proposal has been sent to ${
            candidate.name || "the candidate"
          }. You'll be notified when they respond.`,
          [
            {
              text: "OK",
              onPress: () => {
                if (onProposalSent) {
                  onProposalSent(response.data);
                }
                handleClose();
              },
            },
          ]
        );
      } else {
        const errorMessage =
          response.errors?.[0] || response.message || "Failed to send proposal";
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("❌ Send proposal error:", error);
      Alert.alert("Error", "Failed to send proposal. Please try again.");
    } finally {
      setIsSendingProposal(false);
    }
  };

  const resetForm = () => {
    setSelectedJobId("");
    setProposalMessage("");
    setErrors({});
  };

  const handleClose = () => {
    if (!isSendingProposal) {
      resetForm();
      onClose();
    }
  };

  const getJobOptions = () => {
    return availableJobs.map((job) => ({
      value: job.job_id.toString(),
      label: `${job.job_title} - ${job.location_city}`,
      subtitle: `${job.employment_type} • ${job.work_mode} • ${
        job.positions_available
      } position${job.positions_available > 1 ? "s" : ""}`,
    }));
  };

  const getSelectedJob = () => {
    return availableJobs.find((job) => job.job_id.toString() === selectedJobId);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaWrapper>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderTopLeftRadius: theme.borderRadius.xxl,
              borderTopRightRadius: theme.borderRadius.xxl,
              maxHeight: "90%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xl,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Send Job Proposal
                </Text>
                {candidate && (
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    To: {candidate.name || candidate.first_name}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleClose}
                disabled={isSendingProposal}
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: theme.colors.background.accent,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Candidate Info Card */}
              {candidate && (
                <View
                  style={{
                    backgroundColor: theme.colors.background.accent,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.primary.teal,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.primary.teal,
                        justifyContent: "center",
                        alignItems: "center",
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
                        {(candidate.name ||
                          candidate.first_name ||
                          "C")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.base,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {candidate.name ||
                          `${candidate.first_name} ${candidate.last_name}`}
                      </Text>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.regular,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {candidate.position ||
                          candidate.current_title ||
                          "Candidate"}
                      </Text>
                    </View>
                    {candidate.matchPercentage && (
                      <View
                        style={{
                          backgroundColor: theme.colors.status.success,
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
                          {candidate.matchPercentage}% Match
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Skills Preview */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        marginTop: theme.spacing.xs,
                      }}
                    >
                      {candidate.skills.slice(0, 4).map((skill, index) => {
                        const skillName =
                          typeof skill === "string" ? skill : skill.skill_name;
                        return (
                          <View
                            key={index}
                            style={{
                              backgroundColor: theme.colors.background.card,
                              borderRadius: theme.borderRadius.sm,
                              paddingHorizontal: theme.spacing.sm,
                              paddingVertical: theme.spacing.xs,
                              marginRight: theme.spacing.xs,
                              marginTop: theme.spacing.xs,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: theme.typography.sizes.xs,
                                fontFamily: theme.typography.fonts.medium,
                                color: theme.colors.primary.teal,
                              }}
                            >
                              {skillName}
                            </Text>
                          </View>
                        );
                      })}
                      {candidate.skills.length > 4 && (
                        <View
                          style={{
                            backgroundColor: theme.colors.background.card,
                            borderRadius: theme.borderRadius.sm,
                            paddingHorizontal: theme.spacing.sm,
                            paddingVertical: theme.spacing.xs,
                            marginTop: theme.spacing.xs,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: theme.typography.sizes.xs,
                              fontFamily: theme.typography.fonts.medium,
                              color: theme.colors.text.tertiary,
                            }}
                          >
                            +{candidate.skills.length - 4} more
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Job Selection */}
              {isLoadingJobs ? (
                <View
                  style={{ padding: theme.spacing.xl, alignItems: "center" }}
                >
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary.teal}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.secondary,
                      marginTop: theme.spacing.md,
                    }}
                  >
                    Loading available jobs...
                  </Text>
                </View>
              ) : errors.jobs ? (
                <View
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.status.error,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.error,
                    }}
                  >
                    {errors.jobs}
                  </Text>
                  <TouchableOpacity
                    onPress={loadActiveJobs}
                    style={{ marginTop: theme.spacing.sm }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.semiBold,
                        color: theme.colors.primary.teal,
                      }}
                    >
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CustomDropdown
                    label="Select Job Position"
                    value={selectedJobId}
                    onSelect={setSelectedJobId}
                    options={getJobOptions()}
                    placeholder="Choose a job to propose"
                    icon="briefcase-outline"
                    required
                    error={errors.job}
                    searchable
                    modalTitle="Select Job Position"
                  />

                  {/* Selected Job Preview */}
                  {selectedJobId && getSelectedJob() && (
                    <View
                      style={{
                        backgroundColor: theme.colors.background.accent,
                        borderRadius: theme.borderRadius.lg,
                        padding: theme.spacing.md,
                        marginBottom: theme.spacing.lg,
                        borderLeftWidth: 3,
                        borderLeftColor: theme.colors.primary.deepBlue,
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
                        {getSelectedJob().job_title}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginRight: theme.spacing.md,
                          }}
                        >
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={theme.colors.text.secondary}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              fontSize: theme.typography.sizes.sm,
                              fontFamily: theme.typography.fonts.regular,
                              color: theme.colors.text.secondary,
                            }}
                          >
                            {getSelectedJob().location_city}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginRight: theme.spacing.md,
                          }}
                        >
                          <Ionicons
                            name="briefcase-outline"
                            size={14}
                            color={theme.colors.text.secondary}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              fontSize: theme.typography.sizes.sm,
                              fontFamily: theme.typography.fonts.regular,
                              color: theme.colors.text.secondary,
                            }}
                          >
                            {getSelectedJob().employment_type}
                          </Text>
                        </View>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="laptop-outline"
                            size={14}
                            color={theme.colors.text.secondary}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              fontSize: theme.typography.sizes.sm,
                              fontFamily: theme.typography.fonts.regular,
                              color: theme.colors.text.secondary,
                            }}
                          >
                            {getSelectedJob().work_mode}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Proposal Message */}
                  <CustomInput
                    label="Proposal Message"
                    value={proposalMessage}
                    onChangeText={setProposalMessage}
                    placeholder="Write a personalized message to the candidate..."
                    multiline
                    numberOfLines={8}
                    maxLength={1000}
                    required
                    error={errors.message}
                    style={{ marginBottom: theme.spacing.lg }}
                  />

                  {/* Helper Text */}
                  <View
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.xl,
                      flexDirection: "row",
                      alignItems: "flex-start",
                    }}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={theme.colors.status.info}
                      style={{ marginRight: theme.spacing.sm, marginTop: 2 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: theme.typography.sizes.xs,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.secondary,
                        lineHeight: theme.typography.sizes.xs * 1.5,
                      }}
                    >
                      Tip: Personalize your message by mentioning specific
                      skills or experiences from the candidate's profile that
                      caught your attention.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            {!isLoadingJobs && !errors.jobs && (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.lg,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border.light,
                  flexDirection: "row",
                  gap: theme.spacing.md,
                }}
              >
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isSendingProposal}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.neutral.lightGray,
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.md,
                    alignItems: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendProposal}
                  disabled={
                    isSendingProposal ||
                    !selectedJobId ||
                    !proposalMessage.trim()
                  }
                  style={{
                    flex: 2,
                    borderRadius: theme.borderRadius.lg,
                    overflow: "hidden",
                    opacity:
                      isSendingProposal ||
                      !selectedJobId ||
                      !proposalMessage.trim()
                        ? 0.5
                        : 1,
                  }}
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
                    {isSendingProposal ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.neutral.white}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="paper-plane"
                          size={18}
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
                          Send Proposal
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaWrapper>
    </Modal>
  );
};

export default SendProposalModal;
