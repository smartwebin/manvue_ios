import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function JobProposalDetails() {
  const { id } = useLocalSearchParams(); // application_id
  const [proposalStatus, setProposalStatus] = useState("pending");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposalData, setProposalData] = useState(null);

  // Fetch proposal details on mount
  useEffect(() => {
    fetchProposalDetails();
  }, [id]);

  const fetchProposalDetails = async () => {
    try {
      setLoading(true);
      const result = await apiService.getApplicationDetails(parseInt(id));

      if (result.success) {
        setProposalData(result.data);
        setProposalStatus(result.data.proposalStatus || "pending");
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to load proposal details",
        );
        router.back();
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
      Alert.alert("Error", "Something went wrong");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const result = await apiService.respondToProposal(
        parseInt(id),
        "accept",
        "I am interested in this opportunity!",
      );

      if (result.success) {
        setProposalStatus("accepted");
        setShowAcceptModal(false);
        Alert.alert(
          "Success",
          result.message || "Proposal accepted successfully!",
        );
      } else {
        Alert.alert("Error", result.message || "Failed to accept proposal");
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const result = await apiService.respondToProposal(
        parseInt(id),
        "reject",
        "Thank you for your interest, but I am not interested at this time.",
      );

      if (result.success) {
        setProposalStatus("rejected");
        setShowRejectModal(false);
        Alert.alert("Success", result.message || "Proposal rejected");
      } else {
        Alert.alert("Error", result.message || "Failed to reject proposal");
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToMessages = () => {
    router.push("/jobseeker/messages");
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

  // Loading State
  if (loading || !proposalData) {
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
          Loading details...
        </Text>
      </View>
    );
  }

  // Accept Modal
  const AcceptModal = () => (
    <Modal
      visible={showAcceptModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAcceptModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{ alignItems: "center", marginBottom: theme.spacing.lg }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.colors.status.success + "15",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={theme.colors.status.success}
              />
            </View>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
                textAlign: "center",
              }}
            >
              Accept this Proposal?
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: "center",
              }}
            >
              By accepting, you're showing interest in this position. The
              employer will be able to contact you directly.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowAcceptModal(false)}
              disabled={isProcessing}
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
              onPress={handleAccept}
              disabled={isProcessing}
              style={{
                flex: 1,
                backgroundColor: theme.colors.status.success,
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
                  color: theme.colors.neutral.white,
                }}
              >
                {isProcessing ? "Accepting..." : "Yes, Accept"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Reject Modal
  const RejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{ alignItems: "center", marginBottom: theme.spacing.lg }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.colors.status.error + "15",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons
                name="close-circle"
                size={32}
                color={theme.colors.status.error}
              />
            </View>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
                textAlign: "center",
              }}
            >
              Decline this Proposal?
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: "center",
              }}
            >
              The employer will be notified that you're not interested in this
              position.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowRejectModal(false)}
              disabled={isProcessing}
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
              onPress={handleReject}
              disabled={isProcessing}
              style={{
                flex: 1,
                backgroundColor: theme.colors.status.error,
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
                  color: theme.colors.neutral.white,
                }}
              >
                {isProcessing ? "Rejecting..." : "Reject"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.card}
      />

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
            Job Proposal Details
          </Text>
          {proposalData && (
            <View
              style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.full,
                backgroundColor:
                  proposalStatus === "accepted"
                    ? theme.colors.status.success
                    : proposalStatus === "rejected"
                      ? theme.colors.status.error
                      : theme.colors.primary.orange,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.neutral.white,
                  textTransform: "capitalize",
                }}
              >
                {proposalData.applicationStatus?.replace(/_/g, " ")}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: proposalStatus === "pending" ? 100 : 20,
        }}
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
            {proposalData.companyInfo?.logo ? (
              <Image
                source={{ uri: proposalData.companyInfo.logo }}
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
                  {proposalData.companyName?.charAt(0)?.toUpperCase()}
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
                {proposalData.position}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.primary.teal,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {proposalData.companyName}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Received {proposalData.sentTime}
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
                proposalData.matchPercentage >= 80
                  ? [theme.colors.status.success, "#0D9488"]
                  : proposalData.matchPercentage >= 60
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
                {proposalData.matchPercentage}% Match
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
            {proposalData.location && (
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
                  {proposalData.location}
                </Text>
              </View>
            )}

            {proposalData.employmentType && (
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
                  {proposalData.employmentType.replace("_", " ")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Message */}
        {proposalStatus === "accepted" && (
          <View
            style={{
              backgroundColor: theme.colors.status.success + "15",
              borderWidth: 1,
              borderColor: theme.colors.status.success,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.lg,
              flexDirection: "row",
              alignItems: "center",
            }}
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
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.status.success,
                  marginBottom: 4,
                }}
              >
                Proposal Accepted!
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                }}
              >
                The employer has been notified. They will contact you soon.
              </Text>
              <TouchableOpacity
                onPress={handleGoToMessages}
                style={{ marginTop: theme.spacing.sm }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.primary.teal,
                  }}
                >
                  Go to Messages →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {proposalStatus === "rejected" && (
          <View
            style={{
              backgroundColor: theme.colors.status.error + "15",
              borderWidth: 1,
              borderColor: theme.colors.status.error,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.lg,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="close-circle"
              size={24}
              color={theme.colors.status.error}
              style={{ marginRight: theme.spacing.md }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.status.error,
                  marginBottom: 4,
                }}
              >
                Proposal Declined
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                }}
              >
                You have declined this job proposal.
              </Text>
            </View>
          </View>
        )}

        {/* Proposal Letter */}
        {proposalData.proposalMessage && (
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.lg,
            }}
          >
            <SectionHeader icon="mail-outline" title="Message to You" />
            <View
              style={{
                backgroundColor: theme.colors.background.card,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border.light,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  fontStyle: "italic",
                  lineHeight: theme.typography.sizes.base * 1.5,
                }}
              >
                "{proposalData.proposalMessage}"
              </Text>
            </View>
          </View>
        )}

        {/* Job Information */}
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
          }}
        >
          {/* Salary & Experience */}
          {proposalData.salary && (
            <InfoRow
              icon="cash-outline"
              label="Salary"
              value={proposalData.salary}
            />
          )}
          {proposalData.experience && (
            <InfoRow
              icon="time-outline"
              label="Experience"
              value={proposalData.experience}
            />
          )}

          {/* Description */}
          {proposalData.description && (
            <>
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
                {proposalData.description}
              </Text>
            </>
          )}

          {/* Requirements - Assuming simple text or list */}
          {proposalData.requirements &&
            proposalData.requirements.length > 0 && (
              <>
                <SectionHeader
                  icon="checkmark-circle-outline"
                  title="Requirements"
                />
                <BulletList items={proposalData.requirements} />
              </>
            )}

          {/* Responsibilities */}
          {proposalData.responsibilities &&
            proposalData.responsibilities.length > 0 && (
              <>
                <SectionHeader icon="list-outline" title="Responsibilities" />
                <BulletList items={proposalData.responsibilities} />
              </>
            )}

          {/* Benefits */}
          {proposalData.benefits && proposalData.benefits.length > 0 && (
            <>
              <SectionHeader icon="gift-outline" title="Benefits" />
              <BulletList items={proposalData.benefits} />
            </>
          )}

          {/* Skills */}
          {proposalData.skills && proposalData.skills.length > 0 && (
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
                {proposalData.skills.map((skill, index) => {
                  return (
                    <View
                      key={`skill_${index}`}
                      style={{
                        backgroundColor: theme.colors.background.accent,
                        borderRadius: theme.borderRadius.md,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.primary.teal,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.medium,
                          color: theme.colors.primary.teal,
                        }}
                      >
                        {skill}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Company Info */}
          {proposalData.companyInfo && (
            <>
              <SectionHeader icon="business-outline" title="About Company" />
              {proposalData.companyInfo.about && (
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    lineHeight: theme.typography.sizes.base * 1.6,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {proposalData.companyInfo.about}
                </Text>
              )}
              <View style={{ gap: theme.spacing.xs }}>
                {proposalData.companyInfo.industry && (
                  <InfoRow
                    icon="briefcase-outline"
                    label="Industry"
                    value={proposalData.companyInfo.industry}
                  />
                )}
                {proposalData.companyInfo.size && (
                  <InfoRow
                    icon="people-outline"
                    label="Size"
                    value={proposalData.companyInfo.size}
                  />
                )}
                {proposalData.companyInfo.founded && (
                  <InfoRow
                    icon="flag-outline"
                    label="Founded"
                    value={proposalData.companyInfo.founded}
                  />
                )}
                {proposalData.companyInfo.website && (
                  <InfoRow
                    icon="globe-outline"
                    label="Website"
                    value={proposalData.companyInfo.website}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons - Only show if pending */}
      {proposalStatus === "pending" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.background.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.light,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowRejectModal(true)}
              style={{
                flex: 1,
                backgroundColor: theme.colors.status.error,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close-outline"
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
                Reject
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAcceptModal(true)}
              style={{
                flex: 1,
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[theme.colors.status.success, "#0D9488"]}
                style={{
                  paddingVertical: theme.spacing.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="checkmark-outline"
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
                  Accept
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AcceptModal />
      <RejectModal />
    </View>
  );
}
