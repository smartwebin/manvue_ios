import apiService from '@/services/apiService';
import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * AI-Powered SkillsInput Component
 *
 * Features:
 * - AI-powered skill suggestions using OpenAI GPT-5-nano
 * - Caches suggestions for consistent results
 * - Stores ALL suggested skills in database (not just selected ones)
 * - Fallback to database search when AI unavailable
 * - Debounced search to reduce API calls
 */

const SkillsInputAI = ({
  skills = [],
  onSkillsChange,
  label = 'Skills (Add up to 10 skills)',
  placeholder = 'Type a skill to get AI suggestions...',
  maxSkills = 10,
  maxSkillLength = 30,
  required = false,
  error = null,
  style,
  contextType = 'general', // 'jobseeker', 'employer', or 'general'
  userId = null,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef(null);

  // Debounced AI skill search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if input too short
    if (inputValue.trim().length < 2) {
      hideSuggestions();
      return;
    }

    // Debounce search by 500ms
    searchTimeoutRef.current = setTimeout(() => {
      fetchAISuggestions(inputValue.trim());
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue, skills]);

  /**
   * Fetch AI-powered skill suggestions
   */
  const fetchAISuggestions = async (searchTerm) => {
    setIsLoadingSuggestions(true);

    try {
      const result = await apiService.getSkillSuggestions({
        search_term: searchTerm,
        context_type: contextType,
        user_id: userId,
      });

      if (result.success && result.data?.suggestions) {
        // Filter out already selected skills
        const filteredSuggestions = result.data.suggestions.filter(suggestion => {
          const skillName = suggestion.skill_name.toLowerCase();
          return !skills.some(s =>
            getSkillName(s).toLowerCase() === skillName
          );
        });

        setSuggestions(filteredSuggestions);

        if (filteredSuggestions.length > 0) {
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
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      hideSuggestions();
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const hideSuggestions = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    });
  }, [fadeAnim]);

  const handleInputChange = (text) => {
    setInputValue(text);
  };

  const addSkill = (skillName = null, category = 'Other', skillId = null, relevanceScore = null) => {
    const skillText = skillName || inputValue.trim();

    if (!skillText) return;

    // Check if skill already exists (case insensitive)
    const exists = skills.some(s =>
      getSkillName(s).toLowerCase() === skillText.toLowerCase()
    );

    if (exists) {
      setInputValue('');
      hideSuggestions();
      return;
    }

    if (skills.length >= maxSkills) {
      setInputValue('');
      hideSuggestions();
      return;
    }

    // Create skill object
    const newSkill = {
      skill_name: skillText,
      skill_category: category,
      proficiency_level: 'intermediate',
      years_of_experience: 0,
      ...(skillId && { skill_id: skillId }),
      ...(relevanceScore && { relevance_score: relevanceScore }),
    };

    onSkillsChange([...skills, newSkill]);
    setInputValue('');
    hideSuggestions();
    Keyboard.dismiss();
  };

  const selectSuggestion = (suggestion) => {
    const skillName = suggestion.skill_name;
    const category = suggestion.skill_category || 'Other';
    const skillId = suggestion.skill_id;
    const relevanceScore = suggestion.relevance_score;

    addSkill(skillName, category, skillId, relevanceScore);
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

      {/* AI Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
        <Ionicons name="sparkles" size={14} color={theme.colors.primary.orange} />
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.secondary,
            marginLeft: theme.spacing.xs,
          }}
        >
          AI-Powered Suggestions
        </Text>
      </View>

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

          {isLoadingSuggestions && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary.teal}
              style={{ marginRight: theme.spacing.sm }}
            />
          )}

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

        {/* AI Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              marginTop: theme.spacing.xs,
              backgroundColor: theme.colors.neutral.white,
              borderWidth: 1,
              borderColor: theme.colors.border.light,
              borderRadius: theme.borderRadius.md,
              maxHeight: 250,
              ...theme.shadows.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `ai-suggestion-${index}-${item.skill_name}`}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => selectSuggestion(item)}
                  activeOpacity={0.7}
                  style={{
                    padding: theme.spacing.md,
                    borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.neutral.lightGray,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={theme.colors.primary.orange}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.base,
                          fontFamily: theme.typography.fonts.medium,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {item.skill_name}
                      </Text>
                    </View>
                    {item.skill_category && (
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.text.tertiary,
                          marginTop: 2,
                        }}
                      >
                        {item.skill_category}
                      </Text>
                    )}
                  </View>
                  {item.relevance_score && (
                    <View style={{
                      backgroundColor: theme.colors.background.accent,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: 2,
                      borderRadius: theme.borderRadius.sm,
                    }}>
                      <Text style={{
                        fontSize: theme.typography.sizes.xs,
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.primary.teal,
                      }}>
                        {Math.round(item.relevance_score * 100)}%
                      </Text>
                    </View>
                  )}
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
          Type at least 2 characters to see AI suggestions
        </Text>
      )}

      {/* Loading hint */}
      {isLoadingSuggestions && (
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.primary.orange,
            marginTop: theme.spacing.xs,
            fontStyle: 'italic',
          }}
        >
          Getting AI suggestions...
        </Text>
      )}
    </View>
  );
};

export default SkillsInputAI;
