import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Keyboard,
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
 * CustomArrayInput2 - Modal-based input for managing array items (Education, Work Experience)
 * Opens items in a full-screen modal for better editing experience
 */
const CustomArrayInput2 = ({
  label,
  data = [],
  setData,
  renderFields, // Function that renders input fields for an item
  required = false,
  defaultItem = {},
  errors = {},
  name = "", // e.g., "education", "work_experience"
  addButtonText = "Add Item",
  itemTitle = "Item", // e.g., "Education", "Work Experience"
  onSave, // Callback function to save data after each add/edit
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentItem, setCurrentItem] = useState({ ...defaultItem });
  const [modalErrors, setModalErrors] = useState({});

  // Open modal to add new item
  const handleAdd = () => {
    setEditingIndex(null);
    setCurrentItem({ ...defaultItem });
    setModalErrors({});
    setShowModal(true);
  };

  // Open modal to edit existing item
  const handleEdit = (index) => {
    setEditingIndex(index);
    setCurrentItem({ ...data[index] });
    setModalErrors({});
    setShowModal(true);
  };

  // Save item (add or update)
  const handleSave = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    // Validate required fields
    const newErrors = {};

    // Basic validation - you can customize this
    Object.keys(defaultItem).forEach((key) => {
      if (defaultItem[key] === "" && currentItem[key] === "") {
        // Check if it's a required field (you can add more logic here)
        if (
          [
            "degree_name",
            "institution_name",
            "job_title",
            "company_name",
          ].includes(key)
        ) {
          newErrors[key] = "This field is required";
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setModalErrors(newErrors);
      return;
    }

    if (editingIndex !== null) {
      // Update existing item
      const updated = [...data];
      updated[editingIndex] = currentItem;
      setData(updated);
    } else {
      // Add new item
      setData([...data, currentItem]);
    }

    // Close modal and trigger save callback immediately with the item data
    setShowModal(false);
    const itemToSave = { ...currentItem };
    setCurrentItem({ ...defaultItem });
    setModalErrors({});
    
    // Call the onSave callback with the item data and whether it's an update
    if (typeof onSave === 'function') {
      onSave(itemToSave, editingIndex !== null);
    }
  };

  // Remove item
  const handleRemove = (index) => {
    const itemToDelete = data[index];
    const updated = [...data];
    updated.splice(index, 1);
    setData(updated);
    
    // Call the onSave callback with the item to delete
    if (typeof onSave === 'function') {
      setTimeout(() => onSave(itemToDelete, false, true), 100);
    }
  };

  // Cancel modal
  const handleCancel = () => {
    Keyboard.dismiss();
    setShowModal(false);
    setCurrentItem({ ...defaultItem });
    setModalErrors({});
  };

  // Update field in current item
  const updateField = (field, value) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (modalErrors[field]) {
      setModalErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Get display summary for list item
  const getItemSummary = (item) => {
    if (name === "education") {
      return `${item.degree_name || "Untitled"} - ${
        item.institution_name || "No institution"
      }`;
    } else if (name === "work_experience") {
      return `${item.job_title || "Untitled"} at ${
        item.company_name || "No company"
      }`;
    }
    return "Item";
  };

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {/* Label */}
      {label && (
        <View style={{ flexDirection: "row", marginBottom: theme.spacing.sm }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}
          >
            {label}
          </Text>
          {required && (
            <Text
              style={{
                color: theme.colors.status.error,
                fontSize: theme.typography.sizes.sm,
                marginLeft: 2,
              }}
            >
              {" "}
              *
            </Text>
          )}
        </View>
      )}

      {/* List of items */}
      {data.map((item, index) => (
        <View
          key={index}
          style={{
            marginBottom: theme.spacing.sm,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.background.card,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}
              >
                {getItemSummary(item)}
              </Text>
              {item.start_date && (
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    marginTop: theme.spacing.xs,
                  }}
                >
                  {item.start_date} -{" "}
                  {item.is_current ? "Present" : item.end_date || "N/A"}
                </Text>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <TouchableOpacity
                onPress={() => handleEdit(index)}
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="pencil"
                  size={20}
                  color={theme.colors.primary.teal}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRemove(index)}
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.status.error}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* Add Button */}
      <TouchableOpacity
        onPress={handleAdd}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.md,
          borderWidth: 1.5,
          borderColor: theme.colors.primary.teal,
          borderRadius: theme.borderRadius.md,
          borderStyle: "dashed",
          backgroundColor: theme.colors.background.accent,
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color={theme.colors.primary.teal}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text
          style={{
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.primary.teal,
          }}
        >
          {addButtonText}
        </Text>
      </TouchableOpacity>

      {/* Edit/Add Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaWrapper>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.background.primary,
              }}
            >
              {/* Modal Header - Fixed at top */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.light,
                  backgroundColor: theme.colors.background.card,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                    android: {
                      elevation: 4,
                    },
                  }),
                }}
              >
                <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: theme.typography.sizes.lg,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                  }}
                >
                  {editingIndex !== null
                    ? `Edit ${itemTitle}`
                    : `Add ${itemTitle}`}
                </Text>

                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor: theme.colors.primary.teal,
                    borderRadius: theme.borderRadius.md,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Modal Content - Scrollable */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.lg,
                  paddingBottom: Platform.OS === 'ios' 
                    ? theme.spacing.xxxl * 2 
                    : theme.spacing.xxxl, // Extra bottom padding for keyboard
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                bounces={true}
              >
                {renderFields(currentItem, updateField, modalErrors)}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaWrapper>
      </Modal>
    </View>
  );
};

export default CustomArrayInput2;