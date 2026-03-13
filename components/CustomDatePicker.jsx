import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

const CustomDatePicker = ({
  label,
  value,
  onChange, // returns formatted date string (YYYY-MM-DD)
  placeholder = 'Select date',
  error,
  required = false,
  editable = true,
  icon = 'calendar-outline',
  rightIcon,
  onRightIconPress,
  style = {},
  labelStyle = {},
  errorStyle = {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.colors.status.error;
    if (isFocused) return theme.colors.primary.teal;
    return theme.colors.border.light;
  };

  const getBackgroundColor = () => {
    if (!editable) return theme.colors.neutral.lightGray;
    return theme.colors.background.card;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      onChange(formatted);
    }
  };

  return (
    <View style={[{ marginBottom: theme.spacing.md }, style]}>
      {/* Label */}
      {label && (
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
          <Text
            style={[
              {
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.text.secondary,
                letterSpacing: 0.2,
              },
              labelStyle,
            ]}
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
              *
            </Text>
          )}
        </View>
      )}

      {/* Input Box */}
      <TouchableOpacity
        activeOpacity={editable ? 0.8 : 1}
        onPress={() => editable && setShowPicker(true)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getBackgroundColor(),
          borderWidth: 1.5,
          borderColor: getBorderColor(),
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          height: 50,
        }}
      >
        {/* Left Icon */}
        {icon && (
          <View style={{ marginRight: theme.spacing.sm }}>
            <Ionicons
              name={icon}
              size={18}
              color={isFocused ? theme.colors.primary.teal : theme.colors.text.tertiary}
            />
          </View>
        )}

        {/* Date Text */}
        <Text
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: value
              ? theme.colors.text.primary
              : theme.colors.text.placeholder,
          }}
        >
          {value || placeholder}
        </Text>

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{ padding: theme.spacing.xs, marginLeft: theme.spacing.sm }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightIcon}
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <Text
          style={[
            {
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.status.error,
              marginTop: theme.spacing.xs,
              letterSpacing: 0.1,
            },
            errorStyle,
          ]}
        >
          {error}
        </Text>
      )}

      {/* Date Picker Modal */}
      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

export default CustomDatePicker;
