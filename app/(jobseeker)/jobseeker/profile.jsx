import CustomArrayInput2 from "@/components/CustomArrayInput2";
import CustomDatePicker from "@/components/CustomDatePicker";
import CustomDropdown from "@/components/CustomDropdown";
import CustomDropdown3 from "@/components/CustomDropdown3";
import CustomInput from "@/components/CustomInput";
import EditModal from "@/components/EditModal";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import SkillsInputAI from "@/components/SkillsInputAI";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
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

export default function Profile() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [skillsList, setSkillsList] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [educationList, setEducationList] = useState([]);
  const [workList, setWorkList] = useState([]);
  const [savingEducation, setSavingEducation] = useState(false);
  const [savingWork, setSavingWork] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Fields that require admin approval for changes
  const criticalFields = [
    "full_name",
    "first_name",
    "last_name",
    "email",
    "mobile_number",
    "education",
    "current_position",
    "area_of_interest",
  ];
  // Add these dropdown options after your state declarations
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "prefer_not_to_say" },
  ];

  const noticePeriodOptions = [
    { label: "Immediate", value: "immediate" },
    { label: "15 Days", value: "15_days" },
    { label: "1 Month", value: "1_month" },
    { label: "2 Months", value: "2_months" },
    { label: "3 Months", value: "3_months" },
    { label: "More than 3 Months", value: "more_than_3_months" },
  ];

  const availabilityOptions = [
    { label: "Open to work", value: "open_to_work" },
    { label: "Not looking", value: "not_looking" },
    { label: "Passively looking", value: "passively_looking" },
  ];

  const workModeOptions = [
    { label: "Remote", value: "remote" },
    { label: "Hybrid", value: "hybrid" },
    { label: "On-site", value: "on_site" },
  ];

  const jobTypeOptions = [
    { label: "Full-Time", value: "full_time" },
    { label: "Part-Time", value: "part_time" },
    { label: "Contract", value: "contract" },
    { label: "Freelance", value: "freelance" },
    { label: "Internship", value: "internship" },
  ];
  // Add these handler functions
  const handleGenderChange = async (value) => {
    await updateProfileField("gender", value);
  };

  const handleNoticePeriodChange = async (value) => {
    await updateProfileField("notice_period", value);
  };

  const handleAvailabilityChange = async (value) => {
    await updateProfileField("availability_status", value);
  };
  // Image picker function
  const pickProfileImage = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access photos is required to upload your profile picture."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Upload image function
  const uploadProfileImage = async (imageAsset) => {
    try {
      setUploadingImage(true);

      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }

      const response = await apiService.updateUserImage(userId, imageAsset);

      if (response.success) {
        // Update local state
        setUserProfile((prev) => ({
          ...prev,
          profile_image: response.data?.image || imageAsset.uri,
        }));

        Alert.alert("Success", "Profile picture updated successfully");

        // Reload profile
        await loadProfileData();
      } else {
        Alert.alert("Error", response.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload profile picture");
    } finally {
      setUploadingImage(false);
    }
  };

  // Calculate dynamic profile completion
  const calculateProfileCompletion = () => {
    if (!userProfile) return 0;

    const fields = {
      // Basic Information (25%)
      full_name: 5,
      email: 5,
      mobile_number: 5,
      full_address: 5,
      current_position: 5,

      // Education (15%)
      education_list: 15,

      // Work Experience (20%)
      work_experience_list: 20,

      // Skills (25%)
      skills: 25,

      // Additional Information (15%)
      location: 5,
      industry_nature: 5,
      work_type: 5,
    };

    let totalScore = 0;
    const maxScore = Object.values(fields).reduce(
      (sum, weight) => sum + weight,
      0
    );

    Object.entries(fields).forEach(([field, weight]) => {
      const value = userProfile[field];

      if (field === "skills") {
        // Skills: Progressive scoring based on count
        if (Array.isArray(value)) {
          if (value.length >= 10) {
            // 10+ skills = full weight
            totalScore += weight;
          } else if (value.length >= 5) {
            // 5-9 skills = 80% weight
            totalScore += weight * 0.8;
          } else if (value.length >= 3) {
            // 3-4 skills = 60% weight
            totalScore += weight * 0.6;
          } else if (value.length > 0) {
            // 1-2 skills = 40% weight
            totalScore += weight * 0.4;
          }
        }
      } else if (field === "education_list") {
        // Education: Progressive scoring
        if (Array.isArray(value)) {
          if (value.length >= 2) {
            // 2+ education entries = full weight
            totalScore += weight;
          } else if (value.length === 1) {
            // 1 education entry = 75% weight
            totalScore += weight * 0.75;
          }
        }
      } else if (field === "work_experience_list") {
        // Work Experience: Progressive scoring
        if (Array.isArray(value)) {
          if (value.length >= 3) {
            // 3+ work entries = full weight
            totalScore += weight;
          } else if (value.length === 2) {
            // 2 work entries = 80% weight
            totalScore += weight * 0.8;
          } else if (value.length === 1) {
            // 1 work entry = 60% weight
            totalScore += weight * 0.6;
          }
        }
      } else {
        // Other fields: Full weight if not empty
        if (
          value &&
          value.toString().trim() !== "" &&
          value !== "Not specified" &&
          value !== "null" &&
          value !== null
        ) {
          totalScore += weight;
        }
      }
    });

    // Calculate percentage (should always be out of 100)
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Ensure it's between 0-100
    return Math.max(0, Math.min(100, percentage));
  };
  const loadStates = async () => {
    try {
      const response = await apiService.getStates();
      if (response.success && response.data) {
        setStates(response.data);
        return response.data; // Return the states
      }
      return [];
    } catch (error) {
      console.log("Error loading states:", error);
      return [];
    }
  };

  const loadCitiesByState = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    try {
      const response = await apiService.getCitiesByState(stateId);
      if (response.success && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      console.log("Error loading cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };
  useEffect(() => {
    const initializeProfile = async () => {
      const statesData = await loadStates(); // Get states first
      await loadProfileData(statesData); // Pass states to loadProfileData
      loadAvailableSkills();
    };

    initializeProfile();
  }, []);

  const handleStateChange = async (stateId) => {
    setSelectedStateId(stateId);

    const selectedState = states.find((s) => s.value === stateId);
    if (selectedState) {
      // Update state field
      await updateProfileField("location_state", selectedState.label);
    }

    // Clear city and load new cities
    await updateProfileField("location_city", "");
    loadCitiesByState(stateId);
  };

  const handleCityChange = async (cityName) => {
    await updateProfileField("location_city", cityName);
  };

  // Helper function to update profile field
  const updateProfileField = async (field, value) => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const response = await apiService.updateProfileField(
        userId,
        field,
        value
      );

      if (response.success) {
        setUserProfile((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
    } catch (error) {
      console.log("Error updating field:", error);
    }
  };

  const loadProfileData = async (statesData = null) => {
    try {
      setLoading(true);
      setError(null);

      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) {
        setError("User not found. Please log in again.");
        return;
      }

      const response = await apiService.getFullProfile(userId);

      if (response.success) {
        setUserProfile(response.data);

        // Use passed statesData or fall back to state
        const statesToUse = statesData || states;

        if (response.data.location_state && statesToUse.length > 0) {
          const matchedState = statesToUse.find(
            (s) => s.label === response.data.location_state
          );
          if (matchedState) {
            setSelectedStateId(matchedState.value);
            loadCitiesByState(matchedState.value);
          }
        }

        setPendingChanges(response.data.pending_changes || {});
        setProfileVisibility(response.data.profile_visibility || "public");
        setEducationList(response.data.education_list || []);
        setWorkList(response.data.work_experience_list || []);

        const skills = response.data.skills || [];
        const formattedSkills = skills.map((skill) => {
          if (typeof skill === "string") {
            return {
              skill_name: skill,
              proficiency_level: "intermediate",
              years_of_experience: 0,
              skill_category: "Other",
            };
          }
          return skill;
        });
        setSkillsList(formattedSkills);
      } else {
        setError(response.message || "Failed to load profile data");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const loadAvailableSkills = async () => {
    try {
      const response = await apiService.getAllSkills();
      if (response.success && response.data) {
        setAvailableSkills(response.data);
      }
    } catch (error) {
      console.log("Failed to load available skills:", error);
    }
  };

  const handleSaveEducation = async () => {
    setSavingEducation(true);

    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const response = await apiService.updateProfileField(
        userId,
        "education_list",
        JSON.stringify(educationList)
      );

      if (response.success) {
        Alert.alert("Success", "Education updated successfully");
        setShowEducationModal(false);

        setUserProfile((prev) => ({
          ...prev,
          education_list: educationList,
        }));
      } else {
        Alert.alert("Error", response.message || "Failed to update education");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSavingEducation(false);
    }
  };

  // Auto-save education immediately after add/edit/delete
  const autoSaveEducation = async (item, isUpdate, isDelete = false) => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (isDelete) {
        // Delete operation
        if (!item.education_id) {
          console.log("❌ Cannot delete - no education_id");
          return;
        }

        const response = await apiService.deleteEducation(
          userId,
          item.education_id
        );

        if (response.success) {
          console.log("✅ Education deleted");
          // Reload profile to get updated list
          await loadProfileData();
        } else {
          Alert.alert(
            "Error",
            response.message || "Failed to delete education"
          );
        }
      } else {
        // Add or update operation
        const response = await apiService.updateProfileField(
          userId,
          "add_education",
          JSON.stringify(item)
        );

        if (response.success) {
          console.log(isUpdate ? "✅ Education updated" : "✅ Education added");
          // Reload profile to get updated list with IDs
          await loadProfileData();
        } else {
          Alert.alert("Error", response.message || "Failed to save education");
        }
      }
    } catch (error) {
      console.log("❌ Education auto-save failed:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  // Auto-save work immediately after add/edit/delete
  const autoSaveWork = async (item, isUpdate, isDelete = false) => {
    try {
      // console.log("Auto-saving work experience:", item, isUpdate, isDelete);
      const userId = await SecureStore.getItemAsync("user_id");

      if (isDelete) {
        // Delete operation
        if (!item.experience_id) {
          console.log("❌ Cannot delete - no experience_id");
          return;
        }

        const response = await apiService.deleteWork(
          userId,
          item.experience_id
        );

        if (response.success) {
          console.log("✅ Work experience deleted");
          // Reload profile to get updated list
          await loadProfileData();
        } else {
          Alert.alert(
            "Error",
            response.message || "Failed to delete work experience"
          );
        }
      } else {
        // Add or update operation
        const response = await apiService.updateProfileField(
          userId,
          "add_work",
          JSON.stringify(item)
        );

        if (response.success) {
          console.log(
            isUpdate ? "✅ Work experience updated" : "✅ Work experience added"
          );
          // Reload profile to get updated list with IDs
          await loadProfileData();
        } else {
          Alert.alert(
            "Error",
            response.message || "Failed to save work experience"
          );
        }
      }
    } catch (error) {
      console.log("❌ Work experience auto-save failed:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  // Toggle profile visibility
  const handleToggleVisibility = async () => {
    const newVisibility = profileVisibility === "public" ? "private" : "public";

    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const response = await apiService.updateProfileField(
        userId,
        "profile_visibility",
        newVisibility
      );

      if (response.success) {
        setProfileVisibility(newVisibility);
        setUserProfile((prev) => ({
          ...prev,
          profile_visibility: newVisibility,
        }));
        Alert.alert(
          "Success",
          `Profile is now ${
            newVisibility === "public" ? "visible to all" : "private"
          }`
        );
      } else {
        Alert.alert("Error", response.message || "Failed to update visibility");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const handleSaveWork = async () => {
    setSavingWork(true);

    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const response = await apiService.updateProfileField(
        userId,
        "work_experience_list",
        JSON.stringify(workList)
      );

      if (response.success) {
        Alert.alert("Success", "Work experience updated successfully");
        setShowWorkModal(false);

        setUserProfile((prev) => ({
          ...prev,
          work_experience_list: workList,
        }));
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to update work experience"
        );
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSavingWork(false);
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);

    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const response = await apiService.updateProfileField(
        userId,
        "skills",
        JSON.stringify(skillsList)
      );

      if (response.success) {
        Alert.alert("Success", "Skills updated successfully");
        setShowSkillsModal(false);
        setUserProfile((prev) => ({
          ...prev,
          skills: skillsList,
        }));
      } else {
        Alert.alert("Error", response.message || "Failed to update skills");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSavingSkills(false);
    }
  };

  const handleEditField = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || "");
    setUpdateError("");
    setUpdateSuccess("");
    setShowEditModal(true);
  };

  const handleSaveField = async () => {
    if (!tempValue.trim()) {
      setUpdateError("Please enter a valid value");
      return;
    }

    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const response = await apiService.updateProfileField(
        userId,
        editingField,
        tempValue.trim()
      );

      if (response.success) {
        if (response.requiresApproval) {
          setPendingChanges((prev) => ({
            ...prev,
            [editingField]: {
              value: tempValue.trim(),
              submitted_at: new Date().toISOString().slice(0, 10),
              status: "pending",
            },
          }));

          setUpdateSuccess(
            "Your change has been submitted for admin approval. You will be notified once it's reviewed."
          );

          setTimeout(() => {
            setShowEditModal(false);
            setEditingField(null);
            setTempValue("");
            setUpdateSuccess("");
          }, 2000);
        } else {
          if (editingField === "skills") {
            const skillsArray = tempValue
              .trim()
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s);
            setUserProfile((prev) => ({
              ...prev,
              skills: skillsArray,
            }));
          } else {
            setUserProfile((prev) => ({
              ...prev,
              [editingField]: tempValue.trim(),
            }));
          }

          setUpdateSuccess("Your profile has been updated successfully.");

          setTimeout(() => {
            setShowEditModal(false);
            setEditingField(null);
            setTempValue("");
            setUpdateSuccess("");
          }, 1500);
        }
      } else {
        if (
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
        ) {
          setUpdateError(response.errors.join("\n"));
        } else {
          setUpdateError(
            response.message || "Failed to update profile. Please try again."
          );
        }
      }
    } catch (error) {
      setUpdateError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);

    try {
      await Promise.all([
        SecureStore.deleteItemAsync("user_id"),
        SecureStore.deleteItemAsync("user_type"),
        SecureStore.deleteItemAsync("jwt_token"),
        SecureStore.deleteItemAsync("user_email"),
        SecureStore.deleteItemAsync("user_first_name"),
        SecureStore.deleteItemAsync("user_last_name"),
        SecureStore.deleteItemAsync("user_status"),
      ]);

      await apiService.logout();

      Alert.alert("Logged Out", "You have been logged out successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/choose-path"),
        },
      ]);
    } catch (error) {
      console.log("Logout error:", error);
      router.replace("/choose-path");
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);

    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) {
        Alert.alert("Error", "User not found. Please log in again.");
        setDeletingAccount(false);
        setShowDeleteModal(false);
        return;
      }

      const response = await apiService.deleteAccount(userId);

      if (response.success) {
        setShowDeleteModal(false);
        Alert.alert(
          "Account Deleted",
          "Your account has been permanently deleted.",
          [
            {
              text: "OK",
              onPress: async () => {
                // Logout and clear all data
                await handleLogout();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      Alert.alert("Error", "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  const getDisplayValue = (field) => {
    if (!userProfile) return "";

    const pendingChange = pendingChanges[field];
    const currentValue = userProfile[field] || "";

    if (pendingChange && pendingChange.status === "pending") {
      return `${currentValue} (pending approval)`;
    }
    return currentValue;
  };

  const isPending = (field) => {
    const pendingChange = pendingChanges[field];
    return pendingChange && pendingChange.status === "pending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
          locations={[0, 0.3, 1]}
        />
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
            textAlign: "center",
          }}
        >
          Loading your profile...
        </Text>
      </View>
    );
  }

  // Error Screen
  if (error && !userProfile) {
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
          locations={[0, 0.3, 1]}
        />
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
          Unable to Load Profile
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
          onPress={loadProfileData}
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

  const styles = {
    section: {
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.md,
      fontFamily: theme.typography.fonts.bold,
      color: theme.colors.text.primary,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background.accent,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary.teal,
    },
    editButtonText: {
      fontSize: theme.typography.sizes.sm,
      fontFamily: theme.typography.fonts.medium,
      color: theme.colors.primary.teal,
      marginLeft: theme.spacing.xs,
    },
    listItem: {
      flexDirection: "row",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      ...theme.shadows.sm,
    },
    listItemIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.background.accent,
      justifyContent: "center",
      alignItems: "center",
      marginRight: theme.spacing.md,
    },
    listItemTitle: {
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    listItemSubtitle: {
      fontSize: theme.typography.sizes.sm,
      fontFamily: theme.typography.fonts.medium,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    listItemMeta: {
      fontSize: theme.typography.sizes.xs,
      fontFamily: theme.typography.fonts.regular,
      color: theme.colors.text.tertiary,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background.accent,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      borderStyle: "dashed",
    },
    emptyStateIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.neutral.white,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.medium,
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      fontSize: theme.typography.sizes.sm,
      fontFamily: theme.typography.fonts.regular,
      color: theme.colors.text.tertiary,
      textAlign: "center",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
      backgroundColor: theme.colors.background.card,
    },
    modalTitle: {
      fontSize: theme.typography.sizes.lg,
      fontFamily: theme.typography.fonts.bold,
      color: theme.colors.text.primary,
    },
    saveButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primary.teal,
      borderRadius: theme.borderRadius.md,
      minWidth: 60,
      alignItems: "center",
    },
    saveButtonText: {
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.semiBold,
      color: theme.colors.neutral.white,
    },
  };

  // Header Component
  const Header = () => {
    const profileCompletion = calculateProfileCompletion();

    return (
      <View
        style={{
          backgroundColor: theme.colors.background.card,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
          <View style={{ position: "relative" }}>
            {userProfile?.profile_image ? (
              <Image
                source={{ uri: userProfile.profile_image }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: theme.colors.background.accent,
                }}
              />
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.colors.primary.teal,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: theme.colors.background.accent,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xxxl,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {getInitials(userProfile?.full_name)}
                </Text>
              </View>
            )}

            {/* Camera button overlay */}
            <TouchableOpacity
              onPress={pickProfileImage}
              disabled={uploadingImage}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.colors.primary.teal,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: theme.colors.background.card,
              }}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.neutral.white}
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={14}
                  color={theme.colors.neutral.white}
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: theme.spacing.md }} />

          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            {userProfile?.full_name || "User Name"}
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.primary.teal,
              marginBottom: theme.spacing.xs,
            }}
          >
            {userProfile?.current_position || "Job Title"}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={
                userProfile?.is_verified == "active"
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={16}
              color={
                userProfile?.is_verified == "active"
                  ? theme.colors.status.success
                  : theme.colors.status.warning
              }
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color:
                  userProfile?.is_verified == "active"
                    ? theme.colors.status.success
                    : theme.colors.status.warning,
              }}
            >
              {userProfile?.is_verified == "active"
                ? "Verified Profile"
                : "Verification Pending"}
            </Text>
          </View>
        </View>

        {/* Profile Stats */}
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.accent,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xl,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.teal,
              }}
            >
              {profileCompletion}%
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              }}
            >
              Complete
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.accent,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xl,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.orange,
              }}
            >
              {userProfile?.skills?.length || 0}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              }}
            >
              Skills
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.accent,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xl,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.status.success,
              }}
            >
              {userProfile?.work_experience_list?.length || 0}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
              }}
            >
              Experience
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Section Component
  const Section = ({ title, children, icon }) => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        ...theme.shadows.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        }}
      >
        {icon && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.background.accent,
              justifyContent: "center",
              alignItems: "center",
              marginRight: theme.spacing.sm,
            }}
          >
            <Ionicons name={icon} size={18} color={theme.colors.primary.teal} />
          </View>
        )}
        <Text
          style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );

  // Field Item Component
  const FieldItem = ({
    label,
    value,
    field,
    editable = true,
    multiline = false,
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        minHeight: 56,
      }}
    >
      <View style={{ flex: 1, marginRight: theme.spacing.md }}>
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.tertiary,
            marginBottom: theme.spacing.xs,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.medium,
              color: isPending(field)
                ? theme.colors.primary.orange
                : theme.colors.text.primary,
              flex: 1,
              lineHeight: theme.typography.sizes.base * 1.4,
            }}
          >
            {value ?? getDisplayValue(field) ?? "Not specified"}
          </Text>
          {isPending(field) && (
            <View
              style={{
                backgroundColor: theme.colors.primary.orange,
                borderRadius: theme.borderRadius.sm,
                paddingHorizontal: theme.spacing.xs,
                paddingVertical: 2,
                marginLeft: theme.spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                PENDING
              </Text>
            </View>
          )}
        </View>
      </View>

      {editable && (
        <TouchableOpacity
          onPress={() => handleEditField(field, userProfile?.[field])}
          style={{
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.background.accent,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={theme.colors.primary.teal}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // Pending Changes Section
  const PendingChangesSection = () => {
    const pendingItems = Object.entries(pendingChanges).filter(
      ([_, change]) => change && change.status === "pending"
    );

    if (pendingItems.length === 0) return null;

    return (
      <Section title="Pending Changes" icon="time-outline">
        <View
          style={{
            backgroundColor: theme.colors.background.accent,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary.orange,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.primary.orange}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.primary.orange,
              }}
            >
              Changes Under Review
            </Text>
          </View>

          {pendingItems.map(([field, change]) => (
            <View key={field} style={{ marginBottom: theme.spacing.md }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {field.charAt(0).toUpperCase() +
                  field
                    .slice(1)
                    .replace(/_/g, " ")
                    .replace(/([A-Z])/g, " $1")}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                New Value: {change.value}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Submitted: {formatDate(change.submitted_at)}
              </Text>
            </View>
          ))}

          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              fontStyle: "italic",
              marginTop: theme.spacing.sm,
            }}
          >
            Important profile changes require admin approval for security
            purposes.
          </Text>
        </View>
      </Section>
    );
  };

  // Logout Modal
  const LogoutModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
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
            width: "100%",
            maxWidth: 350,
            padding: theme.spacing.xl,
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
                backgroundColor: theme.colors.status.error,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={28}
                color={theme.colors.neutral.white}
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
              Logout
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: "center",
              }}
            >
              Are you sure you want to logout?
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowLogoutModal(false)}
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
              onPress={handleLogout}
              style={{
                flex: 1,
                backgroundColor: theme.colors.status.error,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
              }}
              activeOpacity={0.9}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.neutral.white,
                }}
              >
                Logout
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

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
      >
        <Header />
        <View style={{ height: theme.spacing.lg }} />

        <PendingChangesSection />

        {/* Personal Information */}
        <Section title="Personal Information" icon="person-outline">
          <FieldItem
            label="Full Name"
            value={userProfile?.full_name}
            field="full_name"
          />
          <FieldItem
            label="Email Address"
            value={userProfile?.email}
            field="email"
          />
          <FieldItem
            label="Mobile Number"
            value={userProfile?.mobile_number}
            field="mobile_number"
          />
          <FieldItem
            label="Date of Birth"
            value={userProfile?.date_of_birth}
            field="date_of_birth"
          />
          <View style={{ paddingTop: theme.spacing.md }}>
            <CustomDropdown3
              label="Gender"
              value={userProfile?.gender}
              onSelect={handleGenderChange}
              options={genderOptions}
              placeholder="Select your gender"
              icon="person-outline"
              showCheckmark={true}
              highlightSelected={true}
            />
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            />
          </View>
          <FieldItem
            label="Bio"
            value={userProfile?.bio}
            field="bio"
            multiline
          />
          <FieldItem
            label="Address"
            value={userProfile?.full_address}
            field="full_address"
            multiline
          />
        </Section>
        {/* Location Details */}
        <Section title="Location Details" icon="location-outline">
          <View style={{ paddingTop: theme.spacing.md }}>
            <CustomDropdown3
              label="State"
              value={selectedStateId}
              onSelect={handleStateChange}
              options={states}
              placeholder="Select your state"
              icon="location-outline"
              searchable
              searchPlaceholder="Search states..."
              emptyMessage="No states available"
              showCheckmark={true}
              highlightSelected={true}
            />
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            />
          </View>

          <FieldItem
            label="City"
            value={userProfile?.location_city}
            field="location_city"
          />

          <FieldItem
            label="Country"
            value={userProfile?.location_country}
            field="location_country"
          />
        </Section>
        {/* Education Section */}
        <Section title="Education" icon="school-outline">
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                }}
              >
                {userProfile?.education_list?.length || 0} Education Record
                {userProfile?.education_list?.length !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEducationList(userProfile?.education_list || []);
                  setShowEducationModal(true);
                }}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={theme.colors.primary.teal}
                />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {userProfile?.education_list?.length > 0 ? (
              userProfile.education_list.map((edu, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemIcon}>
                    <Ionicons
                      name="school"
                      size={22}
                      color={theme.colors.primary.teal}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>{edu.degree_name}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {edu.institution_name}
                    </Text>
                    {edu.field_of_study && (
                      <Text style={styles.listItemMeta}>
                        {edu.field_of_study}
                      </Text>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: theme.spacing.xs,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={theme.colors.text.tertiary}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text style={styles.listItemMeta}>
                        {edu.start_date} -{" "}
                        {edu.is_current ? "Present" : edu.end_date}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons
                    name="school-outline"
                    size={28}
                    color={theme.colors.primary.teal}
                  />
                </View>
                <Text style={styles.emptyText}>No education added yet</Text>
                <Text style={styles.emptySubtext}>
                  Add your educational background to strengthen your profile
                </Text>
              </View>
            )}
          </View>
        </Section>

        {/* Professional Details */}
        <Section title="Professional Details" icon="briefcase-outline">
          <FieldItem
            label="Years of Experience"
            value={userProfile?.experience_years}
            field="experience_years"
          />
          <FieldItem
            label="Months of Experience"
            value={userProfile?.experience_months}
            field="experience_months"
          />
          <FieldItem
            label="Current Salary"
            value={
              userProfile?.current_salary
                ? `₹${userProfile.current_salary}`
                : "Not specified"
            }
            field="current_salary"
          />
          <FieldItem
            label="Expected Salary"
            value={
              userProfile?.expected_salary
                ? `₹${userProfile.expected_salary}`
                : "Not specified"
            }
            field="expected_salary"
          />
          <View style={{ paddingTop: theme.spacing.md }}>
            <CustomDropdown3
              label="Notice Period"
              value={userProfile?.notice_period}
              onSelect={handleNoticePeriodChange}
              options={noticePeriodOptions}
              placeholder="Select notice period"
              icon="calendar-outline"
              showCheckmark={true}
              highlightSelected={true}
            />
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            />
          </View>

          <View style={{ paddingTop: theme.spacing.md }}>
            <CustomDropdown3
              label="Availability Status"
              value={userProfile?.availability_status}
              onSelect={handleAvailabilityChange}
              options={availabilityOptions}
              placeholder="Select availability status"
              icon="checkmark-circle-outline"
              showCheckmark={true}
              highlightSelected={true}
            />
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            />
          </View>
          <FieldItem
            label="Willing to Relocate"
            value={userProfile?.willing_to_relocate ? "Yes" : "No"}
            field="willing_to_relocate"
          />
        </Section>
        {/* Work Experience Section */}
        <Section title="Work Experience" icon="briefcase-outline">
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                }}
              >
                {userProfile?.work_experience_list?.length || 0} Work Record
                {userProfile?.work_experience_list?.length !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setWorkList(userProfile?.work_experience_list || []);
                  setShowWorkModal(true);
                }}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={theme.colors.primary.teal}
                />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {userProfile?.work_experience_list?.length > 0 ? (
              userProfile.work_experience_list.map((work, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemIcon}>
                    <Ionicons
                      name="briefcase"
                      size={22}
                      color={theme.colors.primary.teal}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>{work.job_title}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {work.company_name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: theme.spacing.xs,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={theme.colors.text.tertiary}
                        style={{ marginRight: theme.spacing.xs }}
                      />
                      <Text style={styles.listItemMeta}>
                        {work.start_date} -{" "}
                        {work.is_current ? "Present" : work.end_date}
                      </Text>
                    </View>
                    {work.location && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: theme.spacing.xs,
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color={theme.colors.text.tertiary}
                          style={{ marginRight: theme.spacing.xs }}
                        />
                        <Text style={styles.listItemMeta}>{work.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons
                    name="briefcase-outline"
                    size={28}
                    color={theme.colors.primary.teal}
                  />
                </View>
                <Text style={styles.emptyText}>
                  No work experience added yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Add your work history to showcase your professional background
                </Text>
              </View>
            )}
          </View>
        </Section>

        {/* Skills & Expertise */}
        <Section title="Skills & Expertise" icon="code-slash-outline">
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                }}
              >
                {(userProfile?.skills || []).length} Skill
                {(userProfile?.skills || []).length !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const skills = userProfile?.skills || [];
                  const formattedSkills = skills.map((skill) => {
                    if (typeof skill === "string") {
                      return {
                        skill_name: skill,
                        proficiency_level: "intermediate",
                        years_of_experience: 0,
                        skill_category: "Other",
                      };
                    }
                    return skill;
                  });
                  setSkillsList(formattedSkills);
                  setShowSkillsModal(true);
                }}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={theme.colors.primary.teal}
                />
                <Text style={styles.editButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {(userProfile?.skills || []).length > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: theme.spacing.sm,
                }}
              >
                {(userProfile?.skills || []).map((skill, index) => {
                  const skillObj =
                    typeof skill === "string"
                      ? {
                          skill_name: skill,
                          proficiency_level: "intermediate",
                        }
                      : skill;

                  const getProficiencyColor = (level) => {
                    switch (level) {
                      case "beginner":
                        return theme.colors.status.warning;
                      case "intermediate":
                        return theme.colors.primary.deepBlue;
                      case "advanced":
                        return theme.colors.primary.teal;
                      case "expert":
                        return theme.colors.status.success;
                      default:
                        return theme.colors.neutral.mediumGray;
                    }
                  };

                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.colors.background.accent,
                        borderRadius: theme.borderRadius.lg,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderLeftWidth: 3,
                        borderLeftColor: getProficiencyColor(
                          skillObj.proficiency_level
                        ),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.sm,
                          fontFamily: theme.typography.fonts.medium,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {typeof skill === "string" ? skill : skill.skill_name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons
                    name="code-slash-outline"
                    size={28}
                    color={theme.colors.primary.teal}
                  />
                </View>
                <Text style={styles.emptyText}>No skills added yet</Text>
                <Text style={styles.emptySubtext}>
                  Add your skills to help employers find you
                </Text>
              </View>
            )}
          </View>
        </Section>
        {/* Professional Links */}
        <Section title="Professional Links" icon="link-outline">
          <FieldItem
            label="LinkedIn Profile"
            value={userProfile?.linkedin_url}
            field="linkedin_url"
          />
          <FieldItem
            label="GitHub Profile"
            value={userProfile?.github_url}
            field="github_url"
          />
          <FieldItem
            label="Portfolio Website"
            value={userProfile?.portfolio_url}
            field="portfolio_url"
          />
        </Section>

        {/* Account Information */}
        <Section title="Account Information" icon="settings-outline">
          <FieldItem
            label="Account Status"
            value={userProfile?.account_status}
            field="account_status"
            editable={false}
          />

          {/* Profile Visibility Toggle */}
          <TouchableOpacity
            onPress={handleToggleVisibility}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Profile Visibility
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.primary,
                }}
              >
                {profileVisibility === "public" ? "Public" : "Private"}
              </Text>
            </View>

            <View
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                backgroundColor:
                  profileVisibility === "public"
                    ? theme.colors.primary.teal
                    : theme.colors.border.medium,
                padding: 2,
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.colors.neutral.white,
                  alignSelf:
                    profileVisibility === "public" ? "flex-end" : "flex-start",
                }}
              />
            </View>
          </TouchableOpacity>
          {/* {console.log("User Profile:", userProfile.email_verified)} */}
          <FieldItem
            label="Email Verified"
            value={
              userProfile?.email_verified == 1
                ? "Verified ✓"
                : userProfile?.email_verified == 0
                ? "Not Verified"
                : "Not Verified"
            }
            field="email_verified"
            editable={false}
          />
          <FieldItem
            label="Phone Verified"
            value={
              userProfile?.phone_verified == 1
                ? "Verified ✓"
                : userProfile?.email_verified == 0
                ? "Not Verified"
                : "Not Verified"
            }
            field="phone_verified"
            editable={false}
          />
          {/* <FieldItem
            label="Subscription"
            value={`${
              userProfile?.subscription_status || "Active"
            } (expires ${formatDate(userProfile?.subscription_expiry)})`}
            field="subscription"
            editable={false}
          /> */}
          <FieldItem
            label="Member Since"
            value={formatDate(userProfile?.join_date)}
            field="join_date"
            editable={false}
          />
          <FieldItem
            label="Last Active"
            value={formatDate(userProfile?.last_active)}
            field="last_active"
            editable={false}
          />
        </Section>

        {/* Account Actions */}
        <Section title="Account Actions" icon="cog-outline">
          <TouchableOpacity
            onPress={() => router.push(`/reset-password`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color={theme.colors.primary.teal}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                Reset Password
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Update your password securely
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/contact`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={theme.colors.primary.teal}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                Help & Support
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Get help with your account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/page?page=${"terms"}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={theme.colors.primary.teal}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                Terms & Conditions
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Get help with your account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/page?page=${"privacy"}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.colors.primary.teal}
              />
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/page?page=${"privacy"}`)}
              style={{ flex: 1 }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                Privacy Policy
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Review privacy policy and terms
              </Text>
            </TouchableOpacity>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/page?page=${"refund"}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.accent,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="cash-outline"
                size={20}
                color={theme.colors.primary.teal}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                }}
              >
                Refund Policy
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Learn about cancellations and refunds
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: `${theme.colors.status.error}15`,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.status.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.status.error,
                }}
              >
                Delete Account
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Permanently delete your account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: `${theme.colors.status.error}15`,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={theme.colors.status.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.status.error,
                }}
              >
                Logout
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                }}
              >
                Sign out of your account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        </Section>
      </ScrollView>

      <EditModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setUpdateError("");
          setUpdateSuccess("");
        }}
        onSave={handleSaveField}
        field={editingField}
        value={tempValue}
        onChangeText={(text) => {
          setTempValue(text);
          setUpdateError("");
        }}
        isLoading={updating}
        isCriticalField={criticalFields.includes(editingField)}
        error={updateError}
        success={updateSuccess}
      />
      <LogoutModal />

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
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
              width: "100%",
              maxWidth: 350,
              padding: theme.spacing.xl,
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
                  backgroundColor: theme.colors.status.error,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: theme.spacing.md,
                }}
              >
                <Ionicons
                  name="warning-outline"
                  size={28}
                  color={theme.colors.neutral.white}
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
                Delete Account
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  textAlign: "center",
                }}
              >
                Are you sure you want to permanently delete your account? This
                action cannot be undone.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
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
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.status.error,
                  borderRadius: theme.borderRadius.lg,
                  paddingVertical: theme.spacing.md,
                  alignItems: "center",
                }}
                activeOpacity={0.9}
              >
                {deletingAccount ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.neutral.white}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Education Modal */}
      <Modal
        visible={showEducationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEducationModal(false)}
      >
        <SafeAreaWrapper>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.primary,
            }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowEducationModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Education</Text>

              <View style={{ width: 60 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing.lg }}
            >
              <CustomArrayInput2
                label="Education Records"
                data={educationList}
                setData={setEducationList}
                name="education"
                itemTitle="Education"
                addButtonText="Add Education"
                onSave={autoSaveEducation}
                defaultItem={{
                  education_id: null,
                  degree_type: "",
                  degree_name: "",
                  institution_name: "",
                  field_of_study: "",
                  start_date: "",
                  end_date: "",
                  is_current: false,
                  grade_type: "",
                  grade_value: "",
                  description: "",
                  is_primary: false,
                }}
                renderFields={(item, updateField, errors) => (
                  <>
                    {/* {console.log("Education Item :", item)} */}
                    <CustomInput
                      label="Degree Type"
                      value={item.degree_type}
                      onChangeText={(v) => updateField("degree_type", v)}
                      placeholder="e.g., Bachelor's, Master's, PhD"
                      required
                      error={errors.degree_type}
                    />

                    <CustomInput
                      label="Degree Name"
                      value={item.degree_name}
                      onChangeText={(v) => updateField("degree_name", v)}
                      placeholder="e.g., Bachelor of Science in Computer Science"
                      required
                      error={errors.degree_name}
                    />

                    <CustomInput
                      label="Institution Name"
                      value={item.institution_name}
                      onChangeText={(v) => updateField("institution_name", v)}
                      placeholder="e.g., University of XYZ"
                      required
                      error={errors.institution_name}
                    />

                    <CustomInput
                      label="Field of Study"
                      value={item.field_of_study}
                      onChangeText={(v) => updateField("field_of_study", v)}
                      placeholder="e.g., Computer Science"
                      error={errors.field_of_study}
                    />

                    <CustomDatePicker
                      label="Start Date"
                      value={item.start_date}
                      onChange={(date) => updateField("start_date", date)}
                      required
                      error={errors.start_date}
                    />

                    <CustomDatePicker
                      label="End Date"
                      value={item.end_date}
                      onChange={(date) => updateField("end_date", date)}
                      disabled={item.is_current}
                      error={errors.end_date}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        updateField("is_current", !item.is_current)
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: theme.spacing.md,
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: item.is_current
                            ? theme.colors.primary.teal
                            : theme.colors.border.medium,
                          backgroundColor: item.is_current
                            ? theme.colors.primary.teal
                            : "transparent",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        {item.is_current && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={theme.colors.neutral.white}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: theme.typography.sizes.base }}>
                        I currently study here
                      </Text>
                    </TouchableOpacity>

                    <CustomInput
                      label="Grade/GPA"
                      value={item.grade_value}
                      onChangeText={(v) => updateField("grade_value", v)}
                      placeholder="e.g., 3.8"
                      error={errors.grade_value}
                    />

                    <CustomInput
                      label="Description"
                      value={item.description}
                      onChangeText={(v) => updateField("description", v)}
                      placeholder="Additional details..."
                      multiline
                      numberOfLines={3}
                      error={errors.description}
                    />
                  </>
                )}
              />
            </ScrollView>
          </View>
        </SafeAreaWrapper>
      </Modal>

      {/* Work Experience Modal */}
      <Modal
        visible={showWorkModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkModal(false)}
      >
        <SafeAreaWrapper>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.primary,
            }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowWorkModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Work Experience</Text>

              <View style={{ width: 60 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing.lg }}
            >
              <CustomArrayInput2
                label="Work Experience Records"
                data={workList}
                setData={setWorkList}
                name="work_experience"
                itemTitle="Work Experience"
                addButtonText="Add Work Experience"
                onSave={autoSaveWork}
                defaultItem={{
                  experience_id: null,
                  job_title: "",
                  company_name: "",
                  employment_type: "",
                  start_date: "",
                  end_date: "",
                  is_current: false,
                  location: "",
                  job_description: "",
                  achievements: "",
                  salary: "",
                  currency: "INR",
                }}
                renderFields={(item, updateField, errors) => (
                  <>
                    <CustomInput
                      label="Job Title"
                      value={item.job_title}
                      onChangeText={(v) => updateField("job_title", v)}
                      placeholder="e.g., Software Engineer"
                      required
                      error={errors.job_title}
                    />

                    <CustomInput
                      label="Company Name"
                      value={item.company_name}
                      onChangeText={(v) => updateField("company_name", v)}
                      placeholder="e.g., Tech Corp"
                      required
                      error={errors.company_name}
                    />

                    <CustomDropdown
                      label="Employment Type"
                      value={item.employment_type}
                      onSelect={(v) => updateField("employment_type", v)}
                      options={[
                        { label: "Full-time", value: "full_time" },
                        { label: "Part-time", value: "part_time" },
                        { label: "Contract", value: "contract" },
                        { label: "Freelance", value: "freelance" },
                        { label: "Internship", value: "internship" },
                      ]}
                      placeholder="Select employment type"
                      error={errors.employment_type}
                    />

                    <CustomDatePicker
                      label="Start Date"
                      value={item.start_date}
                      onChange={(date) => updateField("start_date", date)}
                      required
                      error={errors.start_date}
                    />

                    <CustomDatePicker
                      label="End Date"
                      value={item.end_date}
                      onChange={(date) => updateField("end_date", date)}
                      disabled={item.is_current}
                      error={errors.end_date}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        updateField("is_current", !item.is_current)
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: theme.spacing.md,
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: item.is_current
                            ? theme.colors.primary.teal
                            : theme.colors.border.medium,
                          backgroundColor: item.is_current
                            ? theme.colors.primary.teal
                            : "transparent",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        {item.is_current && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={theme.colors.neutral.white}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: theme.typography.sizes.base }}>
                        I currently work here
                      </Text>
                    </TouchableOpacity>

                    <CustomInput
                      label="Location"
                      value={item.location}
                      onChangeText={(v) => updateField("location", v)}
                      placeholder="e.g., Mumbai, India"
                      error={errors.location}
                    />

                    <CustomInput
                      label="Job Description"
                      value={item.job_description}
                      onChangeText={(v) => updateField("job_description", v)}
                      placeholder="Describe your role and responsibilities..."
                      multiline
                      numberOfLines={3}
                      error={errors.job_description}
                    />

                    <CustomInput
                      label="Key Achievements"
                      value={item.achievements}
                      onChangeText={(v) => updateField("achievements", v)}
                      placeholder="Notable accomplishments..."
                      multiline
                      numberOfLines={3}
                      error={errors.achievements}
                    />
                  </>
                )}
              />
            </ScrollView>
          </View>
        </SafeAreaWrapper>
      </Modal>

      {/* Skills Modal */}
      <Modal
        visible={showSkillsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSkillsModal(false)}
      >
        <SafeAreaWrapper>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.primary,
            }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowSkillsModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Skills & Expertise</Text>

              <TouchableOpacity
                onPress={handleSaveSkills}
                disabled={savingSkills}
                style={styles.saveButton}
                activeOpacity={0.7}
              >
                {savingSkills ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.neutral.white}
                  />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              <SkillsInputAI
                skills={skillsList}
                onSkillsChange={setSkillsList}
                label="Your Skills"
                placeholder="Type a skill to get AI suggestions..."
                maxSkills={20}
                required={false}
                contextType="jobseeker"
              />

              <View
                style={{
                  backgroundColor: theme.colors.background.accent,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.xl,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.primary.teal,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  💡 Pro Tips:
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    lineHeight: theme.typography.sizes.sm * 1.5,
                  }}
                >
                  • Type to search from our skills database{"\n"}• Tap any skill
                  card to edit proficiency level{"\n"}• Set years of experience
                  for better matching{"\n"}• Add 10-15 relevant skills for best
                  results
                </Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaWrapper>
      </Modal>
    </View>
  );
}
