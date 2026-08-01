import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const JobApplicationModal = ({
  visible,
  onClose,
  coverLetter,
  setCoverLetter,
  expectedSalary,
  setExpectedSalary,
  availabilityDate,
  setAvailabilityDate,
  submitting,
  onSubmit,
}) => {
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr !== 'string') return new Date(dateStr);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) return new Date(parts[2], parts[1] - 1, parts[0]);
      if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDateToDDMMYYYY = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(availabilityDate ? parseDateString(availabilityDate) : new Date());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        const formattedDate = formatDateToDDMMYYYY(selectedDate);
        setAvailabilityDate(formattedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    setShowDatePicker(false);
    if (tempDate) {
      const formattedDate = formatDateToDDMMYYYY(tempDate);
      setAvailabilityDate(formattedDate);
    }
  };

  const getDateObject = () => parseDateString(availabilityDate);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={-20}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderTopLeftRadius: theme.borderRadius.xxl,
              borderTopRightRadius: theme.borderRadius.xxl,
              paddingTop: theme.spacing.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: keyboardVisible ? theme.spacing.sm : insets.bottom + theme.spacing.xxl,
              maxHeight: "95%",
              width: "100%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: theme.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xl,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.text.primary,
                }}
              >
                Apply for Position
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={theme.colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: keyboardVisible ? 20 : insets.bottom + 40 }}
            >
              {/* Cover Letter */}
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Cover Letter *
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.colors.neutral.lightGray,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.md,
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.primary,
                  borderWidth: 1,
                  borderColor: theme.colors.border.light,
                  marginBottom: theme.spacing.md,
                  minHeight: 120,
                  textAlignVertical: "top",
                }}
                placeholder="Tell us why you're a great fit for this role..."
                placeholderTextColor={theme.colors.text.placeholder}
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                numberOfLines={6}
              />

              {/* Expected Salary */}
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Expected Salary (Optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.colors.neutral.lightGray,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.md,
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.primary,
                  borderWidth: 1,
                  borderColor: theme.colors.border.light,
                  marginBottom: theme.spacing.md,
                }}
                placeholder="e.g., 50000"
                placeholderTextColor={theme.colors.text.placeholder}
                value={expectedSalary}
                onChangeText={setExpectedSalary}
                keyboardType="numeric"
              />

              {/* Availability Date */}
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Available From (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTempDate(availabilityDate ? parseDateString(availabilityDate) : new Date());
                  setShowDatePicker(true);
                }}
                style={{
                  backgroundColor: theme.colors.neutral.lightGray,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border.light,
                  marginBottom: theme.spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.regular,
                    color: availabilityDate
                      ? theme.colors.text.primary
                      : theme.colors.text.placeholder,
                  }}
                >
                  {availabilityDate ? formatDateToDDMMYYYY(getDateObject()) : "DD-MM-YYYY"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.primary.teal}
                />
              </TouchableOpacity>

              {Platform.OS === 'ios' ? (
                <Modal visible={showDatePicker} transparent={true} animationType="slide">
                  <TouchableOpacity 
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }} 
                    activeOpacity={1} 
                    onPress={() => setShowDatePicker(false)}
                  >
                    <TouchableOpacity activeOpacity={1} style={{ backgroundColor: theme.colors.background.card, paddingBottom: 30 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border.light }}>
                        <TouchableOpacity onPress={confirmIOSDate}>
                          <Text style={{ color: theme.colors.primary.teal, fontFamily: theme.typography.fonts.bold, fontSize: theme.typography.sizes.md }}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        themeVariant="light"
                        textColor={theme.colors.text.primary}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              ) : (
                showDatePicker && (
                  <DateTimePicker
                    value={getDateObject()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={{
                  borderRadius: theme.borderRadius.lg,
                  overflow: "hidden",
                }}
                onPress={onSubmit}
                disabled={submitting}
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
                  {submitting ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.neutral.white}
                    />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.md,
                          fontFamily: theme.typography.fonts.bold,
                          color: theme.colors.neutral.white,
                          marginRight: theme.spacing.xs,
                        }}
                      >
                        Submit Application
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
            </ScrollView>
          </View>
          {/* Bottom extension to cover any gap */}
          {/* {!keyboardVisible && (
            <View
              style={{
                backgroundColor: theme.colors.background.card,
                height: 200,
                width: "100%",
              }}
            />
          )} */}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default JobApplicationModal;
