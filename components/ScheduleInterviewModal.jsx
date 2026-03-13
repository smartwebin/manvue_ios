import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SafeAreaWrapper from "./SafeAreaWrapper";

const ScheduleInterviewModal = ({
  visible,
  onClose,
  selectedCandidate,
  interviewDate,
  setInterviewDate,
  interviewTime,
  setInterviewTime,
  showDatePicker,
  setShowDatePicker,
  showTimePicker,
  setShowTimePicker,
  duration,
  setDuration,
  interviewType,
  setInterviewType,
  notes,
  setNotes,
  schedulingInterview,
  onSchedule,
}) => {
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setInterviewDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setInterviewTime(selectedTime);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaWrapper>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.background.card,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                maxHeight: "90%",
                paddingBottom: theme.spacing.md,
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: theme.spacing.lg,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.light,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.lg,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                  }}
                >
                  Schedule Interview
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: theme.spacing.lg }}>
                {/* Candidate Info */}
                {selectedCandidate && (
                  <View
                    style={{
                      backgroundColor: theme.colors.background.accent,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.lg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Scheduling interview with:
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.semiBold,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {selectedCandidate.name || "Job Seeker"}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {selectedCandidate.matchedJobTitle || "Position"}
                    </Text>
                  </View>
                )}

                {/* Date Picker */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Date *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.colors.neutral.lightGray,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={theme.colors.text.tertiary}
                      style={{ marginRight: theme.spacing.sm }}
                    />
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {interviewDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Time Picker */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Time *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.colors.neutral.lightGray,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.colors.text.tertiary}
                      style={{ marginRight: theme.spacing.sm }}
                    />
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {interviewTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Duration */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Duration (minutes) *
                  </Text>
                  <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                    {["30", "45", "60", "90"].map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        onPress={() => setDuration(mins)}
                        style={{
                          flex: 1,
                          paddingVertical: theme.spacing.md,
                          borderRadius: theme.borderRadius.lg,
                          backgroundColor:
                            duration === mins
                              ? theme.colors.primary.teal
                              : theme.colors.neutral.lightGray,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.base,
                            fontFamily: theme.typography.fonts.semiBold,
                            color:
                              duration === mins
                                ? theme.colors.neutral.white
                                : theme.colors.text.primary,
                          }}
                        >
                          {mins}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Interview Type */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Interview Type *
                  </Text>
                  <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                    {[
                      { key: "video", label: "Video Call", icon: "videocam" },
                      { key: "phone", label: "Phone", icon: "call" },
                      { key: "in_person", label: "In Person", icon: "people" },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        onPress={() => setInterviewType(type.key)}
                        style={{
                          flex: 1,
                          paddingVertical: theme.spacing.md,
                          borderRadius: theme.borderRadius.lg,
                          backgroundColor:
                            interviewType === type.key
                              ? theme.colors.primary.teal
                              : theme.colors.neutral.lightGray,
                          alignItems: "center",
                          flexDirection: "column",
                          gap: theme.spacing.xs,
                        }}
                      >
                        <Ionicons
                          name={type.icon}
                          size={20}
                          color={
                            interviewType === type.key
                              ? theme.colors.neutral.white
                              : theme.colors.text.primary
                          }
                        />
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.medium,
                            color:
                              interviewType === type.key
                                ? theme.colors.neutral.white
                                : theme.colors.text.primary,
                          }}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Notes (Optional)
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any instructions or details for the interview..."
                    placeholderTextColor={theme.colors.text.placeholder}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{
                      backgroundColor: theme.colors.neutral.lightGray,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.primary,
                      minHeight: 100,
                    }}
                  />
                </View>

                {/* Schedule Button */}
                <TouchableOpacity
                  onPress={onSchedule}
                  disabled={schedulingInterview}
                  style={{
                    backgroundColor: theme.colors.primary.teal,
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.md,
                    alignItems: "center",
                    marginBottom: theme.spacing.xl,
                  }}
                  activeOpacity={0.8}
                >
                  {schedulingInterview ? (
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
                      Schedule Interview
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Date Time Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={interviewDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={interviewTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaWrapper>
    </Modal>
  );
};

export default ScheduleInterviewModal;
