import CompanyEditModal from "@/components/CompanyEditModal";
import CustomDropdown from "@/components/CustomDropdown";
import CustomDropdown3 from "@/components/CustomDropdown3";
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
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function CompanyProfile() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  // ✅ NEW: Pending approvals state
  const [pendingApprovals, setPendingApprovals] = useState({
    count: 0,
    has_pending: false,
    requests: [],
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  // User credentials
  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const loadStates = async () => {
    try {
      const response = await apiService.getStates();
      if (response.success && response.data) {
        setStates(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.log("Error loading states:", error);
      return [];
    }
  };
  const handleStateChange = async (stateId) => {
    setSelectedStateId(stateId);

    const selectedState = states.find((s) => s.value === stateId);
    if (selectedState) {
      // Update state field
      await handleSaveField(selectedState.label, "location_state");
    }
  };
  // Add image picker function
  const pickProfileImage = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access photos is required to upload company logo.",
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for logo
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

      if (!userId) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }

      const response = await apiService.updateUserImage(userId, imageAsset);

      if (response.success) {
        // Update local state
        setProfileImage(imageAsset.uri);
        setCompanyProfile((prev) => ({
          ...prev,
          profile_image: response.data?.image || imageAsset.uri,
        }));

        Alert.alert("Success", "Company logo updated successfully");

        // Refresh profile
        await fetchCompanyProfile(userId, companyId);
      } else {
        Alert.alert("Error", response.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload company logo");
    } finally {
      setUploadingImage(false);
    }
  };

  // Dropdown Options (same as employer-signup)
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "prefer_not_to_say" },
  ];

  const companySizeOptions = [
    { label: "1-10 employees", value: "1-10" },
    { label: "11-50 employees", value: "11-50" },
    { label: "51-200 employees", value: "51-200" },
    { label: "201-500 employees", value: "201-500" },
    { label: "501-1000 employees", value: "501-1000" },
    { label: "1000+ employees", value: "1000+" },
  ];

  const companyTypeOptions = [
    { label: "Startup", value: "startup" },
    { label: "Corporate", value: "corporate" },
    { label: "Government", value: "government" },
    { label: "Non-Profit", value: "non_profit" },
    { label: "Freelance", value: "freelance" },
  ];

  const industryOptions = [
    { label: "Information Technology", value: "Information Technology" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "Finance & Banking", value: "Finance & Banking" },
    { label: "Education", value: "Education" },
    { label: "Manufacturing", value: "Manufacturing" },
    { label: "Retail & E-commerce", value: "Retail & E-commerce" },
    { label: "Construction", value: "Construction" },
    { label: "Hospitality", value: "Hospitality" },
    { label: "Media & Entertainment", value: "Media & Entertainment" },
    { label: "Government", value: "Government" },
    { label: "Other", value: "Other" },
  ];

  // Company profile data
  const [companyProfile, setCompanyProfile] = useState({
    // Basic Info
    companyName: "",
    industry: "",
    companySize: "",
    companyType: "",
    foundedYear: "",
    website: "",
    gst_number: "",
    gstVerified: false,
    location_city: "",
    location_state: "",
    headquarters: "",

    // Contact Person Info
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    phone: "",
    address: "",

    // Company Details
    description: "",

    // Subscription & Account
    accountStatus: "",
    joinDate: "",
    totalJobsPosted: 0,
    totalHires: 0,

    // Statistics
    statistics: {
      total_jobs_posted: 0,
      total_hires: 0,
      active_jobs: 0,
    },
  });

  // Load user data from SecureStore
  useEffect(() => {
    const initializeProfile = async () => {
      const statesData = await loadStates();
      await loadUserData(statesData);
    };

    initializeProfile();
  }, []);

  const loadUserData = async (statesData = []) => {
    try {
      const storedUserId = await SecureStore.getItemAsync("user_id");
      const storedCompanyId = await SecureStore.getItemAsync("company_id");

      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      }

      if (storedCompanyId) {
        setCompanyId(parseInt(storedCompanyId));
      }

      if (storedUserId) {
        await fetchCompanyProfile(storedUserId, storedCompanyId, statesData);
      } else {
        Alert.alert("Error", "User not logged in");
        router.replace("/choose-path");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
    }
  };

  // Fetch company profile from API
  const fetchCompanyProfile = async (uid, cid, statesData = []) => {
    try {
      setLoading(true);

      const response = await apiService.getCompanyProfile(uid, cid);

      if (response.success && response.data) {
        const data = response.data;

        // Set company ID if not already set
        if (!companyId && data.company_id) {
          setCompanyId(data.company_id);
          await SecureStore.setItemAsync(
            "company_id",
            data.company_id.toString(),
          );
        }
        console.log("Fetched Company Profile Data:", data.profile_image);
        setCompanyProfile({
          // Basic Info
          companyName: data.company_name || "",
          industry: data.industry || "",
          companySize: data.company_size || "",
          companyType: data.company_type || "",
          foundedYear: data.founded_year ? data.founded_year.toString() : "",
          website: data.company_website || "",
          gst_number: data.gst_number || "",
          gstVerified: data.gst_verified || false,
          location_city: data.location_city || "",
          location_state: data.location_state || "",
          headquarters: data.headquarters || "",
          profile_image: data.profile_image || "",

          // Contact Person Info
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          gender: data.gender || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.headquarters_address || "",

          // Company Details
          description: data.company_description || "",

          // Subscription & Account
          accountStatus: data.account_status || "",
          joinDate: data.created_at || "",

          // Statistics
          statistics: data.statistics || {
            total_jobs_posted: 0,
            total_hires: 0,
            active_jobs: 0,
          },

          // Store company_id
          company_id: data.company_id,
          user_id: data.user_id,
        });

        // ✅ NEW: Set pending approvals data
        if (data.pending_approvals) {
          setPendingApprovals(data.pending_approvals);
        }

        const statesToUse =
          statesData && statesData.length > 0 ? statesData : states;

        if (data.location_state && statesToUse.length > 0) {
          const matchedState = statesToUse.find(
            (s) => s.label === data.location_state,
          );
          if (matchedState) {
            setSelectedStateId(matchedState.value);
          }
        }
        setLoading(false);
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to load company profile",
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      Alert.alert("Error", "Failed to load company profile");
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompanyProfile(userId, companyId);
    setRefreshing(false);
  };

  const handleEditField = (field, currentValue) => {
    setEditingField(field);
    setEditingValue(currentValue || "");
    setShowEditModal(true);
  };

  const handleSaveField = async (value, fieldName = editingField) => {
    if (!value || !value.toString().trim()) {
      Alert.alert("Error", "Value cannot be empty");
      return;
    }

    setUpdating(true);

    try {
      const response = await apiService.updateCompanyField(
        companyId,
        userId,
        fieldName,
        value.toString().trim(),
      );

      if (response.success) {
        // Check if it requires approval
        if (response.requires_approval) {
          Alert.alert(
            "Submitted for Approval",
            response.message ||
              "Your change has been submitted for admin approval",
            [
              {
                text: "OK",
                onPress: () => {
                  setShowEditModal(false);
                  setEditingField(null);
                  setEditingValue("");
                  // Refresh to get updated pending requests
                  fetchCompanyProfile(userId, companyId);
                },
              },
            ],
          );
        } else {
          // Update local state for immediate updates
          setCompanyProfile((prev) => ({
            ...prev,
            [fieldName]: value.toString().trim(),
          }));

          Alert.alert(
            "Success",
            response.message || "Company profile updated successfully",
          );

          setShowEditModal(false);
          setEditingField(null);
          setEditingValue("");

          // Refresh data to get latest from server
          await fetchCompanyProfile(userId, companyId);
        }
      } else {
        Alert.alert(
          "Error",
          response.errors?.join(", ") ||
            response.message ||
            "Failed to update company profile",
        );
      }
    } catch (error) {
      console.error("Error updating company field:", error);
      Alert.alert("Error", "Failed to update company profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingField(null);
    setEditingValue("");
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);

    try {
      const response = await apiService.logout();

      if (response.success) {
        router.replace("/choose-path");
      } else {
        Alert.alert("Error", "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout API fails, clear local data and redirect
      router.replace("/choose-path");
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);

    try {
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
          ],
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

  // Header Component
  const Header = () => (
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
      {/* ✅ NEW: Pending Approvals Banner */}
      {pendingApprovals.has_pending && (
        <TouchableOpacity
          onPress={() => setShowPendingModal(true)}
          style={{
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary.orange,
          }}
          activeOpacity={0.8}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.colors.primary.orange}
                style={{ marginRight: theme.spacing.sm }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.primary.orange,
                  }}
                >
                  {pendingApprovals.count}{" "}
                  {pendingApprovals.count === 1 ? "Change" : "Changes"} Pending
                  Approval
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  Tap to view details
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.primary.orange}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Company Logo and Basic Info */}
      <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
        <View style={{ position: "relative" }}>
          {/* { console.log("Company Profile Image:", companyProfile)} */}
          {companyProfile?.profile_image ? (
            <Image
              source={{ uri: companyProfile.profile_image }}
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
                  fontSize: theme.typography.sizes.xxl,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                {companyProfile.companyName.charAt(0) || "C"}
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
          {companyProfile.companyName || "Company Name"}
        </Text>

        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.primary.teal,
            marginBottom: theme.spacing.xs,
          }}
        >
          {companyProfile.industry || "Industry"}
        </Text>

        {companyProfile.accountStatus == "active" ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.status.success}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.status.success,
              }}
            >
              Verified Company
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.status.warning}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.status.warning,
              }}
            >
              Verification Pending
            </Text>
          </View>
        )}
      </View>
      <View>
        {pendingApprovals.requests.length > 0 &&
          pendingApprovals.requests.map((request, index) => (
            <View
              key={request.request_id}
              style={{
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.primary.orange,
              }}
            >
              {/* Field Name Badge */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: theme.spacing.sm,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.colors.primary.deepBlue,
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
                    {request.field_label} 1
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                  }}
                >
                  {new Date(request.submitted_at).toLocaleDateString()}
                </Text>
              </View>

              {/* Current Value */}
              <View style={{ marginBottom: theme.spacing.sm }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: 4,
                  }}
                >
                  Current:
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.status.error,
                    textDecorationLine: "line-through",
                  }}
                >
                  {request.current_value || "Empty"}
                </Text>
              </View>

              {/* Arrow */}
              <View
                style={{
                  alignItems: "center",
                  marginVertical: theme.spacing.xs,
                }}
              >
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={theme.colors.text.tertiary}
                />
              </View>

              {/* New Value */}
              <View>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: 4,
                  }}
                >
                  Requested Change:
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.status.success,
                  }}
                >
                  {request.new_value}
                </Text>
              </View>
            </View>
          ))}
      </View>
      {/* Company Stats */}
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
            {companyProfile.statistics?.total_jobs_posted || 0}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}
          >
            Jobs Posted
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
            {companyProfile.statistics?.total_hires || 0}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}
          >
            Successful Hires
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
            {companyProfile.statistics?.active_jobs || 0}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}
          >
            Active Jobs
          </Text>
        </View>
      </View>
    </View>
  );

  // Helper function to get icon for field
  const getIconForField = (field) => {
    const iconMap = {
      gender: "person-outline",
      industry: "business-outline",
      companySize: "people-outline",
      companyType: "business-outline",
    };
    return iconMap[field] || "list-outline";
  };

  // Section Component
  const Section = ({ title, children, icon }) => (
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.md,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={theme.colors.primary.teal}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        <Text
          style={{
            fontSize: theme.typography.sizes.md,
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
    fieldType = "text",
    options = [],
  }) => {
    // If it's a dropdown field, use CustomDropdown
    if (fieldType === "dropdown") {
      return (
        <View
          style={{
            paddingVertical: theme.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
            minHeight: 50,
          }}
        >
          <CustomDropdown
            label={label}
            value={value}
            onSelect={(selectedValue) => handleSaveField(selectedValue, field)}
            options={options}
            placeholder={`Select ${label.toLowerCase()}`}
            icon={getIconForField(field)}
            disabled={!editable}
          />
        </View>
      );
    }

    // Original text field rendering
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          minHeight: 50,
        }}
      >
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.primary,
              lineHeight: theme.typography.sizes.base * 1.3,
            }}
          >
            {value || "Not provided"}
          </Text>
        </View>

        {editable && (
          <TouchableOpacity
            onPress={() => handleEditField(field, value)}
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.background.accent,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={theme.colors.primary.teal}
            />
          </TouchableOpacity>
        )}
      </View>
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

  // Loading state
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.sizes.base,
            color: theme.colors.text.secondary,
          }}
        >
          Loading company profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.card}
      />

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
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.teal]}
            tintColor={theme.colors.primary.teal}
          />
        }
      >
        <Header />
        <View style={{ marginTop: 14 }} />
        {/* Company Information */}
        <Section title="Company Information" icon="business-outline">
          <FieldItem
            label="Company Name"
            value={companyProfile.companyName}
            field="companyName"
          />
          <FieldItem
            label="Industry"
            value={companyProfile.industry}
            field="industry"
            fieldType="dropdown"
            options={industryOptions}
          />
          <FieldItem
            label="Company Type"
            value={companyProfile.companyType}
            field="companyType"
            fieldType="dropdown"
            options={companyTypeOptions}
          />
          <FieldItem
            label="Company Size"
            value={companyProfile.companySize}
            field="companySize"
            fieldType="dropdown"
            options={companySizeOptions}
          />
          <FieldItem
            label="Founded Year"
            value={companyProfile.foundedYear}
            field="foundedYear"
          />
          <FieldItem
            label="Website"
            value={companyProfile.website}
            field="website"
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.light,
              minHeight: 50,
            }}
          >
            <View style={{ flex: 1, marginRight: theme.spacing.md }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                GST Number
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.primary,
                    lineHeight: theme.typography.sizes.base * 1.3,
                    marginRight: theme.spacing.sm,
                  }}
                >
                  {companyProfile.gst_number || "Not provided"}
                </Text>
                {companyProfile.gstVerified && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.colors.status.success,
                      paddingHorizontal: theme.spacing.xs,
                      paddingVertical: 2,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color={theme.colors.neutral.white}
                      style={{ marginRight: 2 }}
                    />
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.neutral.white,
                      }}
                    >
                      Verified
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() =>
                handleEditField("gst_number", companyProfile.gst_number)
              }
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.background.accent,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={theme.colors.primary.teal}
              />
            </TouchableOpacity>
          </View>
          <FieldItem
            label="City"
            value={companyProfile.location_city}
            field="location_city"
          />
          <View style={{ paddingVertical: theme.spacing.sm }}>
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
        </Section>

        {/* Contact Person Information */}
        <Section title="Contact Person" icon="person-outline">
          <FieldItem
            label="First Name"
            value={companyProfile.firstName}
            field="firstName"
          />
          <FieldItem
            label="Last Name"
            value={companyProfile.lastName}
            field="lastName"
          />
          {/* Uncomment if you want to enable gender field
          <FieldItem
            label="Gender"
            value={companyProfile.gender}
            field="gender"
            fieldType="dropdown"
            options={genderOptions}
          /> */}
          <FieldItem
            label="Email Address"
            value={companyProfile.email}
            field="email"
          />
          <FieldItem
            label="Phone Number"
            value={companyProfile.phone}
            field="phone"
          />
        </Section>

        {/* Company Address */}
        <Section title="Company Address" icon="location-outline">
          <FieldItem
            label="Full Address"
            value={companyProfile.address}
            field="address"
          />
        </Section>

        {/* Company Details */}
        <Section title="About Company" icon="document-text-outline">
          <FieldItem
            label="Company Description"
            value={companyProfile.description}
            field="description"
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
                Learn about our refund and cancellation terms
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
                backgroundColor: theme.colors.background.accent,
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

      <CompanyEditModal
        visible={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveField}
        fieldName={editingField}
        initialValue={editingValue}
        updating={updating}
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
    </View>
  );
}
