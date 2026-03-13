import CustomInput from '@/components/CustomInput';
import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/**
 * SkillsInput2 Component - UPDATED VERSION
 * 
 * Now allows free-text skill entry. Backend will:
 * 1. Check if skill exists in database
 * 2. If exists, use existing skill_id
 * 3. If not exists, create new skill and get new skill_id
 * 
 * This component just handles the UI, sending skill names to parent
 */

const SkillsInput2 = ({
  skills = [],
  onSkillsChange,
  label = 'Skills (Add up to 10 skills)',
  placeholder = 'Type any skill and press Add...',
  maxSkills = 10,
  maxSkillLength = 50, // Increased from 30 to allow longer skill names
  required = false,
  error = null,
  style,
}) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    const skillText = newSkill.trim();

    // Validate skill input
    if (!skillText) return;
    if (skills.length >= maxSkills) return;
    
    // Minimum length check
    if (skillText.length < 2) {
      // Skill too short
      return;
    }

    // Check if skill already exists in current list (case insensitive)
    const existingSkill = skills.find(skill =>
      getSkillName(skill).toLowerCase() === skillText.toLowerCase()
    );

    if (existingSkill) {
      // Skill already added
      return;
    }

    // Create skill object with just the name
    // Backend will handle looking up/creating the skill_id
    const newSkillObj = {
      skill_name: skillText,
      proficiency_level: 'intermediate', // Default proficiency
      is_new: true // Flag to indicate this needs backend processing
    };

    onSkillsChange([...skills, newSkillObj]);
    setNewSkill('');
  };

  const removeSkill = (index) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onSkillsChange(updatedSkills);
  };

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    return skill.skill_name || skill.label || skill.value || '';
  };

  const handleSubmitEditing = () => {
    const skillText = newSkill.trim();
    if (skillText && 
        skillText.length >= 2 && 
        skills.length < maxSkills && 
        !skills.find(s => getSkillName(s).toLowerCase() === skillText.toLowerCase())
    ) {
      addSkill();
    }
  };

  return (
    <View style={[{ marginBottom: theme.spacing.lg }, style]}>
      {/* Label */}
      <Text
        style={{
          fontSize: theme.typography.sizes.sm,
          fontFamily: theme.typography.fonts.medium,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xs,
        }}
      >
        {label} {required && '*'}
      </Text>

      {/* Helper text */}
      <Text
        style={{
          fontSize: theme.typography.sizes.xs,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.tertiary,
          marginBottom: theme.spacing.sm,
        }}
      >
        Type any skill (eg: React, Python, Marketing) and click Add
      </Text>

      {/* Add Skill Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.md,
        }}
      >
        <CustomInput
          value={newSkill}
          onChangeText={setNewSkill}
          placeholder={placeholder}
          style={{ flex: 1, marginBottom: 0, marginRight: theme.spacing.sm }}
          maxLength={maxSkillLength}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={handleSubmitEditing}
          autoCapitalize="words" // Capitalize first letter of each word
        />
        <TouchableOpacity
          onPress={addSkill}
          disabled={!newSkill.trim() || newSkill.trim().length < 2 || skills.length >= maxSkills}
          style={{
            backgroundColor:
              newSkill.trim() && newSkill.trim().length >= 2 && skills.length < maxSkills
                ? theme.colors.primary.teal
                : theme.colors.neutral.mediumGray,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.sm,
            justifyContent: "center",
            alignItems: "center",
            minWidth: 50,
            height: 50,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={theme.colors.neutral.white} />
        </TouchableOpacity>
      </View>

      {/* Skills Tags */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: theme.spacing.sm,
        }}
      >
        {skills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const isNewSkill = skill.is_new === true; // Skill not yet in database
          
          return (
            <View
              key={`skill-${index}-${skillName}`}
              style={{
                backgroundColor: theme.colors.background.accent,
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                marginRight: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isNewSkill 
                  ? theme.colors.status.warning // Orange border for new skills
                  : theme.colors.primary.teal,
              }}
            >
              {isNewSkill && (
                <Ionicons
                  name="star"
                  size={12}
                  color={theme.colors.status.warning}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.medium,
                  color: isNewSkill 
                    ? theme.colors.status.warning
                    : theme.colors.primary.teal,
                  marginRight: theme.spacing.xs,
                }}
              >
                {skillName}
              </Text>
              <TouchableOpacity
                onPress={() => removeSkill(index)}
                activeOpacity={0.7}
                style={{
                  padding: 2, // Extra touch area
                }}
              >
                <Ionicons
                  name="close"
                  size={14}
                  color={isNewSkill 
                    ? theme.colors.status.warning
                    : theme.colors.primary.teal}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Skills count and legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {skills.some(s => s.is_new) && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="star"
              size={12}
              color={theme.colors.status.warning}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.tertiary,
              }}
            >
              New skill (will be added to database)
            </Text>
          </View>
        )}
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.tertiary,
            marginLeft: 'auto',
          }}
        >
          {skills.length}/{maxSkills} skills
        </Text>
      </View>

      {/* Error message */}
      {error && (
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.status.error,
            marginTop: theme.spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default SkillsInput2;