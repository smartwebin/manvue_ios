import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const EditModal = ({
  visible,
  onClose,
  onSave,
  field,
  value,
  onChangeText,
  title,
  placeholder,
  isLoading = false,
  isCriticalField = false,
  criticalFieldMessage = 'This change will be submitted for admin review before being applied to your profile.',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
  error,
  success,
}) => {
  // Helper function to format field names for display
  const formatFieldName = (fieldName) => {
    if (!fieldName) return '';
    return fieldName
      .charAt(0)
      .toUpperCase() + fieldName
      .slice(1)
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1');
  };

  // Determine if field should be multiline based on field name
  const shouldBeMultiline = () => {
    if (multiline !== null && multiline !== undefined) return multiline;
    const multilineFields = ['full_address', 'skills', 'area_of_interest', 'bio', 'description'];
    return multilineFields.includes(field);
  };

  // Determine number of lines based on field
  const getNumberOfLines = () => {
    if (numberOfLines && numberOfLines > 1) return numberOfLines;
    return shouldBeMultiline() ? 3 : 1;
  };

  // Get placeholder text
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return `Enter ${field?.replace(/_/g, ' ') || 'value'}`;
  };

  // Get display title
  const getTitle = () => {
    if (title) return title;
    return `Edit ${formatFieldName(field)}`;
  };

  const handleSave = () => {
    if (!value?.trim()) return;
    onSave();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View
        style={[
          {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
          },
          style?.container,
        ]}
      >
        <View
          style={[
            {
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.xl,
              width: '100%',
              maxWidth: 400,
              padding: theme.spacing.xl,
            },
            style?.modal,
          ]}
        >
          {/* Title */}
          <Text
            style={[
              {
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
                textAlign: 'center',
              },
              style?.title,
            ]}
          >
            {getTitle()}
          </Text>

          {/* Critical Field Warning */}
          {isCriticalField && (
            <View
              style={[
                {
                  backgroundColor: theme.colors.background.accent,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.primary.orange,
                },
                style?.warningContainer,
              ]}
            >
              <Text
                style={[
                  {
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.primary.orange,
                    marginBottom: theme.spacing.xs,
                  },
                  style?.warningTitle,
                ]}
              >
                Admin Approval Required
              </Text>
              <Text
                style={[
                  {
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                  },
                  style?.warningText,
                ]}
              >
                {criticalFieldMessage}
              </Text>
            </View>
          )}

          {/* Input Field */}
          <TextInput
            value={value || ''}
            onChangeText={onChangeText}
            placeholder={getPlaceholder()}
            placeholderTextColor={theme.colors.text.placeholder}
            multiline={shouldBeMultiline()}
            numberOfLines={getNumberOfLines()}
            maxLength={maxLength}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            style={[
              {
                backgroundColor: theme.colors.neutral.lightGray,
                borderRadius: theme.borderRadius.lg,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.primary,
                marginBottom: field === 'skills' ? theme.spacing.sm : theme.spacing.lg,
                textAlignVertical: shouldBeMultiline() ? 'top' : 'center',
                minHeight: shouldBeMultiline() ? 80 : 50,
              },
              style?.input,
            ]}
          />

          {/* Helper text for skills field */}
          {field === 'skills' && !error && !success && (
            <View
              style={{
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.primary.teal,
                  fontStyle: 'italic',
                }}
              >
                💡 Tip: Use commas to separate skills (eg: JavaScript, React, Node.js)
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.status.error,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.status.error,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: theme.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  !
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.status.error,
                  lineHeight: theme.typography.sizes.sm * 1.4,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.status.success,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.status.success,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: theme.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}
                >
                  ✓
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.status.success,
                  lineHeight: theme.typography.sizes.sm * 1.4,
                }}
              >
                {success}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={[{ flexDirection: 'row', gap: theme.spacing.md }, style?.buttonContainer]}>
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleClose}
              style={[
                {
                  flex: 1,
                  backgroundColor: theme.colors.neutral.lightGray,
                  borderRadius: theme.borderRadius.lg,
                  paddingVertical: theme.spacing.md,
                  alignItems: 'center',
                },
                style?.cancelButton,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  {
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.text.secondary,
                  },
                  style?.cancelButtonText,
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!value?.trim() || isLoading}
              style={[
                {
                  flex: 1,
                  borderRadius: theme.borderRadius.lg,
                  overflow: 'hidden',
                },
                style?.saveButton,
              ]}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  value?.trim() && !isLoading
                    ? [theme.colors.primary.teal, theme.colors.secondary.darkTeal]
                    : [theme.colors.neutral.mediumGray, theme.colors.neutral.mediumGray]
                }
                style={[
                  {
                    paddingVertical: theme.spacing.md,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  },
                  style?.saveButtonGradient,
                ]}
              >
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.neutral.white}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                )}
                <Text
                  style={[
                    {
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.neutral.white,
                    },
                    style?.saveButtonText,
                  ]}
                >
                  {isLoading
                    ? 'Saving...'
                    : (isCriticalField ? 'Submit for Review' : 'Save')
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditModal;