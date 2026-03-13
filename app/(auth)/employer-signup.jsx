import CustomDropdown from "@/components/CustomDropdown";
import CustomDropdown3 from "@/components/CustomDropdown3";
import CustomInput from "@/components/CustomInput";
import CustomVerifyInput from "@/components/CustomVerifyInput";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import notificationService from "@/services/notificationService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
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

export default function EmployerSignup() {
  // Form State
  const [formData, setFormData] = useState({
    // Contact Person Info
    first_name: "",
    last_name: "",
    phone: "",
    gender: "",

    // Company Info
    company_name: "",
    full_address: "",
    city: "",
    state: "",
    gst_number: "",
    industry: "",
    company_website: "",
    company_size: "",
    company_type: "",
    founded_year: "",
    company_description: "",
    email_verified: false,
    phone_verified: false,
    // Login Credentials
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);

  const isMounted = useRef(true);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 3. ADD useEffect TO LOAD STATES ON MOUNT
  useEffect(() => {
    loadStates();
  }, []);

  // 4. ADD THESE FUNCTIONS (after the existing useEffect)
  const loadStates = async () => {
    try {
      const response = await apiService.getStates();
      if (response.success && response.data) {
        setStates(response.data);
        console.log("✅ States loaded:", response.count);
      } else {
        console.log("❌ Failed to load states:", response.message);
        setStates([]);
      }
    } catch (error) {
      console.log("❌ Error loading states:", error);
      setStates([]);
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
    } finally {
      setLoadingCities(false);
    }
  };

  const handleStateSelect = (stateId) => {
    setSelectedStateId(stateId);

    // Find state name from states array
    const selectedState = states.find((s) => s.value === stateId);
    if (selectedState) {
      updateFormData("state", selectedState.label);
    }

    // Reset city when state changes
    updateFormData("city", "");
    setCities([]);

    // Clear any existing city error
    if (errors.city) {
      setErrors((prev) => ({
        ...prev,
        city: null,
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

  // Update form data
  const updateFormData = (field, value, index = null, listType = null) => {
    if (listType && index !== null) {
      setFormData((prev) => {
        const updatedList = [...prev[listType]];
        updatedList[index][field] = value;
        return {
          ...prev,
          [listType]: updatedList,
        };
      });

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
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: null,
        }));
      }
    }

    if (signupError) {
      setSignupError("");
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Contact person validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.email_verified) {
      newErrors.email_verified = "Email must be verified";
    }

    if (!formData.phone_verified) {
      newErrors.phone_verified = "Phone number must be verified";
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }

    if (!formData.gst_number.trim()) {
      newErrors.gst_number = "GST number is required";
    } else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.gst_number
      )
    ) {
      newErrors.gst_number = "Please enter a valid GST number";
    }

    if (!formData.industry) {
      newErrors.industry = "Industry is required";
    }

    const urlRegex =
      /^(www\.)?[a-zA-Z0-9-]{1,256}\.[a-zA-Z]{2,6}([-a-zA-Z0-9()@:%_+.~#?&//=]*)?$/;

    if (formData.company_website && !urlRegex.test(formData.company_website)) {
      newErrors.company_website = "Invalid website URL";
    }

    if (
      formData.founded_year &&
      (formData.founded_year < 1800 ||
        formData.founded_year > new Date().getFullYear())
    ) {
      newErrors.founded_year = "Invalid founded year";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms) {
      newErrors.terms = "You must accept the Terms and Conditions";
    }

    setErrors(newErrors);

    // Scroll to first error
    if (Object.keys(newErrors).length > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsRegistering(true);
    setSignupError("");

    try {
      // Get device token for push notifications
      const deviceToken = await notificationService.getDeviceToken();

      const response = await apiService.employerSignup({
        // Contact Person
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        gender: formData.gender || "",
        email_verified: formData.email_verified ? 1 : 0,
        phone_verified: formData.phone_verified ? 1 : 0,

        // Company Info
        company_name: formData.company_name,
        full_address: formData.full_address || "",
        city: formData.city,
        state: formData.state,
        gst_number: formData.gst_number,
        industry: formData.industry,
        company_website: formData.company_website || "",
        company_size: formData.company_size || "",
        company_type: formData.company_type || "",
        founded_year: formData.founded_year
          ? parseInt(formData.founded_year)
          : 0,
        company_description: formData.company_description || "",

        // Login Credentials
        email: formData.email,
        password: formData.password,

        // Device Token
        device_token: deviceToken,
      });

      if (response.success && response.data) {
        router.replace("/employer/home");
      } else {
        // Handle backend validation errors
        if (
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
        ) {
          setSignupError(response.errors.join("\n"));
        } else if (response.message) {
          setSignupError(response.message);
        } else {
          setSignupError("Registration failed. Please try again.");
        }

        // Scroll to top to show error
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch (error) {
      console.error("❌ Unexpected registration error:", error);

      // Handle network errors
      if (error.message?.includes("Network")) {
        setSignupError(
          "Network error. Please check your internet connection and try again."
        );
      } else if (error.message?.includes("timeout")) {
        setSignupError("Request timeout. Please try again.");
      } else {
        setSignupError("An unexpected error occurred. Please try again later.");
      }

      // Scroll to top to show error
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      if (isMounted.current) {
        setIsRegistering(false);
      }
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <SafeAreaWrapper backgroundColor={theme.colors.background.primary}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background.primary}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          "rgba(30, 74, 114, 0.08)",
          "rgba(30, 74, 114, 0.02)",
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
              Company Registration
            </Text>
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
              }}
            >
              Register your company to hire talent
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Signup Error Message - At Top */}
          {signupError ? (
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
                }}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.status.error}
                  style={{ marginRight: theme.spacing.sm, marginTop: 2 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.status.error,
                    lineHeight: theme.typography.sizes.sm * 1.4,
                  }}
                >
                  {signupError}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Contact Person Information */}
          <Text
            style={{
              fontSize: theme.typography.sizes.md,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.lg,
            }}
          >
            Contact Person Information
          </Text>

          <View style={{ flex: 1 }}>
            <CustomInput
              label="First Name"
              value={formData.first_name}
              onChangeText={(value) => updateFormData("first_name", value)}
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
              onChangeText={(value) => updateFormData("last_name", value)}
              placeholder="Enter last name"
              icon="person-outline"
              error={errors.last_name}
              required
            />
          </View>

          <CustomVerifyInput
            userType="employer"
            label="Mobile Number"
            required
            value={formData.phone}
            verified={formData.phone_verified}
            onChangeText={(value) => updateFormData("phone", value)}
            onVerifiedChange={(val) => updateFormData("phone_verified", val)}
            placeholder="Enter phone number"
            icon="call-outline"
            type="phone"
            error={errors.phone || errors.phone_verified}
          />

          <CustomDropdown
            label="Gender"
            value={formData.gender}
            onSelect={(value) => updateFormData("gender", value)}
            options={genderOptions}
            placeholder="Select gender (optional)"
            icon="person-outline"
            error={errors.gender}
          />

          {/* Company Information Section */}
          <Text
            style={{
              fontSize: theme.typography.sizes.md,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              marginTop: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
            }}
          >
            Company Information
          </Text>

          <CustomInput
            label="Company Name"
            value={formData.company_name}
            onChangeText={(value) => updateFormData("company_name", value)}
            placeholder="Enter your company name"
            icon="business-outline"
            error={errors.company_name}
            required
          />

          <CustomInput
            label="GST Number"
            value={formData.gst_number}
            onChangeText={(value) =>
              updateFormData("gst_number", value.toUpperCase())
            }
            placeholder="Enter GST number (eg: 22AAAAA0000A1Z5)"
            icon="document-text-outline"
            maxLength={15}
            error={errors.gst_number}
            required
          />

          <CustomDropdown
            label="Industry"
            value={formData.industry}
            onSelect={(value) => updateFormData("industry", value)}
            options={industryOptions}
            placeholder="Select industry"
            icon="business-outline"
            error={errors.industry}
            required
          />

          <CustomInput
            label="Company Website"
            value={formData.company_website}
            onChangeText={(value) => updateFormData("company_website", value)}
            placeholder="www.example.com (Optional)"
            icon="globe-outline"
            keyboardType="url"
            autoCapitalize="none"
            error={errors.company_website}
          />

          <CustomDropdown
            label="Company Size"
            value={formData.company_size}
            onSelect={(value) => updateFormData("company_size", value)}
            options={companySizeOptions}
            placeholder="Select company size (optional)"
            icon="people-outline"
            error={errors.company_size}
          />

          <CustomDropdown
            label="Company Type"
            value={formData.company_type}
            onSelect={(value) => updateFormData("company_type", value)}
            options={companyTypeOptions}
            placeholder="Select company type (optional)"
            icon="business-outline"
            error={errors.company_type}
          />

          <View style={{ flex: 1 }}>
            <CustomInput
              label="Founded Year"
              value={formData.founded_year?.toString() || ""}
              onChangeText={(value) => updateFormData("founded_year", value)}
              placeholder="eg: 2020"
              icon="calendar-outline"
              keyboardType="number-pad"
              maxLength={4}
              error={errors.founded_year}
            />
          </View>

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
            error={errors.state}
            showCheckmark={true}
            highlightSelected={true}
          />

          <CustomInput
            label="City"
            value={formData.city}
            onChangeText={(value) => updateFormData("city", value)}
            placeholder="Enter your city"
            icon="location-outline"
            error={errors.city}
            required
          />

          <CustomInput
            label="Full Address"
            value={formData.full_address}
            onChangeText={(value) => updateFormData("full_address", value)}
            placeholder="Complete company address (Optional)"
            icon="home-outline"
            multiline
            numberOfLines={2}
            error={errors.full_address}
          />

          <CustomInput
            label="Company Description"
            value={formData.company_description}
            onChangeText={(value) =>
              updateFormData("company_description", value)
            }
            placeholder="Brief description about your company (Optional)"
            icon="document-text-outline"
            multiline
            numberOfLines={3}
            error={errors.company_description}
          />

          {/* Login Credentials Section */}
          <Text
            style={{
              fontSize: theme.typography.sizes.md,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              marginTop: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
            }}
          >
            Login Credentials
          </Text>

          <CustomVerifyInput
            userType="employer"
            label="Email Address"
            value={formData.email}
            required
            verified={formData.email_verified}
            onChangeText={(value) => updateFormData("email", value)}
            onVerifiedChange={(val) => updateFormData("email_verified", val)}
            placeholder="Enter your email address"
            icon="mail-outline"
            type="email"
            error={errors.email || errors.email_verified}
          />

          <CustomInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateFormData("password", value)}
            placeholder="Create a password (min 6 characters)"
            icon="lock-closed-outline"
            secureTextEntry
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            error={errors.password}
            required
          />

          <CustomInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData("confirmPassword", value)}
            placeholder="Re-enter your password"
            icon="lock-closed-outline"
            secureTextEntry
            showPassword={showConfirmPassword}
            onTogglePassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            error={errors.confirmPassword}
            required
          />

          {/* Terms and Conditions */}
          <View
            style={{
              marginTop: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setAcceptedTerms(!acceptedTerms);
                if (errors.terms) {
                  setErrors((prev) => ({ ...prev, terms: "" }));
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingVertical: theme.spacing.sm,
              }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: acceptedTerms
                    ? theme.colors.primary.deepBlue
                    : theme.colors.border.medium,
                  backgroundColor: acceptedTerms
                    ? theme.colors.primary.deepBlue
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: theme.spacing.sm,
                  marginTop: 2,
                }}
              >
                {acceptedTerms && (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={theme.colors.neutral.white}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    lineHeight: theme.typography.sizes.sm * 1.4,
                  }}
                >
                  I accept the{" "}
                  <Text
                    style={{
                      color: theme.colors.primary.deepBlue,
                      fontFamily: theme.typography.fonts.semiBold,
                      textDecorationLine: "underline",
                    }}
                  >
                    Terms and Conditions
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={{
                      color: theme.colors.primary.deepBlue,
                      fontFamily: theme.typography.fonts.semiBold,
                      textDecorationLine: "underline",
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>

            {errors.terms && (
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.status.error,
                  marginTop: theme.spacing.xs,
                  marginLeft: theme.spacing.lg,
                }}
              >
                {errors.terms}
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isRegistering}
            style={{
              borderRadius: theme.borderRadius.lg,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.xl,
              overflow: "hidden",
              opacity: isRegistering ? 0.7 : 1,
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[
                theme.colors.primary.deepBlue,
                theme.colors.secondary.darkBlue,
              ]}
              style={{
                paddingVertical: theme.spacing.lg,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              {isRegistering ? (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: theme.colors.neutral.white,
                    borderTopColor: "transparent",
                    marginRight: theme.spacing.sm,
                  }}
                />
              ) : (
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={theme.colors.neutral.white}
                  style={{ marginRight: theme.spacing.sm }}
                />
              )}
              <Text
                style={{
                  fontSize: theme.typography.sizes.md,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.neutral.white,
                }}
              >
                {isRegistering ? "Registering..." : "Register Company"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: theme.spacing.md,
              marginBottom: theme.spacing.xl,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.tertiary,
              }}
            >
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/employer-login")}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.primary.deepBlue,
                }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
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
              Registration Successful!
            </Text>

            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: "center",
                marginBottom: theme.spacing.lg,
                lineHeight: theme.typography.sizes.base * 1.5,
              }}
            >
              Welcome! Your account has been created successfully. You can now
              start posting jobs and hiring talent.
            </Text>

            {/* <TouchableOpacity
              onPress={handleSuccess}
              style={{
                width: "100%",
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[
                  theme.colors.primary.deepBlue,
                  theme.colors.secondary.darkBlue,
                ]}
                style={{
                  paddingVertical: theme.spacing.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={"home-outline"}
                  size={20}
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
                  Go to Dashboard
                </Text>
              </LinearGradient>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
