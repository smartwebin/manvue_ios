import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SkillsInput = ({
  skills = [],
  onSkillsChange,
  availableSkills = [], // Array of {skill_name: 'React', skill_category: 'Frontend'}
  label = 'Skills (Add up to 10 skills)',
  placeholder = 'Type a skill and press Enter',
  maxSkills = 10,
  maxSkillLength = 30,
  required = false,
  error = null,
  style,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length >= 2 && availableSkills.length > 0) {
      const searchTerm = inputValue.trim().toLowerCase();
      const filtered = availableSkills
        .filter(skill => {
          const skillName = (skill.skill_name || skill.label || '').toLowerCase();
          // Check if skill is not already added
          const alreadyAdded = skills.some(s => 
            getSkillName(s).toLowerCase() === (skill.skill_name || skill.label || '').toLowerCase()
          );
          return skillName.includes(searchTerm) && !alreadyAdded;
        })
        .slice(0, 5); // Limit to 5 suggestions

      setFilteredSuggestions(filtered);
      
      if (filtered.length > 0) {
        setShowSuggestions(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        hideSuggestions();
      }
    } else {
      hideSuggestions();
    }
  }, [inputValue, skills, availableSkills]);

  const hideSuggestions = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    });
  };

  const handleInputChange = (text) => {
    setInputValue(text);
  };

  const addSkill = (skillName = null, category = 'Other', skillId = null) => {
    const skillText = skillName || inputValue.trim();

    if (!skillText) return;

    // Check if skill already exists (case insensitive)
    const exists = skills.some(s =>
      getSkillName(s).toLowerCase() === skillText.toLowerCase()
    );

    if (exists) {
      // Already added, just clear input
      setInputValue('');
      hideSuggestions();
      return;
    }

    if (skills.length >= maxSkills) {
      // Max skills reached
      setInputValue('');
      hideSuggestions();
      return;
    }

    // Create skill object (consistent with API format)
    const newSkill = {
      skill_name: skillText,
      skill_category: category,
      proficiency_level: 'intermediate',
      years_of_experience: 0,
      ...(skillId && { skill_id: skillId }) // Include skill_id if available
    };

    onSkillsChange([...skills, newSkill]);
    setInputValue('');
    hideSuggestions();
    Keyboard.dismiss();
  };

  const selectSuggestion = (suggestion) => {
    const skillName = suggestion.skill_name || suggestion.label;
    const category = suggestion.skill_category || suggestion.category || 'Other';
    const skillId = suggestion.skill_id || suggestion.value; // Get skill_id from suggestion
    addSkill(skillName, category, skillId);
  };

  const removeSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    onSkillsChange(newSkills);
  };

  const getSkillName = (skill) => {
    return typeof skill === 'string' ? skill : skill.skill_name || skill;
  };

  return (
    <View style={[{ marginBottom: theme.spacing.lg }, style]}>
      {/* Label */}
      <Text
        style={{
          fontSize: theme.typography.sizes.sm,
          fontFamily: theme.typography.fonts.medium,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
        }}
      >
        {label}
        {required && <Text style={{ color: theme.colors.status.error }}> *</Text>}
      </Text>

      {/* Input Field with Add Button */}
      <View style={{ position: 'relative', zIndex: 1000 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: error ? theme.colors.status.error : theme.colors.border.light,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.neutral.white,
            marginBottom: showSuggestions ? theme.spacing.xs : theme.spacing.md,
          }}
        >
          <TextInput
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.placeholder}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.md,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.primary,
            }}
            onSubmitEditing={() => addSkill()}
            returnKeyType="done"
            maxLength={maxSkillLength}
            autoCorrect={false}
            autoCapitalize="words"
          />
          <TouchableOpacity
            onPress={() => addSkill()}
            disabled={!inputValue.trim() || skills.length >= maxSkills}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add-circle"
              size={28}
              color={
                inputValue.trim() && skills.length < maxSkills
                  ? theme.colors.primary.teal
                  : theme.colors.neutral.mediumGray
              }
            />
          </TouchableOpacity>
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              marginTop: theme.spacing.xs,
              backgroundColor: theme.colors.neutral.white,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
              borderRadius: theme.borderRadius.md,
              maxHeight: 200,
              ...theme.shadows.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item, index) => `suggestion-${index}-${item.skill_name || item.label}`}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => selectSuggestion(item)}
                  activeOpacity={0.7}
                  style={{
                    padding: theme.spacing.md,
                    borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.neutral.lightGray,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.regular,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {item.skill_name || item.label}
                      {(item.skill_category || item.category) && (
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.sm,
                            color: theme.colors.text.secondary,
                          }}
                        >
                          {' '}({item.skill_category || item.category})
                        </Text>
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            color: theme.colors.status.error,
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.sm,
          }}
        >
          {error}
        </Text>
      )}

      {/* Selected Skills Tags */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginTop: theme.spacing.sm,
        }}
      >
        {skills.map((skill, index) => (
          <View
            key={`skill-${index}-${getSkillName(skill)}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.secondary.lightTeal,
              borderRadius: theme.borderRadius.full,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
              marginRight: theme.spacing.sm,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.background.primary,
                marginRight: theme.spacing.xs,
              }}
            >
              {getSkillName(skill)}
            </Text>
            <TouchableOpacity
              onPress={() => removeSkill(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.colors.primary.teal}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Skills Counter */}
      <Text
        style={{
          fontSize: theme.typography.sizes.xs,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.xs,
        }}
      >
        {skills.length} / {maxSkills} skills added
      </Text>

      {/* Helper text when typing */}
      {inputValue.trim().length > 0 && inputValue.trim().length < 2 && (
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.tertiary,
            marginTop: theme.spacing.xs,
            fontStyle: 'italic',
          }}
        >
          Type at least 2 characters to see suggestions
        </Text>
      )}
    </View>
  );
};

export default SkillsInput;