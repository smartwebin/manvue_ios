import CustomDatePicker from "@/components/CustomDatePicker";
import CustomDropdown from "@/components/CustomDropdown";
import CustomDropdown3 from "@/components/CustomDropdown3";
import CustomInput from "@/components/CustomInput";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import SkillsInputAI from "@/components/SkillsInputAI";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function EditJobPost() {
  const { id } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    locationCity: "",
    locationState: "",
    employmentType: "",
    workMode: "",
    experienceMin: "0",
    experienceMax: "",
    salaryMin: "",
    salaryMax: "",
    salaryType: "annual",
    jobDescription: "",
    jobResponsibilities: "",
    jobRequirements: "",
    benefits: "",
    educationRequirement: "",
    positionsAvailable: "1",
    priorityLevel: "medium",
    applicationDeadline: "",
    jobCategory: "",
    jobStatus: "active",
    job_opening: "",
  });

  const [skills, setSkills] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [jobId, setJobId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  // State and City dropdowns
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);

  // Dropdown options matching database schema
  const employmentTypeOptions = [
    { label: "Full-Time", value: "full_time" },
    { label: "Part-Time", value: "part_time" },
    { label: "Contract", value: "contract" },
    { label: "Freelance", value: "freelance" },
    { label: "Internship", value: "internship" },
  ];
  const jobOpeningTypeOptions = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
  ];

  const workModeOptions = [
    { label: "Remote", value: "remote" },
    { label: "Hybrid", value: "hybrid" },
    { label: "On-Site", value: "on_site" },
  ];

  const salaryTypeOptions = [
    { label: "Annual", value: "annual" },
    { label: "Monthly", value: "monthly" },
    { label: "Hourly", value: "hourly" },
    { label: "Per Project", value: "per_project" },
  ];

  const priorityLevelOptions = [
    { label: "Low Priority", value: "low" },
    { label: "Medium Priority", value: "medium" },
    { label: "High Priority", value: "high" },
    { label: "Urgent", value: "urgent" },
  ];

  const jobCategoryOptions = [
    { label: "Software Development", value: "Software Development" },
    { label: "Product Management", value: "Product Management" },
    { label: "Design", value: "Design" },
    { label: "Marketing", value: "Marketing" },
    { label: "Sales", value: "Sales" },
    { label: "Human Resources", value: "Human Resources" },
    { label: "Finance", value: "Finance" },
    { label: "Operations", value: "Operations" },
    { label: "Customer Support", value: "Customer Support" },
    { label: "Data Science", value: "Data Science" },
    { label: "Other", value: "Other" },
  ];

  const jobStatusOptions = [
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Paused", value: "paused" },
    { label: "Closed", value: "closed" },
  ];

  // Load states and cities on mount
  useEffect(() => {
    loadStates();
    loadUserData();
  }, []);

  // Load job data when userId is available
  useEffect(() => {
    if (userId && id && states) {
      loadJobData();
    }
  }, [userId, id, states]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedStateId) {
      loadCities(selectedStateId);
    } else {
      setCities([]);
    }
  }, [selectedStateId]);

  // Load states from API
  const loadStates = async () => {
    try {
      const response = await apiService.getStates();
      if (response.success && response.data) {
        setStates(response.data);
        console.log("✅ States loaded:", response.data.length);
      } else {
        console.log("❌ Failed to load states:", response.message);
        setStates([]);
      }
    } catch (error) {
      console.log("❌ Error loading states:", error);
      setStates([]);
    }
  };

  // Load cities based on selected state
  const loadCities = async (stateId) => {
    try {
      setLoadingCities(true);
      const response = await apiService.getCitiesByState(stateId);

      if (response.success && response.data) {
        setCities(response.data);
        console.log(
          "✅ Cities loaded for state:",
          stateId,
          "Count:",
          response.data.length
        );
      } else {
        console.log("❌ Failed to load cities:", response.message);
        setCities([]);
      }
    } catch (error) {
      console.log("❌ Error loading cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // Handle state selection
  const handleStateSelect = (state_id) => {
    setSelectedStateId(state_id);

    // Find the state name for the selected state_id
    const selectedState = states.find((s) => s.state_id === state_id);
    if (selectedState) {
      updateFormData("locationState", selectedState.label);
      console.log("📍 State selected:", selectedState.label);
    }

    // Clear city when state changes
    updateFormData("locationCity", "");
  };

  const loadUserData = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync("user_id");
      const storedCompanyId = await SecureStore.getItemAsync("company_id");

      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      }

      if (storedCompanyId) {
        setCompanyId(parseInt(storedCompanyId));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUpdateError("Error loading user information.");
    }
  };

  const loadJobData = async () => {
    if (!id) {
      Alert.alert("Error", "Job ID not found");
      router.back();
      return;
    }

    if (!userId) {
      console.log("⚠️ UserId not yet available, waiting...");
      return;
    }

    setIsLoading(true);
    try {
      console.log("📋 Loading job:", id, "for user:", userId);

      const response = await apiService.getJobById({
        jobId: parseInt(id),
        userId: parseInt(userId),
      });

      if (response.success && response.data) {
        const jobData = response.data;

        setJobId(jobData.job_id);
        setFormData({
          jobTitle: jobData.job_title || "",
          department: jobData.department || "",
          locationCity: jobData.location_city || "",
          locationState: jobData.location_state || "",
          employmentType: jobData.employment_type || "",
          workMode: jobData.work_mode || "",
          experienceMin: jobData.experience_min?.toString() || "0",
          experienceMax: jobData.experience_max?.toString() || "",
          salaryMin: jobData.salary_min?.toString() || "",
          salaryMax: jobData.salary_max?.toString() || "",
          salaryType: jobData.salary_type || "annual",
          jobDescription: jobData.job_description || "",
          jobResponsibilities: jobData.job_responsibilities || "",
          jobRequirements: jobData.job_requirements || "",
          benefits: jobData.benefits || "",
          educationRequirement: jobData.education_requirement || "",
          positionsAvailable: jobData.positions_available?.toString() || "1",
          priorityLevel: jobData.priority_level || "medium",
          applicationDeadline: jobData.application_deadline || "",
          jobCategory: jobData.job_category || "",
          jobStatus: jobData.job_status || "active",
          job_opening: jobData.job_opening || "",
        });
        console.log("✅ Job data loaded:", jobData.location_state);
        // Set selected state ID to load cities
        if (jobData.location_state) {
          const matchedState = states.find((s) => {
            console.log(s.label);
            return s.label == jobData.location_state;
          });
          console.log("matchedState", matchedState?.state_id);

          if (matchedState) {
            setSelectedStateId(matchedState.state_id);
          }
        }

        // Map skills
        if (jobData.skills && Array.isArray(jobData.skills)) {
          const mappedSkills = jobData.skills.map((skill) => ({
            skill_id: skill.skill_id,
            skill_name: skill.skill_name,
            label: skill.skill_name,
            value: skill.skill_id,
            proficiency_level: skill.proficiency_required || "intermediate",
          }));
          setSkills(mappedSkills);
        }

        setIsLoading(false);
      } else {
        console.error("❌ Failed to load job:", response.message);
        setUpdateError(response.message || "Failed to load job data");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Error loading job:", error);
      setUpdateError("Failed to load job data. Please try again.");
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (updateError) {
      setUpdateError("");
    }
  };

  const handleSkillsChange = (newSkills) => {
    console.log("Skills changed:", newSkills);
    setSkills(newSkills);
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.locationCity.trim())
      newErrors.locationCity = "City is required";
    if (!formData.locationState.trim())
      newErrors.locationState = "State is required";
    if (!formData.job_opening)
      newErrors.job_opening = "Opening Type is required";
    if (!formData.employmentType)
      newErrors.employmentType = "Employment type is required";
    if (!formData.workMode) newErrors.workMode = "Work mode is required";
    if (!formData.jobDescription.trim())
      newErrors.jobDescription = "Job description is required";
    if (!formData.jobResponsibilities.trim())
      newErrors.jobResponsibilities = "Responsibilities are required";
    if (!formData.jobRequirements.trim())
      newErrors.jobRequirements = "Requirements are required";
    if (!formData.department.trim())
      newErrors.department = "Department is required";
    if (!formData.jobCategory)
      newErrors.jobCategory = "Job category is required";

    if (skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }
    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = "Application deadline is required";
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (formData.applicationDeadline < today) {
        newErrors.applicationDeadline = "Deadline cannot be in the past";
      }
    }

    if (formData.salaryMin && formData.salaryMax) {
      const minSalary = parseFloat(formData.salaryMin);
      const maxSalary = parseFloat(formData.salaryMax);
      if (minSalary >= maxSalary) {
        newErrors.salaryMax = "Maximum salary should be higher than minimum";
      }
    }

    if (formData.experienceMin && formData.experienceMax) {
      const minExp = parseInt(formData.experienceMin);
      const maxExp = parseInt(formData.experienceMax);
      if (minExp > maxExp) {
        newErrors.experienceMax =
          "Maximum experience should be higher than minimum";
      }
    }

    if (
      formData.positionsAvailable &&
      parseInt(formData.positionsAvailable) < 1
    ) {
      newErrors.positionsAvailable = "At least 1 position is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      console.log("❌ Form validation failed");
      setUpdateError("Please fix the validation errors above");
      return;
    }

    if (!userId || !companyId || !jobId) {
      setUpdateError("User, Company, or Job ID not found. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setUpdateError("");

    try {
      const processedSkills = skills
        .map((skill) => {
          const skillName =
            typeof skill === "string"
              ? skill
              : skill.skill_name || skill.label || skill.value || "";

          return {
            skill_name: skillName.trim(),
            proficiency_required:
              skill.proficiency_level ||
              skill.proficiency_required ||
              "intermediate",
            priority: skill.priority || "must_have",
            is_required: 1,
          };
        })
        .filter((skill) => skill.skill_name);

      console.log("📤 Processed skills to send:", processedSkills);

      const jobData = {
        jobId: parseInt(jobId),
        userId: parseInt(userId),
        companyId: parseInt(companyId),
        jobTitle: formData.jobTitle,
        department: formData.department,
        locationCity: formData.locationCity,
        locationState: formData.locationState,
        employmentType: formData.employmentType,
        workMode: formData.workMode,
        experienceMin: parseInt(formData.experienceMin) || 0,
        experienceMax: formData.experienceMax
          ? parseInt(formData.experienceMax)
          : null,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        salaryType: formData.salaryType,
        jobDescription: formData.jobDescription,
        jobResponsibilities: formData.jobResponsibilities,
        jobRequirements: formData.jobRequirements,
        benefits: formData.benefits,
        educationRequirement: formData.educationRequirement,
        positionsAvailable: parseInt(formData.positionsAvailable) || 1,
        priorityLevel: formData.priorityLevel,
        applicationDeadline: formData.applicationDeadline || null,
        jobCategory: formData.jobCategory,
        jobStatus: formData.jobStatus,
        skills: processedSkills,
        job_opening: formData.job_opening,
      };

      console.log("📤 Updating job with data:", jobData);

      const response = await apiService.updateJob(jobData);

      console.log("📦 Update response:", response);

      if (response.success) {
        console.log("✅ Job updated successfully!");

        if (response.data?.new_skills_created > 0) {
          console.log(
            `🆕 ${response.data.new_skills_created} new skill(s) created in database`
          );
        }

        setShowSuccessModal(true);
      } else {
        const errorMessage =
          response.errors && response.errors.length > 0
            ? response.errors.join("\n")
            : response.message || "Failed to update job";
        setUpdateError(errorMessage);
      }
    } catch (error) {
      console.error("❌ Update job exception:", error);
      setUpdateError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !companyId || !jobId) {
      Alert.alert("Error", "Missing required information");
      return;
    }

    try {
      console.log("🗑️ Deleting job:", jobId);

      const response = await apiService.deleteJob({
        jobId: parseInt(jobId),
        userId: parseInt(userId),
        companyId: parseInt(companyId),
      });

      if (response.success) {
        Alert.alert(
          "Job Deleted",
          response.message || "The job posting has been deleted successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowDeleteModal(false);
                router.replace("/employer/jobs");
              },
            },
          ]
        );
      } else {
        const errorMessage =
          response.errors && response.errors.length > 0
            ? response.errors.join("\n")
            : response.message || "Failed to delete job";
        Alert.alert("Error", errorMessage);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("❌ Error deleting job:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setShowDeleteModal(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  // Header Component
  const Header = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.background.accent,
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={theme.colors.primary.teal}
        />
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: "center" }}>
        <Text
          style={{
            fontSize: theme.typography.sizes.md,
            fontFamily: theme.typography.fonts.semiBold,
            color: theme.colors.text.primary,
          }}
        >
          Edit Job Posting
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            color: theme.colors.text.tertiary,
            marginTop: 2,
          }}
        >
          ID: {jobId}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowDeleteModal(true)}
        disabled={isSubmitting}
        style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          opacity: isSubmitting ? 0.5 : 1,
        }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.status.error,
          }}
        >
          Delete
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Success Modal
  const SuccessModal = () => (
    <Modal visible={showSuccessModal} transparent={true} animationType="fade">
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
            width: "100%",
            maxWidth: 400,
            padding: theme.spacing.xl,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.status.success,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <Ionicons
              name="checkmark"
              size={40}
              color={theme.colors.neutral.white}
            />
          </View>

          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              textAlign: "center",
            }}
          >
            Job Updated Successfully!
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: theme.spacing.xl,
              lineHeight: theme.typography.sizes.base * 1.5,
            }}
          >
            Your job posting has been updated with the latest changes.
          </Text>

          <TouchableOpacity
            onPress={handleSuccessClose}
            style={{
              width: "100%",
              borderRadius: theme.borderRadius.lg,
              overflow: "hidden",
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
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.neutral.white,
                }}
              >
                Close
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Delete Confirmation Modal
  const DeleteModal = () => (
    <Modal visible={showDeleteModal} transparent={true} animationType="fade">
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
            width: "100%",
            maxWidth: 400,
            padding: theme.spacing.xl,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <Ionicons
              name="warning"
              size={40}
              color={theme.colors.status.error}
            />
          </View>

          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              textAlign: "center",
            }}
          >
            Delete Job Posting?
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: theme.spacing.xl,
              lineHeight: theme.typography.sizes.base * 1.5,
            }}
          >
            This action cannot be undone. All applications and data related to
            this job will be permanently deleted.
          </Text>

          <View
            style={{
              width: "100%",
              flexDirection: "row",
              gap: theme.spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowDeleteModal(false)}
              style={{
                flex: 1,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: theme.colors.background.accent,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.colors.border.light,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={{
                flex: 1,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: theme.colors.status.error,
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
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaWrapper backgroundColor={theme.colors.background.primary}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary.teal} />
          <Text
            style={{
              marginTop: theme.spacing.md,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            Loading job details...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper
      backgroundColor={theme.colors.background.primary}
      edges={["left", "right", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.card}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          theme.colors.background.accent,
          "rgba(27, 163, 163, 0.02)",
          theme.colors.background.primary,
        ]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        locations={[0, 0.2, 1]}
      />

      <Header />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Job Status Section */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              Job Status
            </Text>

            <CustomDropdown
              label="Status"
              value={formData.jobStatus}
              onSelect={(value) => updateFormData("jobStatus", value)}
              options={jobStatusOptions}
              placeholder="Select job status"
              icon="flag-outline"
              required
            />
          </View>

          {/* Basic Information Section */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              Basic Information
            </Text>

            <CustomInput
              label="Job Title"
              value={formData.jobTitle}
              onChangeText={(value) => updateFormData("jobTitle", value)}
              placeholder="eg: Senior React Developer"
              icon="briefcase-outline"
              error={errors.jobTitle}
              required
            />

            <CustomInput
              label="Department"
              value={formData.department}
              onChangeText={(value) => updateFormData("department", value)}
              placeholder="eg: Engineering, Marketing, Sales"
              icon="business-outline"
              required
              error={errors.department}
            />

            <CustomDropdown
              label="Job Category"
              value={formData.jobCategory}
              onSelect={(value) => updateFormData("jobCategory", value)}
              options={jobCategoryOptions}
              placeholder="Select job category"
              icon="grid-outline"
              required
              error={errors.jobCategory}
            />

            {/* State Dropdown */}
            <CustomDropdown3
              label="State"
              value={selectedStateId}
              onSelect={handleStateSelect}
              options={states}
              placeholder="Select state"
              icon="location-outline"
              error={errors.locationState}
              required
            />

            {/* City Dropdown */}
            <CustomInput
              label="City"
              value={formData.locationCity}
              onChangeText={(value) => updateFormData("locationCity", value)}
              placeholder="Enter city"
              icon="location-outline"
              error={errors.locationCity}
              required
            />

            <CustomDropdown
              label="Employment Type"
              value={formData.employmentType}
              onSelect={(value) => updateFormData("employmentType", value)}
              options={employmentTypeOptions}
              placeholder="Select employment type"
              icon="time-outline"
              error={errors.employmentType}
              required
            />

            <CustomDropdown
              label="Work Mode"
              value={formData.workMode}
              onSelect={(value) => updateFormData("workMode", value)}
              options={workModeOptions}
              placeholder="Select work mode"
              icon="home-outline"
              error={errors.workMode}
              required
            />

            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Min Experience (Years)"
                  value={formData.experienceMin}
                  onChangeText={(value) =>
                    updateFormData("experienceMin", value)
                  }
                  placeholder="0"
                  icon="school-outline"
                  keyboardType="number-pad"
                  error={errors.experienceMin}
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Max Experience (Years)"
                  value={formData.experienceMax}
                  onChangeText={(value) =>
                    updateFormData("experienceMax", value)
                  }
                  placeholder="eg: 5"
                  icon="school-outline"
                  keyboardType="number-pad"
                  error={errors.experienceMax}
                />
              </View>
            </View>

            <CustomInput
              label="Number of Positions"
              value={formData.positionsAvailable}
              onChangeText={(value) =>
                updateFormData("positionsAvailable", value)
              }
              placeholder="1"
              icon="people-outline"
              keyboardType="number-pad"
              error={errors.positionsAvailable}
            />
            <CustomDropdown
              label="Opening Type"
              value={formData.job_opening}
              onSelect={(value) => updateFormData("job_opening", value)}
              options={jobOpeningTypeOptions}
              required
              placeholder="Select job category"
              icon="grid-outline"
              error={errors.job_opening}
            />
          </View>

          {/* Compensation Section */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              Compensation
            </Text>

            <CustomDropdown
              label="Salary Type"
              value={formData.salaryType}
              onSelect={(value) => updateFormData("salaryType", value)}
              options={salaryTypeOptions}
              placeholder="Select salary type"
              icon="cash-outline"
              error={errors.salaryType}
            />

            <View style={{ flex: 1 }}>
              <CustomInput
                label="Minimum Salary (₹)"
                value={formData.salaryMin}
                onChangeText={(value) => updateFormData("salaryMin", value)}
                placeholder="eg: 800000"
                icon="cash-outline"
                keyboardType="numeric"
                error={errors.salaryMin}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="Maximum Salary (₹)"
                value={formData.salaryMax}
                onChangeText={(value) => updateFormData("salaryMax", value)}
                placeholder="eg: 1500000"
                icon="cash-outline"
                keyboardType="numeric"
                error={errors.salaryMax}
              />
            </View>
          </View>

          {/* Job Details Section */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              Job Details
            </Text>

            <CustomInput
              label="Job Description"
              value={formData.jobDescription}
              onChangeText={(value) => updateFormData("jobDescription", value)}
              placeholder="Describe the role, company culture, and what makes this position exciting..."
              icon="document-text-outline"
              error={errors.jobDescription}
              multiline
              numberOfLines={5}
              required
            />

            <CustomInput
              label="Key Responsibilities"
              value={formData.jobResponsibilities}
              onChangeText={(value) =>
                updateFormData("jobResponsibilities", value)
              }
              placeholder="• Lead development of React applications&#10;• Mentor junior developers&#10;• Collaborate with design team..."
              icon="list-outline"
              error={errors.jobResponsibilities}
              multiline
              numberOfLines={5}
              required
            />

            <CustomInput
              label="Requirements"
              value={formData.jobRequirements}
              onChangeText={(value) => updateFormData("jobRequirements", value)}
              placeholder="• 3+ years React experience&#10;• Strong JavaScript knowledge&#10;• Experience with REST APIs..."
              icon="checkmark-done-outline"
              error={errors.jobRequirements}
              multiline
              numberOfLines={5}
              required
            />

            <CustomInput
              label="Education Requirement"
              value={formData.educationRequirement}
              onChangeText={(value) =>
                updateFormData("educationRequirement", value)
              }
              placeholder="eg: Bachelor's in Computer Science or equivalent"
              icon="school-outline"
              error={errors.educationRequirement}
            />

            <CustomInput
              label="Benefits & Perks"
              value={formData.benefits}
              onChangeText={(value) => updateFormData("benefits", value)}
              placeholder="• Health insurance&#10;• Flexible working hours&#10;• Professional development budget..."
              icon="gift-outline"
              error={errors.benefits}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Skills & Priority Section */}
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.md,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.lg,
              }}
            >
              Skills & Priority
            </Text>

            <SkillsInputAI
              skills={skills}
              onSkillsChange={handleSkillsChange}
              label="Required Skills"
              required={true}
              error={errors.skills}
              contextType="employer"
            />

            <CustomDropdown
              label="Priority Level"
              value={formData.priorityLevel}
              onSelect={(value) => updateFormData("priorityLevel", value)}
              options={priorityLevelOptions}
              placeholder="Select priority level"
              icon="flag-outline"
              error={errors.priorityLevel}
            />

            <CustomDatePicker
              label="Application Deadline"
              value={formData.applicationDeadline}
              onChange={(date) => updateFormData("applicationDeadline", date)}
              placeholder="YYYY-MM-DD (eg: 2025-12-31)"
              icon="calendar-outline"
              required
              error={errors.applicationDeadline}
            />
          </View>

          {/* Update Error Message */}
          {updateError ? (
            <View
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.status.error,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: theme.spacing.xs,
                }}
              >
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={theme.colors.status.error}
                  style={{ marginRight: theme.spacing.sm, marginTop: 2 }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.status.error,
                  }}
                >
                  Error
                </Text>
              </View>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.status.error,
                  lineHeight: theme.typography.sizes.sm * 1.5,
                }}
              >
                {updateError}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Fixed Bottom Buttons */}
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
              onPress={() => router.back()}
              disabled={isSubmitting}
              style={{
                flex: 1,
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.colors.border.medium,
                opacity: isSubmitting ? 0.5 : 1,
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
              onPress={handleUpdate}
              disabled={isSubmitting}
              style={{
                flex: 2,
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  isSubmitting
                    ? [
                        theme.colors.neutral.mediumGray,
                        theme.colors.neutral.mediumGray,
                      ]
                    : [
                        theme.colors.primary.teal,
                        theme.colors.secondary.darkTeal,
                      ]
                }
                style={{
                  paddingVertical: theme.spacing.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                {isSubmitting && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.neutral.white}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                )}
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {isSubmitting ? "Updating..." : "Update Job"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal />

      {/* Delete Confirmation Modal */}
      <DeleteModal />
    </SafeAreaWrapper>
  );
}
