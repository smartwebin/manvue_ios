import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Load contact info on mount
  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      setLoadingInfo(true);
      const response = await apiService.getContactInfo();
      
      if (response.success) {
        setContactInfo(response.data);
      } else {
        console.log("Failed to load contact info:", response.message);
      }
    } catch (error) {
      console.log("Error loading contact info:", error);
    } finally {
      setLoadingInfo(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fname.trim()) {
      newErrors.fname = "First name is required";
    }

    if (!formData.lname.trim()) {
      newErrors.lname = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.submitContactForm(formData);

      if (response.success) {
        Alert.alert(
          "Success!",
          "Thank you for contacting us. We will get back to you soon.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear form
                setFormData({
                  fname: "",
                  lname: "",
                  email: "",
                  phone: "",
                  message: "",
                });
                setErrors({});
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to send message. Please try again."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Handle email press
  const handleEmailPress = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  // Handle phone press
  const handlePhonePress = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Handle website press
  const handleWebsitePress = (url) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(formattedUrl);
    }
  };

  // Render input field (implementation truncated for brevity - same as before)
  const renderInput = (field, label, placeholder, icon, multiline = false) => {
    const isFocused = focusedField === field;
    const hasError = errors[field];

    return (
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: theme.typography.sizes.sm, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.text.primary, marginBottom: theme.spacing.xs }}>
          {label} <Text style={{ color: theme.colors.status.error }}>*</Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, borderWidth: 2, borderColor: hasError ? theme.colors.border.error : isFocused ? theme.colors.border.focus : theme.colors.border.light, paddingHorizontal: theme.spacing.md, paddingVertical: multiline ? theme.spacing.md : 0 }}>
          <Ionicons name={icon} size={20} color={hasError ? theme.colors.status.error : isFocused ? theme.colors.primary.teal : theme.colors.text.tertiary} style={{ marginRight: theme.spacing.sm, marginTop: multiline ? theme.spacing.xs : 0 }} />
          <TextInput value={formData[field]} onChangeText={(value) => handleChange(field, value)} placeholder={placeholder} placeholderTextColor={theme.colors.text.placeholder} onFocus={() => setFocusedField(field)} onBlur={() => setFocusedField(null)} multiline={multiline} numberOfLines={multiline ? 4 : 1} textAlignVertical={multiline ? "top" : "center"} keyboardType={field === "email" ? "email-address" : field === "phone" ? "phone-pad" : "default"} style={{ flex: 1, fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.regular, color: theme.colors.text.primary, paddingVertical: multiline ? 0 : theme.spacing.md, minHeight: multiline ? 100 : 50 }} />
        </View>
        {hasError && <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.regular, color: theme.colors.status.error, marginTop: theme.spacing.xs }}>{hasError}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
          <LinearGradient colors={[theme.colors.background.accent, "rgba(27, 163, 163, 0.02)", theme.colors.background.primary]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} locations={[0, 0.3, 1]} />
          
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.md, backgroundColor: theme.colors.background.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: theme.spacing.xs, marginRight: theme.spacing.md }} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: theme.typography.sizes.xl, fontFamily: theme.typography.fonts.bold, color: theme.colors.text.primary }}>Contact Us</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}>
            <View style={{ marginBottom: theme.spacing.xl }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary.teal + "20", justifyContent: "center", alignItems: "center", marginBottom: theme.spacing.md }}>
                <Ionicons name="mail-outline" size={32} color={theme.colors.primary.teal} />
              </View>
              <Text style={{ fontSize: theme.typography.sizes.xxl, fontFamily: theme.typography.fonts.bold, color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>Get in Touch</Text>
              <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.regular, color: theme.colors.text.secondary, lineHeight: theme.typography.sizes.base * 1.5 }}>Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.</Text>
            </View>

            <View style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.xl, ...theme.shadows.md }}>
              <View style={{ flexDirection: "row", gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                <View style={{ flex: 1 }}>{renderInput("fname", "First Name", "John", "person-outline")}</View>
                <View style={{ flex: 1 }}>{renderInput("lname", "Last Name", "Doe", "person-outline")}</View>
              </View>
              {renderInput("email", "Email", "john@example.com", "mail-outline")}
              {renderInput("phone", "Phone", "+1 234 567 8900", "call-outline")}
              {renderInput("message", "Message", "Tell us how we can help you...", "chatbubble-outline", true)}
              
              <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ borderRadius: theme.borderRadius.lg, overflow: "hidden", marginTop: theme.spacing.md }} activeOpacity={0.8}>
                <LinearGradient colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]} style={{ paddingVertical: theme.spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm }}>
                  {loading ? <ActivityIndicator color={theme.colors.neutral.white} /> : (<><Text style={{ fontSize: theme.typography.sizes.md, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.neutral.white }}>Send Message</Text><Ionicons name="send" size={20} color={theme.colors.neutral.white} /></>)}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {loadingInfo ? (
              <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
                <ActivityIndicator size="large" color={theme.colors.primary.teal} />
                <Text style={{ marginTop: theme.spacing.md, fontSize: theme.typography.sizes.sm, color: theme.colors.text.secondary }}>Loading contact information...</Text>
              </View>
            ) : contactInfo ? (
              <>
                <View style={{ gap: theme.spacing.md }}>
                  {contactInfo.email && (
                    <TouchableOpacity onPress={() => handleEmailPress(contactInfo.email)} activeOpacity={0.7} style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.orange + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="mail" size={20} color={theme.colors.primary.orange} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 2 }}>Email Address</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.primary.teal, textDecorationLine: "underline" }}>{contactInfo.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  )}

                  {contactInfo.phone && (
                    <TouchableOpacity onPress={() => handlePhonePress(contactInfo.phone)} activeOpacity={0.7} style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.deepBlue + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="call" size={20} color={theme.colors.primary.deepBlue} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 2 }}>Telephone</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.primary.teal, textDecorationLine: "underline" }}>{contactInfo.phone}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  )}

                  {contactInfo.mobile && (
                    <TouchableOpacity onPress={() => handlePhonePress(contactInfo.mobile)} activeOpacity={0.7} style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.teal + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="phone-portrait" size={20} color={theme.colors.primary.teal} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 2 }}>Hand Phone</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.primary.teal, textDecorationLine: "underline" }}>{contactInfo.mobile}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  )}

                  {contactInfo.address && (
                    <View style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.orange + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="location" size={20} color={theme.colors.primary.orange} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 4 }}>Address</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.text.primary, lineHeight: theme.typography.sizes.base * 1.5 }}>{contactInfo.address}</Text>
                      </View>
                    </View>
                  )}

                  {contactInfo.website && (
                    <TouchableOpacity onPress={() => handleWebsitePress(contactInfo.website)} activeOpacity={0.7} style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.deepBlue + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="globe" size={20} color={theme.colors.primary.deepBlue} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 2 }}>Web Page</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.primary.teal, textDecorationLine: "underline" }}>{contactInfo.website}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  )}

                  {contactInfo.company_name && (
                    <View style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.teal + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="business" size={20} color={theme.colors.primary.teal} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 2 }}>Company Name</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.text.primary }}>{contactInfo.company_name}</Text>
                      </View>
                    </View>
                  )}

                  {/* {contactInfo.duns_number && (
                    <View style={{ backgroundColor: theme.colors.background.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.light }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary.orange + "20", justifyContent: "center", alignItems: "center", marginRight: theme.spacing.md }}>
                        <Ionicons name="card" size={20} color={theme.colors.primary.orange} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.typography.sizes.xs, fontFamily: theme.typography.fonts.medium, color: theme.colors.text.tertiary, marginBottom: 2 }}>D&B D-U-N-S</Text>
                        <Text style={{ fontSize: theme.typography.sizes.base, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.text.primary }}>{contactInfo.duns_number}</Text>
                      </View>
                    </View>
                  )} */}
                </View>

                {contactInfo.business_hours && (
                  <View style={{ backgroundColor: theme.colors.background.accent, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, marginTop: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.primary.teal + "30" }}>
                    <Text style={{ fontSize: theme.typography.sizes.md, fontFamily: theme.typography.fonts.semiBold, color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>Business Hours</Text>
                    <Text style={{ fontSize: theme.typography.sizes.sm, fontFamily: theme.typography.fonts.regular, color: theme.colors.text.secondary, lineHeight: theme.typography.sizes.sm * 1.6 }}>{contactInfo.business_hours}</Text>
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}