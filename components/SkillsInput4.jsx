import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

/**
 * SkillsInput4 Component
 * Advanced skills management with modal for editing proficiency and experience
 * Features:
 * - Add/remove skills with autocomplete
 * - Click skill to edit proficiency and years of experience
 * - Full-screen modal for skill details
 * - Visual proficiency indicators
 * - Improved touch targets to prevent accidental clicks
 */

const SkillsInput4 = ({
  skills = [],
  onSkillsChange,
  availableSkills = [],
  label = 'Skills',
  placeholder = 'Type a skill and press Enter',
  maxSkills = 20,
  maxSkillLength = 50,
  required = false,
  error = null,
  style,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Modal form state
  const [modalSkillName, setModalSkillName] = useState('');
  const [modalProficiency, setModalProficiency] = useState('intermediate');
  const [modalYears, setModalYears] = useState('0');
  const [modalCategory, setModalCategory] = useState('Other');

  const proficiencyLevels = [
    { value: 'beginner', label: 'Beginner', color: theme.colors.status.warning },
    { value: 'intermediate', label: 'Intermediate', color: theme.colors.primary.deepBlue },
    { value: 'advanced', label: 'Advanced', color: theme.colors.primary.teal },
    { value: 'expert', label: 'Expert', color: theme.colors.status.success },
  ];

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length >= 2 && availableSkills.length > 0) {
      const searchTerm = inputValue.trim().toLowerCase();
      const filtered = availableSkills
        .filter((skill) => {
          const skillName = (skill.skill_name || skill.label || '').toLowerCase();
          const alreadyAdded = skills.some(
            (s) =>
              getSkillName(s).toLowerCase() ===
              (skill.skill_name || skill.label || '').toLowerCase()
          );
          return skillName.includes(searchTerm) && !alreadyAdded;
        })
        .slice(0, 8);

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

  const getSkillName = (skill) => {
    return typeof skill === 'string' ? skill : skill.skill_name || skill;
  };

  const addSkill = (skillName = null, category = 'Other', skillId = null) => {
    const skillText = skillName || inputValue.trim();

    if (!skillText) return;

    const exists = skills.some(
      (s) => getSkillName(s).toLowerCase() === skillText.toLowerCase()
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

    const newSkill = {
      skill_name: skillText,
      skill_category: category,
      proficiency_level: 'intermediate',
      years_of_experience: 0,
      ...(skillId && { skill_id: skillId }),
    };

    onSkillsChange([...skills, newSkill]);
    setInputValue('');
    hideSuggestions();
    Keyboard.dismiss();
  };

  const selectSuggestion = (suggestion) => {
    const skillName = suggestion.skill_name || suggestion.label;
    const category = suggestion.skill_category || suggestion.category || 'Other';
    const skillId = suggestion.skill_id || suggestion.value;
    addSkill(skillName, category, skillId);
  };

  const removeSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    onSkillsChange(newSkills);
  };

  const openEditModal = (skill, index) => {
    const skillObj = typeof skill === 'string' 
      ? { skill_name: skill, proficiency_level: 'intermediate', years_of_experience: 0, skill_category: 'Other' }
      : skill;

    setEditingSkill(skillObj);
    setEditingIndex(index);
    setModalSkillName(skillObj.skill_name || '');
    setModalProficiency(skillObj.proficiency_level || 'intermediate');
    setModalYears((skillObj.years_of_experience || 0).toString());
    setModalCategory(skillObj.skill_category || 'Other');
    setShowEditModal(true);
  };

  const saveSkillEdit = () => {
    if (!modalSkillName.trim()) return;

    const updatedSkill = {
      ...editingSkill,
      skill_name: modalSkillName.trim(),
      proficiency_level: modalProficiency,
      years_of_experience: parseInt(modalYears) || 0,
      skill_category: modalCategory,
    };

    const newSkills = [...skills];
    newSkills[editingIndex] = updatedSkill;
    onSkillsChange(newSkills);
    closeEditModal();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSkill(null);
    setEditingIndex(null);
    setModalSkillName('');
    setModalProficiency('intermediate');
    setModalYears('0');
    setModalCategory('Other');
  };

  const getProficiencyColor = (level) => {
    const prof = proficiencyLevels.find((p) => p.value === level);
    return prof ? prof.color : theme.colors.neutral.mediumGray;
  };

  const getProficiencyLabel = (level) => {
    const prof = proficiencyLevels.find((p) => p.value === level);
    return prof ? prof.label : 'Intermediate';
  };

  return (
    <View style={[{ marginBottom: theme.spacing.lg }, style]}>
      {/* Label */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.medium,
            color: theme.colors.text.primary,
          }}
        >
          {label}
          {required && (
            <Text style={{ color: theme.colors.status.error }}> *</Text>
          )}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.tertiary,
          }}
        >
          {skills.length} / {maxSkills}
        </Text>
      </View>

      {/* Input Field with Add Button */}
      <View style={{ position: 'relative', zIndex: 1000 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: error
              ? theme.colors.status.error
              : theme.colors.border.light,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.neutral.white,
            marginBottom: showSuggestions ? theme.spacing.xs : theme.spacing.md,
          }}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.text.tertiary}
            style={{ marginRight: theme.spacing.sm }}
          />
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
              data={filteredSuggestions}
              keyExtractor={(item, index) =>
                `suggestion-${index}-${item.skill_name || item.label}`
              }
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => selectSuggestion(item)}
                  activeOpacity={0.7}
                  style={{
                    padding: theme.spacing.md,
                    borderBottomWidth:
                      index < filteredSuggestions.length - 1 ? 1 : 0,
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
                        fontFamily: theme.typography.fonts.medium,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {item.skill_name || item.label}
                    </Text>
                    {(item.skill_category || item.category) && (
                      <Text
                        style={{
                          fontSize: theme.typography.sizes.xs,
                          color: theme.colors.text.secondary,
                          marginTop: theme.spacing.xs,
                        }}
                      >
                        {item.skill_category || item.category}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={theme.colors.primary.teal}
                  />
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
            marginTop: -theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          }}
        >
          {error}
        </Text>
      )}

      {/* Selected Skills - Enhanced Cards with Better Touch Targets */}
      <View
        style={{
          marginTop: theme.spacing.sm,
        }}
      >
        {skills.map((skill, index) => {
          const skillObj = typeof skill === 'string'
            ? { skill_name: skill, proficiency_level: 'intermediate', years_of_experience: 0 }
            : skill;

          return (
            <View
              key={`skill-${index}-${getSkillName(skill)}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background.card,
                borderRadius: theme.borderRadius.lg,
                marginBottom: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border.light,
                borderLeftWidth: 4,
                borderLeftColor: getProficiencyColor(skillObj.proficiency_level),
                overflow: 'hidden',
                ...theme.shadows.sm,
              }}
            >
              {/* Main Clickable Area - Edit */}
              <TouchableOpacity
                onPress={() => openEditModal(skill, index)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Skill Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.base,
                        fontFamily: theme.typography.fonts.semiBold,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      {getSkillName(skill)}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                      }}
                    >
                      {/* Proficiency Badge */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getProficiencyColor(
                              skillObj.proficiency_level
                            ),
                          }}
                        />
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.xs,
                            fontFamily: theme.typography.fonts.medium,
                            color: getProficiencyColor(skillObj.proficiency_level),
                          }}
                        >
                          {getProficiencyLabel(skillObj.proficiency_level)}
                        </Text>
                      </View>

                      {/* Years of Experience */}
                      {skillObj.years_of_experience > 0 && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.xs,
                          }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={theme.colors.text.tertiary}
                          />
                          <Text
                            style={{
                              fontSize: theme.typography.sizes.xs,
                              fontFamily: theme.typography.fonts.regular,
                              color: theme.colors.text.secondary,
                            }}
                          >
                            {skillObj.years_of_experience}{' '}
                            {skillObj.years_of_experience === 1 ? 'year' : 'years'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Edit Icon Indicator */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: theme.colors.background.accent,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: theme.spacing.sm,
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={theme.colors.primary.teal}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Separate Delete Button with Clear Visual Separation */}
              <View
                style={{
                  width: 1,
                  height: '100%',
                  backgroundColor: theme.colors.border.light,
                }}
              />
              <TouchableOpacity
                onPress={() => removeSkill(index)}
                activeOpacity={0.7}
                style={{
                  padding: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: theme.colors.neutral.offWhite,
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.status.error}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Helper Text */}
      {skills.length === 0 && (
        <View
          style={{
            backgroundColor: theme.colors.background.accent,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginTop: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            borderStyle: 'dashed',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="code-slash-outline"
            size={32}
            color={theme.colors.primary.teal}
            style={{ marginBottom: theme.spacing.sm }}
          />
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing.xs,
            }}
          >
            No skills added yet
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
              textAlign: 'center',
            }}
          >
            Start typing to search and add skills
          </Text>
        </View>
      )}

      {/* Edit Skill Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.background.card,
              borderTopLeftRadius: theme.borderRadius.xxl,
              borderTopRightRadius: theme.borderRadius.xxl,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.xxxl,
              maxHeight: '85%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.light,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.background.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: theme.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={theme.colors.primary.teal}
                  />
                </View>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.lg,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.text.primary,
                  }}
                >
                  Edit Skill
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeEditModal}
                activeOpacity={0.7}
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.neutral.lightGray,
                }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={{ paddingHorizontal: theme.spacing.lg }}
              contentContainerStyle={{ paddingVertical: theme.spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              {/* Skill Name */}
              <View style={{ marginBottom: theme.spacing.xl }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Skill Name
                </Text>
                <TextInput
                  value={modalSkillName}
                  onChangeText={setModalSkillName}
                  placeholder="e.g., React Native"
                  placeholderTextColor={theme.colors.text.placeholder}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border.light,
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.md,
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.neutral.white,
                  }}
                />
              </View>

              {/* Proficiency Level */}
              <View style={{ marginBottom: theme.spacing.xl }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  Proficiency Level
                </Text>
                <View style={{ gap: theme.spacing.sm }}>
                  {proficiencyLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      onPress={() => setModalProficiency(level.value)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: theme.spacing.md,
                        borderWidth: 2,
                        borderColor:
                          modalProficiency === level.value
                            ? level.color
                            : theme.colors.border.light,
                        borderRadius: theme.borderRadius.lg,
                        backgroundColor:
                          modalProficiency === level.value
                            ? level.color + '10'
                            : theme.colors.neutral.white,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor:
                            modalProficiency === level.value
                              ? level.color
                              : theme.colors.border.medium,
                          backgroundColor:
                            modalProficiency === level.value
                              ? level.color
                              : 'transparent',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: theme.spacing.md,
                        }}
                      >
                        {modalProficiency === level.value && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={theme.colors.neutral.white}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: theme.typography.sizes.base,
                            fontFamily:
                              modalProficiency === level.value
                                ? theme.typography.fonts.semiBold
                                : theme.typography.fonts.medium,
                            color:
                              modalProficiency === level.value
                                ? level.color
                                : theme.colors.text.primary,
                          }}
                        >
                          {level.label}
                        </Text>
                      </View>
                      {modalProficiency === level.value && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={level.color}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Years of Experience */}
              <View style={{ marginBottom: theme.spacing.xl }}>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.sm,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Years of Experience
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.border.light,
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: theme.spacing.md,
                    backgroundColor: theme.colors.neutral.white,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <TextInput
                    value={modalYears}
                    onChangeText={(text) => {
                      // Only allow numbers
                      if (text === '' || /^\d+$/.test(text)) {
                        setModalYears(text);
                      }
                    }}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.placeholder}
                    keyboardType="number-pad"
                    style={{
                      flex: 1,
                      paddingVertical: theme.spacing.md,
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: theme.colors.text.primary,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.text.tertiary,
                    }}
                  >
                    years
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: theme.spacing.md }}>
                {/* Save Button */}
                <TouchableOpacity
                  onPress={saveSkillEdit}
                  disabled={!modalSkillName.trim()}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: modalSkillName.trim()
                      ? theme.colors.primary.teal
                      : theme.colors.neutral.mediumGray,
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.md,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    ...theme.shadows.sm,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.neutral.white}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    Save Changes
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => {
                    removeSkill(editingIndex);
                    closeEditModal();
                  }}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: theme.colors.neutral.lightGray,
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.md,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.status.error,
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.colors.status.error}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.semiBold,
                      color: theme.colors.status.error,
                    }}
                  >
                    Delete Skill
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SkillsInput4;