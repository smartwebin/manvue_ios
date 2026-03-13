import CustomDatePicker from "@/components/CustomDatePicker";
import CustomDropdown from "@/components/CustomDropdown";
import CustomDropdown3 from "@/components/CustomDropdown3";
import CustomInput from "@/components/CustomInput";
import CustomVerifyInput from "@/components/CustomVerifyInput";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import SkillsInputAI from "@/components/SkillsInputAI";
import VerificationModal from "@/components/VerificationModal";
import apiService from "@/services/apiService";
import notificationService from "@/services/notificationService";
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

export default function Signup() {
  // Form State - Force jobseeker only, no employer option
  const [userType, setUserType] = useState("jobseeker");
  const [formData, setFormData] = useState({
    // Common fields
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
    gender: "",
    location_city: "",
    location_state: "",
    location_country: "India",
    bio: "",
    email_verified: false,
    phone_verified: false,
    // Job seeker specific fields
    current_company: "",
    experience_years: "",
    experience_months: "",
    current_salary: "",
    expected_salary: "",
    notice_period: "",
    job_type_preference: [],
    work_mode_preference: [],
    willing_to_relocate: 0,
    availability_status: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    profile_visibility: "",
    industry: "",
    full_address: "",
    function: "",
    industry_nature: "",
    area_of_interest: "",
    work_type: "",
    preferred_locations: [],
  });

  const [skills, setSkills] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  // Email verification state (for new verification-first flow)
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);

  // Add to useEffect
  useEffect(() => {
    loadSkills();
    loadStates(); // Add this
  }, []);

  // Add these functions
  const loadStates = async () => {
    try {
      const response = await apiService.getStates();
      if (response.success && response.data) {
        setStates(response.data);
        console.log("✅ States loaded:", response.count);
      } else {
        console.log("❌ Failed to load states:", response.message);
        setStates([]);
        // Optional: Show user-friendly error
        // Alert.alert("Error", "Failed to load states. Please try again.");
      }
    } catch (error) {
      console.log("❌ Error loading states:", error);
      setStates([]);
      // Optional: Show user-friendly error
      // Alert.alert("Network Error", "Please check your internet connection.");
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
        console.log("✅ Cities loaded:", response.count);
      } else {
        console.log("❌ Failed to load cities:", response.message);
        setCities([]);
      }
    } catch (error) {
      console.log("❌ Error loading cities:", error);
      setCities([]);
      Alert.alert(
        "Error",
        "Failed to load cities. Please check your connection and try again.",
      );
    } finally {
      setLoadingCities(false);
    }
  };

  // Handle state selection
  const handleStateSelect = (stateId) => {
    // Update selected state ID
    setSelectedStateId(stateId);

    // Find state name from states array
    const selectedState = states.find((s) => s.value === stateId);
    if (selectedState) {
      handleInputChange("location_state", selectedState.label);
    }

    // Reset city when state changes
    handleInputChange("location_city", "");
    setCities([]); // Clear cities array immediately

    // Clear any existing city error
    if (errors.location_city) {
      setErrors((prev) => ({
        ...prev,
        location_city: null,
      }));
    }

    // Load cities for selected state
    loadCitiesByState(stateId);
  };
  // Dropdown Options
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "prefer_not_to_say" },
  ];

  const jobTypeOptions = [
    { label: "Full-Time", value: "full_time" },
    { label: "Part-Time", value: "part_time" },
    { label: "Contract", value: "contract" },
    { label: "Freelance", value: "freelance" },
    { label: "Internship", value: "internship" },
  ];

  const profileVisibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
  ];

  const workModeOptions = [
    { label: "Remote", value: "remote" },
    { label: "Hybrid", value: "hybrid" },
    { label: "On-site", value: "on_site" },
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

  const loadSkills = async () => {
    try {
      const response = await apiService.getSkills();
      if (response.success) {
        setAvailableSkills(
          response.data.map((skill) => ({
            skill_id: skill.skill_id,
            skill_name: skill.skill_name,
            skill_category: skill.skill_category || "Other",
          })),
        );
      }
    } catch (error) {
      console.log("Error loading skills:", error);
    }
  };

  // Image picker functions
  const pickProfileImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access photos",
        );
        return;
      }

      // Show action sheet for image source selection
      Alert.alert("Select Image", "Choose image source", [
        { text: "Camera", onPress: () => openCamera() },
        { text: "Photo Library", onPress: () => openImageLibrary() },
        { text: "Cancel", style: "cancel" },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access camera",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Input handler supporting normal fields and array items
  const handleInputChange = (field, value, index = null, listType = null) => {
    if (listType && index !== null) {
      // Update an array field inside formData
      setFormData((prev) => {
        const updatedList = [...prev[listType]];
        updatedList[index][field] = value;
        return {
          ...prev,
          [listType]: updatedList,
        };
      });

      // Clear error for the array field if exists
      if (errors[listType]?.[index]?.[field]) {
        setErrors((prev) => {
          const updatedErrors = { ...prev };
          if (updatedErrors[listType] && updatedErrors[listType][index]) {
            updatedErrors[listType][index][field] = null;
          }
          return updatedErrors;
        });
      }
    } else {
      // Normal field
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for normal field
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: null,
        }));
      }
    }

    // Clear signup error when user starts typing
    if (signupError) {
      setSignupError("");
    }
  };

  // Skills management - now handled by SkillsInput component
  const handleSkillsChange = (newSkills) => {
    setSkills(newSkills);
    // Clear skills error if exists
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: null }));
    }
    // Clear signup error when user modifies skills
    if (signupError) {
      setSignupError("");
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.confirm_password) {
      newErrors.confirm_password = "Confirm password is required";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }
    if (formData.date_of_birth) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
        newErrors.date_of_birth = "Date of birth must be in YYYY-MM-DD format";
      } else {
        // Optional: Check if date is valid
        const [year, month, day] = formData.date_of_birth
          .split("-")
          .map(Number);
        const dob = new Date(year, month - 1, day);
        if (
          dob.getFullYear() !== year ||
          dob.getMonth() !== month - 1 ||
          dob.getDate() !== day
        ) {
          newErrors.date_of_birth = "Invalid date of birth";
        }
      }
    }

    // Mandatory dropdown validations
    // if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.full_address.trim())
      newErrors.full_address = "Address is required";
    if (!formData.location_country.trim())
      newErrors.location_country = "Country is required";
    if (!formData.location_state.trim())
      newErrors.location_state = "State is required";
    if (!formData.location_city.trim())
      newErrors.location_city = "City is required";

    if (
      !formData.job_type_preference ||
      formData.job_type_preference.length === 0
    ) {
      newErrors.job_type_preference = "Job type preference is required";
    }
    if (
      !formData.work_mode_preference ||
      formData.work_mode_preference.length === 0
    ) {
      newErrors.work_mode_preference = "Work mode preference is required";
    }
    if (!formData.availability_status)
      newErrors.availability_status = "Availability status is required";
    if (!formData.profile_visibility)
      newErrors.profile_visibility = "Profile visibility is required";

    // URL validations
    const urlRegex =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    if (formData.linkedin_url && !urlRegex.test(formData.linkedin_url)) {
      newErrors.linkedin_url = "Invalid LinkedIn URL";
    }
    if (formData.github_url && !urlRegex.test(formData.github_url)) {
      newErrors.github_url = "Invalid GitHub URL";
    }
    if (formData.portfolio_url && !urlRegex.test(formData.portfolio_url)) {
      newErrors.portfolio_url = "Invalid Portfolio URL";
    }
    // Validate email is verified
    if (!formData.email_verified) {
      newErrors.email_verified = "Email must be verified";
    }

    //new validation
    if (!skills || skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }
    // Validate phone is verified
    if (!formData.phone_verified) {
      newErrors.phone_verified = "Phone number must be verified";
    }

    // Other required field validations...
    if (!formData.availability_status) {
      newErrors.availability_status = "Availability status is required";
    }

    if (!formData.profile_visibility) {
      newErrors.profile_visibility = "Profile visibility is required";
    }

    if (
      !formData.work_mode_preference ||
      formData.work_mode_preference.length === 0
    ) {
      newErrors.work_mode_preference =
        "At least one work mode preference is required";
    }

    if (
      !formData.job_type_preference ||
      formData.job_type_preference.length === 0
    ) {
      newErrors.job_type_preference =
        "At least one job type preference is required";
    }

    // Jobseeker-specific validations
    if (skills.length === 0)
      newErrors.skills = "At least one skill is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      console.log("❌ Validation errors:", errors);
      setSignupError("Please fix the validation errors above and try again");
      return;
    }

    setIsLoading(true);
    setSignupError("");

    try {
      const formDataToSend = new FormData();

      // Add user type first
      formDataToSend.append("user_type", userType);

      // Add basic fields
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("confirm_password", formData.confirm_password);
      formDataToSend.append("date_of_birth", formData.date_of_birth);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("location_city", formData.location_city);
      formDataToSend.append("location_state", formData.location_state);
      formDataToSend.append("location_country", formData.location_country);
      formDataToSend.append("full_address", formData.full_address);
      formDataToSend.append("bio", formData.bio);

      // Add verification flags
      formDataToSend.append("email_verified", formData.email_verified ? 1 : 0);
      formDataToSend.append("phone_verified", formData.phone_verified ? 1 : 0);

      if (formData.current_company)
        formDataToSend.append("current_company", formData.current_company);
      if (formData.experience_years !== undefined)
        formDataToSend.append(
          "experience_years",
          formData.experience_years.toString() || 0,
        );
      if (formData.experience_months !== undefined)
        formDataToSend.append(
          "experience_months",
          formData.experience_months.toString() || 0,
        );
      if (formData.current_salary)
        formDataToSend.append("current_salary", formData.current_salary);
      if (formData.expected_salary)
        formDataToSend.append("expected_salary", formData.expected_salary);
      if (formData.notice_period)
        formDataToSend.append("notice_period", formData.notice_period);
      if (formData.job_type_preference.length > 0)
        formDataToSend.append(
          "job_type_preference",
          JSON.stringify(formData.job_type_preference),
        );
      if (formData.work_mode_preference.length > 0)
        formDataToSend.append(
          "work_mode_preference",
          JSON.stringify(formData.work_mode_preference),
        );
      if (formData.willing_to_relocate !== undefined)
        formDataToSend.append(
          "willing_to_relocate",
          formData.willing_to_relocate.toString(),
        );
      if (formData.availability_status)
        formDataToSend.append(
          "availability_status",
          formData.availability_status,
        );
      if (formData.profile_visibility)
        formDataToSend.append(
          "profile_visibility",
          formData.profile_visibility,
        );
      if (formData.linkedin_url)
        formDataToSend.append("linkedin_url", formData.linkedin_url);
      if (formData.github_url)
        formDataToSend.append("github_url", formData.github_url);
      if (formData.portfolio_url)
        formDataToSend.append("portfolio_url", formData.portfolio_url);
      if (formData.area_of_interest)
        formDataToSend.append("area_of_interest", formData.area_of_interest);
      if (formData.work_type)
        formDataToSend.append("work_type", formData.work_type);
      if (formData.function)
        formDataToSend.append("function", formData.function);
      if (formData.industry_nature)
        formDataToSend.append("industry_nature", formData.industry_nature);
      if (formData.industry)
        formDataToSend.append("industry", formData.industry);
      if (formData.preferred_locations.length > 0)
        formDataToSend.append(
          "preferred_locations",
          JSON.stringify(formData.preferred_locations),
        );

      // Add skills for jobseekers
      if (skills.length > 0) {
        formDataToSend.append("skills", JSON.stringify(skills));
      }

      // Get device token for push notifications
      const deviceToken = await notificationService.getDeviceToken();
      if (deviceToken) {
        formDataToSend.append("device_token", deviceToken);
      }

      const response = await apiService.signup(formDataToSend);
      console.log("📦 Full signup response:", response);

      if (response.success) {
        console.log("✅ Signup successful");

        // Store user data in SecureStore
        if (response.data?.user_id) {
          await SecureStore.setItemAsync(
            "user_id",
            response.data.user_id.toString(),
          );
          console.log(
            "✅ User ID stored in SecureStore:",
            response.data.user_id,
          );
        }

        if (response.data?.user_type) {
          await SecureStore.setItemAsync("user_type", response.data.user_type);
          console.log(
            "✅ User type stored in SecureStore:",
            response.data.user_type,
          );
        }

        // Store JWT token in SecureStore for better security
        if (response.token || response.jwt_token) {
          const token = response.token || response.jwt_token;
          await SecureStore.setItemAsync("jwt_token", token);
          console.log("✅ JWT token stored in SecureStore");
        }

        // Store user email and name for quick access
        if (response.data?.email) {
          await SecureStore.setItemAsync("user_email", response.data.email);
        }

        if (response.data?.first_name) {
          await SecureStore.setItemAsync(
            "user_first_name",
            response.data.first_name,
          );
        }

        if (response.data?.last_name) {
          await SecureStore.setItemAsync(
            "user_last_name",
            response.data.last_name,
          );
        }

        // Store user status
        if (response.data?.status) {
          await SecureStore.setItemAsync("user_status", response.data.status);
        }

        console.log("✅ Signup successful, User ID:", response.data.user_id);

        // Check if payment is required (jobseekers only)
        if (response.payment_required === true && userType === "jobseeker") {
          console.log(
            "💳 Payment required for jobseeker, redirecting to payment screen",
          );
          router.replace("/payment");
        } else {
          // Navigate to jobseeker home (since this is jobseeker signup only)
          console.log("✅ No payment required, navigating to jobseeker home");
          router.replace("/jobseeker/home");
        }
      } else {
        console.log("response", response);
        // Handle validation errors from server - display exact errors from API
        if (
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
        ) {
          setSignupError(response.errors.join("\n"));
        } else if (response.message) {
          setSignupError(response.message);
        } else {
          setSignupError("Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      setSignupError(
        "Network error. Please check your internet connection and try again.",
      );
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to jobseeker home
    router.push("/jobseeker/home");
  };

  // Verification handler (called when verification succeeds)
  const handleVerificationSuccess = (userData) => {
    console.log("✅ Verification successful, user data received:", userData);
    // The VerificationModal component handles navigation automatically
  };

  // Close verification modal handler
  const handleCloseVerification = () => {
    setShowVerificationModal(false);
    // Optionally navigate back or show a message
  };

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
          {/* Success Icon with Logo */}
          <View
            style={{
              alignItems: "center",
              marginBottom: theme.spacing.lg,
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
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons
                name="checkmark"
                size={40}
                color={theme.colors.neutral.white}
              />
            </View>

            {/* Logo */}
            <Image
              source={require("@/assets/images/company/logo.png")}
              style={{
                width: 36,
                height: 36,
              }}
              resizeMode="contain"
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
            Welcome to Manvue!
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
            Your account has been created successfully. You can now start
            exploring amazing career opportunities.
          </Text>

          <TouchableOpacity
            onPress={handleSuccessModalClose}
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
                Get Started
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaWrapper backgroundColor={theme.colors.background.primary}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.primary}
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
        locations={[0, 0.3, 1]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
            backgroundColor: theme.colors.background.card,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: theme.spacing.sm,
              marginRight: theme.spacing.md,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require("@/assets/images/company/logo.png")}
            style={{
              width: 32,
              height: 32,
              marginRight: theme.spacing.md,
            }}
            resizeMode="contain"
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
            >
              Job Seeker Registration
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xxxl, // Extra bottom padding
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Jobseeker Registration Form */}
          {userType && (
            <View>
              {/* Personal Information */}
              <Text
                style={{
                  fontSize: theme.typography.sizes.md,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.lg,
                }}
              >
                Personal Information
              </Text>

              <View style={{ flex: 1 }}>
                <CustomInput
                  label="First Name"
                  value={formData.first_name}
                  onChangeText={(value) =>
                    handleInputChange("first_name", value)
                  }
                  placeholder="Enter first name"
                  icon="person-outline"
                  error={errors.first_name}
                  required
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Last Name"
                  value={formData.last_name}
                  onChangeText={(value) =>
                    handleInputChange("last_name", value)
                  }
                  placeholder="Enter last name"
                  icon="person-outline"
                  error={errors.last_name}
                  required
                />
              </View>

              <CustomVerifyInput
                label="Email Address"
                value={formData.email}
                verified={formData.email_verified}
                onChangeText={(value) => handleInputChange("email", value)}
                onVerifiedChange={(val) =>
                  handleInputChange("email_verified", val)
                }
                placeholder="Enter your email address"
                icon="mail-outline"
                required
                type="email"
                error={errors.email}
              />

              <CustomVerifyInput
                label="Mobile Number"
                value={formData.phone}
                verified={formData.phone_verified}
                onChangeText={(value) => handleInputChange("phone", value)}
                onVerifiedChange={(val) =>
                  handleInputChange("phone_verified", val)
                }
                placeholder="Enter phone number"
                icon="call-outline"
                type="phone"
                required
                error={errors.phone}
              />

              <CustomInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Enter password (min 6 characters)"
                icon="lock-closed-outline"
                secureTextEntry
                error={errors.password}
                required
              />

              <CustomInput
                label="Confirm Password"
                value={formData.confirm_password}
                onChangeText={(value) =>
                  handleInputChange("confirm_password", value)
                }
                placeholder="Re-enter password"
                icon="lock-closed-outline"
                secureTextEntry
                error={errors.confirm_password}
                required
              />

              <CustomDropdown
                label="Gender"
                value={formData.gender}
                onSelect={(value) => handleInputChange("gender", value)}
                options={genderOptions}
                placeholder="Choose option"
                icon="person-outline"
                error={errors.gender}
              />
              {/* Date of Birth Picker */}
              <CustomDatePicker
                label="Date of Birth"
                value={formData.date_of_birth}
                onChange={(date) => handleInputChange("date_of_birth", date)}
                placeholder="YYYY-MM-DD (eg: 1990-12-31)"
                icon="calendar-outline"
                error={errors.date_of_birth}
              />

              <CustomDropdown3
                label="State"
                value={selectedStateId}
                onSelect={handleStateSelect}
                options={states}
                placeholder="Select your state"
                icon="location-outline"
                required
                searchable
                searchPlaceholder="Search states..."
                emptyMessage="No states available"
                emptySearchMessage="No states match your search"
                error={errors.location_state}
                showCheckmark={true}
                highlightSelected={true}
              />
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="City"
                  value={formData.location_city}
                  onChangeText={(value) =>
                    handleInputChange("location_city", value)
                  }
                  placeholder="Enter your city"
                  icon="location-outline"
                  error={errors.location_city}
                  required
                />
              </View>

              {/* Profile Image Section */}
              {/* <View style={{ marginBottom: theme.spacing.lg }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Profile Picture (Optional)
                </Text>
                <TouchableOpacity
                  onPress={pickProfileImage}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.background.card,
                    borderWidth: 1.5,
                    borderColor: theme.colors.border.light,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                  }}
                  activeOpacity={0.7}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage.uri }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        marginRight: theme.spacing.md,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: theme.colors.neutral.lightGray,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: theme.spacing.md,
                      }}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color={theme.colors.text.tertiary}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {profileImage ? "Change Photo" : "Add Profile Photo"}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.tertiary,
                      }}
                    >
                      {profileImage
                        ? profileImage.fileName || "Image selected"
                        : "Tap to select from camera or gallery"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View> */}

              {/* Job Seeker-specific Fields */}
              {userType === "jobseeker" && (
                <>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.md,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginTop: theme.spacing.xl,
                      marginBottom: theme.spacing.lg,
                    }}
                  >
                    Professional Information
                  </Text>

                  <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <CustomInput
                        label="Experience (Years)"
                        value={formData.experience_years.toString()}
                        onChangeText={(value) =>
                          handleInputChange(
                            "experience_years",
                            parseInt(value) || 0,
                          )
                        }
                        placeholder="0"
                        icon="time-outline"
                        keyboardType="number-pad"
                        error={errors.experience_years}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomInput
                        label="Experience (Months)"
                        value={formData.experience_months.toString()}
                        onChangeText={(value) =>
                          handleInputChange(
                            "experience_months",
                            parseInt(value) || 0,
                          )
                        }
                        placeholder="0"
                        icon="time-outline"
                        keyboardType="number-pad"
                        error={errors.experience_months}
                      />
                    </View>
                  </View>

                  <CustomInput
                    label="Current Salary (Annual)"
                    value={formData.current_salary}
                    onChangeText={(value) =>
                      handleInputChange("current_salary", value)
                    }
                    placeholder="eg: 500000 (in INR, Optional)"
                    icon="cash-outline"
                    keyboardType="numeric"
                    error={errors.current_salary}
                  />

                  <CustomInput
                    label="Expected Salary (Annual)"
                    value={formData.expected_salary}
                    onChangeText={(value) =>
                      handleInputChange("expected_salary", value)
                    }
                    placeholder="eg: 600000 (in INR)"
                    icon="cash-outline"
                    keyboardType="numeric"
                    error={errors.expected_salary}
                  />

                  <CustomDropdown
                    label="Notice Period"
                    value={formData.notice_period}
                    onSelect={(value) =>
                      handleInputChange("notice_period", value)
                    }
                    options={noticePeriodOptions}
                    placeholder="Choose option"
                    icon="calendar-outline"
                    error={errors.notice_period}
                  />

                  <>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.md,
                        fontFamily: theme.typography.fonts.semiBold,
                        color: theme.colors.text.primary,
                        marginTop: theme.spacing.xl,
                        marginBottom: theme.spacing.lg,
                      }}
                    >
                      Preferences
                    </Text>

                    <CustomDropdown
                      label="Job Type Preference"
                      value={
                        Array.isArray(formData.job_type_preference)
                          ? formData.job_type_preference[0]
                          : formData.job_type_preference
                      }
                      onSelect={(value) => {
                        const currentValues = Array.isArray(
                          formData.job_type_preference,
                        )
                          ? formData.job_type_preference
                          : [formData.job_type_preference].filter(Boolean);
                        const newValues = currentValues.includes(value)
                          ? currentValues
                          : [...currentValues, value];
                        handleInputChange(
                          "job_type_preference",
                          newValues.slice(0, 3),
                        ); // Max 3 selections
                      }}
                      options={jobTypeOptions}
                      placeholder="Choose option"
                      icon="briefcase-outline"
                      error={errors.job_type_preference}
                      required
                    />

                    <CustomDropdown
                      label="Work Mode Preference"
                      value={
                        Array.isArray(formData.work_mode_preference)
                          ? formData.work_mode_preference[0]
                          : formData.work_mode_preference
                      }
                      onSelect={(value) => {
                        const currentValues = Array.isArray(
                          formData.work_mode_preference,
                        )
                          ? formData.work_mode_preference
                          : [formData.work_mode_preference].filter(Boolean);
                        const newValues = currentValues.includes(value)
                          ? currentValues
                          : [...currentValues, value];
                        handleInputChange(
                          "work_mode_preference",
                          newValues.slice(0, 3),
                        ); // Max 3 selections
                      }}
                      options={workModeOptions}
                      placeholder="Choose option"
                      icon="home-outline"
                      error={errors.work_mode_preference}
                      required
                    />

                    <CustomDropdown
                      label="Availability Status"
                      value={formData.availability_status}
                      onSelect={(value) =>
                        handleInputChange("availability_status", value)
                      }
                      options={availabilityOptions}
                      placeholder="Choose option"
                      icon="checkmark-circle-outline"
                      error={errors.availability_status}
                      required
                    />

                    <CustomDropdown
                      label="Profile Visibility"
                      value={formData.profile_visibility}
                      onSelect={(value) =>
                        handleInputChange("profile_visibility", value)
                      }
                      options={profileVisibilityOptions}
                      placeholder="Choose option"
                      icon="eye-outline"
                      error={errors.profile_visibility}
                      required
                    />
                  </>

                  {/* Professional URLs Section */}
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.md,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginTop: theme.spacing.xl,
                      marginBottom: theme.spacing.lg,
                    }}
                  >
                    Professional Links (Optional)
                  </Text>

                  <CustomInput
                    label="LinkedIn URL"
                    value={formData.linkedin_url}
                    onChangeText={(value) =>
                      handleInputChange("linkedin_url", value)
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                    icon="logo-linkedin"
                    keyboardType="url"
                    autoCapitalize="none"
                    error={errors.linkedin_url}
                  />

                  <CustomInput
                    label="GitHub URL"
                    value={formData.github_url}
                    onChangeText={(value) =>
                      handleInputChange("github_url", value)
                    }
                    placeholder="https://github.com/yourusername"
                    icon="logo-github"
                    keyboardType="url"
                    autoCapitalize="none"
                    error={errors.github_url}
                  />

                  <CustomInput
                    label="Portfolio URL"
                    value={formData.portfolio_url}
                    onChangeText={(value) =>
                      handleInputChange("portfolio_url", value)
                    }
                    placeholder="https://yourportfolio.com"
                    icon="globe-outline"
                    keyboardType="url"
                    autoCapitalize="none"
                    error={errors.portfolio_url}
                  />

                  {/* Skills Section for Job Seekers */}
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.md,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginTop: theme.spacing.xl,
                      marginBottom: theme.spacing.lg,
                    }}
                  >
                    Skills & Expertise
                  </Text>

                  <SkillsInputAI
                    skills={skills}
                    onSkillsChange={handleSkillsChange}
                    label="Skills & Expertise"
                    required={true}
                    error={errors.skills}
                    maxSkills={20}
                    maxSkillLength={50}
                    contextType="jobseeker"
                  />
                </>
              )}

              {/* Bio Section */}
              <Text
                style={{
                  fontSize: theme.typography.sizes.md,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginTop: theme.spacing.xl,
                  marginBottom: theme.spacing.lg,
                }}
              >
                About You
              </Text>

              <CustomInput
                label="Bio"
                value={formData.bio}
                onChangeText={(value) => handleInputChange("bio", value)}
                placeholder="Tell us about yourself... (Optional)"
                icon="person-outline"
                multiline
                numberOfLines={3}
                error={errors.bio}
              />
              <CustomInput
                required
                label="Full Address"
                value={formData.full_address}
                onChangeText={(value) =>
                  handleInputChange("full_address", value)
                }
                placeholder="Full address"
                icon="home-outline"
                multiline
                numberOfLines={2}
                error={errors.full_address}
              />
              {/* Signup Error Message */}
              {signupError ? (
                <View
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.lg,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.status.error,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.status.error,
                      textAlign: "center",
                    }}
                  >
                    {signupError}
                  </Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  marginTop: theme.spacing.xl,
                  marginBottom: theme.spacing.xl,
                  overflow: "hidden",
                  opacity: isLoading ? 0.7 : 1,
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[
                    theme.colors.primary.teal,
                    theme.colors.secondary.darkTeal,
                  ]}
                  style={{
                    paddingVertical: theme.spacing.lg,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.neutral.white}
                    />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.md,
                          fontFamily: theme.typography.fonts.semiBold,
                          color: theme.colors.neutral.white,
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        Create Account
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.neutral.white}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Verification Modal - New Separate Component */}
      <VerificationModal
        visible={showVerificationModal}
        email={signupEmail}
        userType={userType}
        onVerified={handleVerificationSuccess}
        onClose={handleCloseVerification}
      />

      {/* Success Modal */}
      <SuccessModal />
    </SafeAreaWrapper>
  );
}
