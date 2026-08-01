import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View, Modal } from 'react-native';

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

  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value ? parseDateString(value) : new Date());

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
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        const formatted = formatDateToDDMMYYYY(selectedDate);
        onChange(formatted);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    setShowPicker(false);
    const dateToUse = tempDate || new Date();
    const formatted = formatDateToDDMMYYYY(dateToUse);
    onChange(formatted);
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
        onPress={() => {
          if (editable) {
            setTempDate(value ? parseDateString(value) : new Date());
            setShowPicker(true);
          }
        }}
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
          {value ? formatDateToDDMMYYYY(parseDateString(value)) : placeholder}
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
      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent={true} animationType="slide">
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }} 
            activeOpacity={1} 
            onPress={() => setShowPicker(false)}
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
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={value ? parseDateString(value) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}
    </View>
  );
};

export default CustomDatePicker;
