import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CustomDropdown = ({
  label,
  value,
  onSelect,
  options = [],
  placeholder = 'Select an option',
  error,
  icon,
  required = false,
  disabled = false,
  style = {},
  labelStyle = {},
  errorStyle = {},
  modalTitle,
  searchable = false,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  // console.log("OPTIONS:", options);
  // console.log("filteredOptions:", filteredOptions);
  // console.log("selectedOption:", selectedOption);

  const handleSelect = (option) => {
    onSelect(option.value);
    setIsVisible(false);
    setSearchQuery('');
  };

  const openDropdown = () => {
    if (!disabled) {
      setIsVisible(true);
    }
  };

  const getBorderColor = () => {
    if (error) return theme.colors.status.error;
    if (isVisible) return theme.colors.primary.teal;
    return theme.colors.border.light;
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.neutral.lightGray;
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

      {/* Dropdown Trigger */}
      <TouchableOpacity
        onPress={openDropdown}
        activeOpacity={0.8}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getBackgroundColor(),
          borderWidth: 1.5,
          borderColor: getBorderColor(),
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 50,
        }}
      >
        {/* Left Icon */}
        {icon && (
          <View style={{ marginRight: theme.spacing.sm }}>
            <Ionicons
              name={icon}
              size={18}
              color={disabled ? theme.colors.text.tertiary : theme.colors.primary.teal}
            />
          </View>
        )}

        {/* Selected Value or Placeholder */}
        <Text
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fonts.regular,
            color: selectedOption
              ? theme.colors.text.primary
              : theme.colors.text.placeholder,
            letterSpacing: 0.2,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        {/* Dropdown Arrow */}
        <Ionicons
          name={isVisible ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={disabled ? theme.colors.text.tertiary : theme.colors.text.secondary}
        />
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

      {/* Dropdown Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
          }}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.xl,
              width: '100%',
              maxHeight: '70%',
              // Add flex direction and overflow handling
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
                // Ensure header doesn't shrink
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.lg,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.primary,
                  flex: 1,
                }}
              >
                {modalTitle || label || 'Select Option'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={{
                  padding: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Search Input (if searchable) */}
            {searchable && (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.md,
                  paddingBottom: theme.spacing.sm,
                  // Ensure search doesn't shrink
                  flexShrink: 0,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.neutral.lightGray,
                    borderRadius: theme.borderRadius.md,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="search"
                    size={16}
                    color={theme.colors.text.tertiary}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search options..."
                    placeholderTextColor={theme.colors.text.placeholder}
                    style={{
                      flex: 1,
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.primary,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Options List */}
            <ScrollView
              style={{ 
                // Remove flex: 1, let it take available space
                flexGrow: 1,
              }}
              contentContainerStyle={{
                // Add padding to content container if needed
                flexGrow: filteredOptions.length === 0 ? 1 : undefined,
              }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleSelect(option)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.md,
                      backgroundColor:
                        value === option.value
                          ? theme.colors.background.accent
                          : 'transparent',
                      borderBottomWidth: index < filteredOptions.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.border.light,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: theme.typography.sizes.base,
                        fontFamily:
                          value === option.value
                            ? theme.typography.fonts.medium
                            : theme.typography.fonts.regular,
                        color:
                          value === option.value
                            ? theme.colors.primary.teal
                            : theme.colors.text.primary,
                        letterSpacing: 0.2,
                      }}
                    >
                      {option.label}
                    </Text>
                    {value === option.value && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={theme.colors.primary.teal}
                      />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View
                  style={{
                    padding: theme.spacing.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.tertiary,
                      textAlign: 'center',
                    }}
                  >
                    {searchable && searchQuery
                      ? 'No options match your search'
                      : 'No options available'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CustomDropdown;