import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const CustomDropdown3 = ({
  label,
  value,
  onSelect,
  options = [],
  placeholder = 'Select an option',
  error,
  icon,
  required = false,
  disabled = false,
  loading = false,
  style = {},
  labelStyle = {},
  errorStyle = {},
  modalTitle,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  emptySearchMessage = 'No results match your search',
  showCheckmark = true,
  highlightSelected = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
// console.log('🔍 Search options:', options);
  // Advanced search with multiple criteria
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return options.filter(option => {
      const label = option.label?.toLowerCase() || '';
      const value = option.value?.toString().toLowerCase() || '';
      
      // Check if query matches:
      // 1. Start of label
      // 2. Any word in label
      // 3. Value
      const labelWords = label.split(/\s+/);
      
      return (
        label.includes(query) || // Contains query
        label.startsWith(query) || // Starts with query
        labelWords.some(word => word.startsWith(query)) || // Any word starts with query
        value.includes(query) // Value contains query
      );
    });
  }, [options, searchQuery, searchable]);

  // Find selected option
  const selectedOption = useMemo(() => 
    options.find(option => option.value === value),
    [options, value]
  );

  const handleSelect = useCallback((option) => {
    onSelect(option.value);
    setIsVisible(false);
    setSearchQuery('');
  }, [onSelect]);

  const openDropdown = useCallback(() => {
    if (!disabled && !loading) {
      setIsVisible(true);
    }
  }, [disabled, loading]);

  const closeDropdown = useCallback(() => {
    setIsVisible(false);
    setSearchQuery('');
  }, []);

  const getBorderColor = () => {
    if (error) return theme.colors.status.error;
    if (isVisible) return theme.colors.primary.teal;
    return theme.colors.border.light;
  };

  const getBackgroundColor = () => {
    if (disabled || loading) return theme.colors.neutral.lightGray;
    return theme.colors.background.card;
  };

  // Render option item for FlatList
  const renderOption = useCallback(({ item: option, index }) => {
    const isSelected = value === option.value;
    
    return (
      <TouchableOpacity
        onPress={() => handleSelect(option)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: highlightSelected && isSelected
            ? theme.colors.background.accent
            : 'transparent',
          borderBottomWidth: index < filteredOptions.length - 1 ? 1 : 0,
          borderBottomColor: theme.colors.border.light,
        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            flex: 1,
            fontSize: theme.typography.sizes.base,
            fontFamily: isSelected
              ? theme.typography.fonts.semiBold
              : theme.typography.fonts.regular,
            color: isSelected
              ? theme.colors.primary.teal
              : theme.colors.text.primary,
            letterSpacing: 0.2,
          }}
          numberOfLines={2}
        >
          {option.label}
        </Text>
        {showCheckmark && isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.primary.teal}
            style={{ marginLeft: theme.spacing.sm }}
          />
        )}
      </TouchableOpacity>
    );
  }, [value, handleSelect, filteredOptions.length, highlightSelected, showCheckmark]);

  const keyExtractor = useCallback((item) => item.value?.toString() || Math.random().toString(), []);

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
        disabled={disabled || loading}
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
              color={disabled || loading ? theme.colors.text.tertiary : theme.colors.primary.teal}
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
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        {/* Loading Indicator or Dropdown Arrow */}
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary.teal} 
          />
        ) : (
          <Ionicons
            name={isVisible ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={disabled ? theme.colors.text.tertiary : theme.colors.text.secondary}
          />
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={theme.colors.status.error}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              {
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.status.error,
                letterSpacing: 0.1,
                flex: 1,
              },
              errorStyle,
            ]}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
        statusBarTranslucent
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
          onPress={closeDropdown}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.xl,
              width: '100%',
              maxHeight: '80%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
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
              }}
            >
              <View style={{ flex: 1, marginRight: theme.spacing.md }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.lg,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.text.primary,
                  }}
                  numberOfLines={1}
                >
                  {modalTitle || label || 'Select Option'}
                </Text>
                {options.length > 0 && (
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.xs,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.tertiary,
                      marginTop: 2,
                    }}
                  >
                    {filteredOptions.length} of {options.length} options
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={closeDropdown}
                style={{
                  padding: theme.spacing.xs,
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: theme.colors.neutral.lightGray,
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

            {/* Search Input */}
            {searchable && options.length > 0 && (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.md,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.neutral.lightGray,
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="search"
                    size={18}
                    color={theme.colors.text.tertiary}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={theme.colors.text.placeholder}
                    style={{
                      flex: 1,
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.primary,
                      paddingVertical: theme.spacing.xs,
                    }}
                    autoFocus={false}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      style={{ padding: theme.spacing.xs }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={theme.colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Options List with FlatList for better performance */}
            {filteredOptions.length > 0 ? (
              <FlatList
                data={filteredOptions}
                renderItem={renderOption}
                keyExtractor={keyExtractor}
                style={{ flexGrow: 1 }}
                contentContainerStyle={{ paddingBottom: theme.spacing.sm }}
                showsVerticalScrollIndicator={true}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                removeClippedSubviews={true}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View
                style={{
                  padding: theme.spacing.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={searchQuery ? 'search-outline' : 'list-outline'}
                  size={48}
                  color={theme.colors.text.tertiary}
                  style={{ marginBottom: theme.spacing.md }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.text.secondary,
                    textAlign: 'center',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {searchQuery ? 'No Results Found' : 'No Options Available'}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                    textAlign: 'center',
                  }}
                >
                  {searchQuery ? emptySearchMessage : emptyMessage}
                </Text>
                {searchQuery && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={{
                      marginTop: theme.spacing.md,
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.sm,
                      backgroundColor: theme.colors.primary.teal,
                      borderRadius: theme.borderRadius.md,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.sm,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.neutral.white,
                      }}
                    >
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CustomDropdown3;