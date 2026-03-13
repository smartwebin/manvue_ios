import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  icon,
  rightIcon,
  onRightIconPress,
  editable = true,
  maxLength,
  style = {},
  inputStyle = {},
  labelStyle = {},
  errorStyle = {},
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getBorderColor = () => {
    if (error) return theme.colors.status.error;
    if (isFocused) return theme.colors.primary.teal;
    return theme.colors.border.light;
  };

  const getBackgroundColor = () => {
    if (!editable) return theme.colors.neutral.lightGray;
    return theme.colors.background.card;
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

      {/* Input Container */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: getBackgroundColor(),
          borderWidth: 1.5,
          borderColor: getBorderColor(),
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: multiline ? theme.spacing.md : theme.spacing.sm,
          minHeight: multiline ? numberOfLines * 20 + theme.spacing.lg : 50,
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

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          style={[
            {
              flex: 1,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: editable ? theme.colors.text.primary : theme.colors.text.tertiary,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingVertical: 0,
              lineHeight: theme.typography.sizes.base * 1.3,
            },
            inputStyle,
          ]}
          {...props}
        />

        {/* Password Toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={{
              padding: theme.spacing.xs,
              marginLeft: theme.spacing.sm,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{
              padding: theme.spacing.xs,
              marginLeft: theme.spacing.sm,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightIcon}
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

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

      {/* Character Count */}
      {maxLength && value && (
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.tertiary,
            textAlign: 'right',
            marginTop: theme.spacing.xs,
          }}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

export default CustomInput;