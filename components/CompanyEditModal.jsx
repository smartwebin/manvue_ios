import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const CompanyEditModal = ({
  visible,
  onClose,
  onSave,
  fieldName,
  initialValue,
  updating = false,
}) => {
  const [value, setValue] = useState('');

  // Update local state when initialValue changes
  useEffect(() => {
    if (visible) {
      setValue(initialValue || '');
    }
  }, [visible, initialValue]);

  // Get field label for display
  const getFieldLabel = (field) => {
    const labels = {
      companyName: 'Company Name',
      industry: 'Industry',
      companySize: 'Company Size',
      foundedYear: 'Founded Year',
      website: 'Website',
      headquarters: 'Headquarters',
      email: 'Email Address',
      phone: 'Phone Number',
      address: 'Address',
      description: 'Company Description',
    };
    return labels[field] || field;
  };

  // Check if field should be multiline
  const isMultilineField = (field) => {
    return ['description', 'address'].includes(field);
  };

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
    }
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.xl,
            width: '100%',
            maxWidth: 400,
            padding: theme.spacing.xl,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.lg,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              textAlign: 'center',
            }}
          >
            Edit {getFieldLabel(fieldName)}
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={`Enter ${getFieldLabel(fieldName)}`}
            placeholderTextColor={theme.colors.text.placeholder}
            multiline={isMultilineField(fieldName)}
            numberOfLines={isMultilineField(fieldName) ? 4 : 1}
            autoFocus={true}
            keyboardType={
              fieldName === 'email'
                ? 'email-address'
                : fieldName === 'phone'
                ? 'phone-pad'
                : fieldName === 'foundedYear'
                ? 'number-pad'
                : 'default'
            }
            style={{
              backgroundColor: theme.colors.neutral.lightGray,
              borderRadius: theme.borderRadius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.lg,
              textAlignVertical: 'top',
              minHeight: isMultilineField(fieldName) ? 100 : 50,
            }}
          />

          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={updating}
              style={{
                flex: 1,
                backgroundColor: theme.colors.neutral.lightGray,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: 'center',
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
              onPress={handleSave}
              disabled={!value.trim() || updating}
              style={{
                flex: 1,
                borderRadius: theme.borderRadius.lg,
                overflow: 'hidden',
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  value.trim() && !updating
                    ? [theme.colors.primary.teal, theme.colors.secondary.darkTeal]
                    : [theme.colors.neutral.mediumGray, theme.colors.neutral.mediumGray]
                }
                style={{
                  paddingVertical: theme.spacing.md,
                  alignItems: 'center',
                }}
              >
                {updating ? (
                  <ActivityIndicator color={theme.colors.neutral.white} />
                ) : (
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    Save
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CompanyEditModal;
