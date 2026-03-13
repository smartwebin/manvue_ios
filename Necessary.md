# Necessary Database Changes for AI-Powered Skill Suggestions

## Overview
This document outlines the database schema changes required for implementing AI-powered skill suggestions using OpenAI GPT-5-nano.

## New Tables

### 1. `skill_search_cache` - Store AI-generated skill suggestions
This table caches AI-generated skill suggestions to improve performance and consistency.

```sql
CREATE TABLE `skill_search_cache` (
  `cache_id` int(11) NOT NULL AUTO_INCREMENT,
  `search_term` varchar(255) NOT NULL COMMENT 'Original search phrase from user',
  `normalized_search` varchar(255) NOT NULL COMMENT 'Normalized/lowercased search term for matching',
  `suggested_skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'JSON array of AI-suggested skills' CHECK (json_valid(`suggested_skills`)),
  `context_type` enum('jobseeker','employer','general') DEFAULT 'general' COMMENT 'Context in which search was made',
  `usage_count` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of times this cache entry was used',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_used_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'Cache expiration date (optional)',
  PRIMARY KEY (`cache_id`),
  KEY `idx_normalized_search` (`normalized_search`),
  KEY `idx_search_term` (`search_term`),
  KEY `idx_context_type` (`context_type`),
  KEY `idx_usage_count` (`usage_count`),
  KEY `idx_last_used` (`last_used_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cache for AI-generated skill suggestions';
```

**Structure of `suggested_skills` JSON:**
```json
[
  {
    "skill_name": "React",
    "skill_category": "Frontend Development",
    "relevance_score": 0.95,
    "skill_id": 123
  },
  {
    "skill_name": "JavaScript",
    "skill_category": "Programming Languages",
    "relevance_score": 0.90,
    "skill_id": 124
  }
]
```

### 2. `skill_synonyms` - Map similar skill terms
This table helps identify when different search terms mean the same skill.

```sql
CREATE TABLE `skill_synonyms` (
  `synonym_id` int(11) NOT NULL AUTO_INCREMENT,
  `primary_skill_id` int(11) NOT NULL COMMENT 'Main skill ID from skills table',
  `synonym_term` varchar(100) NOT NULL COMMENT 'Alternative name for the skill',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`synonym_id`),
  UNIQUE KEY `unique_synonym` (`synonym_term`),
  KEY `idx_primary_skill` (`primary_skill_id`),
  CONSTRAINT `fk_skill_synonyms_skill` FOREIGN KEY (`primary_skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Skill synonym mapping for better search matching';
```

## Modifications to Existing Tables

### 1. Add new columns to `skills` table

```sql
ALTER TABLE `skills`
ADD COLUMN `ai_generated` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Flag if skill was added via AI suggestions' AFTER `is_popular`,
ADD COLUMN `times_suggested` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of times AI suggested this skill' AFTER `ai_generated`,
ADD COLUMN `times_selected` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of times users selected this skill' AFTER `times_suggested`,
ADD COLUMN `relevance_score` decimal(5,2) DEFAULT NULL COMMENT 'Average AI relevance score' AFTER `times_selected`,
ADD INDEX `idx_ai_generated` (`ai_generated`),
ADD INDEX `idx_times_suggested` (`times_suggested`),
ADD INDEX `idx_times_selected` (`times_selected`);
```

## New Configuration Table

### `ai_config` - Store OpenAI API configuration

```sql
CREATE TABLE `ai_config` (
  `config_id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT 'Configuration key',
  `config_value` text NOT NULL COMMENT 'Configuration value',
  `is_encrypted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether value is encrypted',
  `description` text DEFAULT NULL COMMENT 'Description of this config',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether this config is active',
  `updated_by` int(11) DEFAULT NULL COMMENT 'Admin ID who last updated',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `unique_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OpenAI and AI configuration settings';
```

### Insert default AI configuration:

```sql
INSERT INTO `ai_config` (`config_key`, `config_value`, `description`, `is_active`) VALUES
('openai_api_key', 'your-openai-api-key-here', 'OpenAI API Key for GPT-5-nano', 1),
('openai_model', 'gpt-5-nano', 'OpenAI model to use for skill suggestions', 1),
('max_suggestions', '10', 'Maximum number of skill suggestions to return', 1),
('cache_duration_days', '30', 'Number of days to cache skill suggestions', 1),
('enable_ai_suggestions', '1', 'Enable or disable AI-powered skill suggestions', 1),
('reasoning_effort', 'low', 'Reasoning effort for GPT-5 (low, medium, high)', 1);
```

## Indexes for Performance

All necessary indexes are included in the table creation statements above.

## Data Migration

### Step 1: Populate skill synonyms (examples)

```sql
-- Add common skill synonyms
INSERT INTO `skill_synonyms` (`primary_skill_id`, `synonym_term`)
SELECT skill_id, 'ReactJS' FROM skills WHERE skill_name = 'React' LIMIT 1;

INSERT INTO `skill_synonyms` (`primary_skill_id`, `synonym_term`)
SELECT skill_id, 'React.js' FROM skills WHERE skill_name = 'React' LIMIT 1;

INSERT INTO `skill_synonyms` (`primary_skill_id`, `synonym_term`)
SELECT skill_id, 'JS' FROM skills WHERE skill_name = 'JavaScript' LIMIT 1;

-- Add more as needed...
```

## Implementation Notes

1. **Cache Management**:
   - Implement cache cleanup for entries older than `cache_duration_days`
   - Update `usage_count` when cache entries are reused
   - Update `last_used_at` timestamp on cache hits

2. **AI Suggestion Flow**:
   - User types a skill search term
   - Check `skill_search_cache` for existing suggestions (match on `normalized_search`)
   - If cache miss, call OpenAI API to generate suggestions
   - Store ALL suggested skills in `skills` table (if not exists)
   - Store suggestions in `skill_search_cache`
   - Return suggestions to user
   - When user selects a skill, increment `times_selected` in `skills` table

3. **Performance Optimization**:
   - Cache frequently searched terms
   - Use normalized search terms for better cache hits
   - Implement periodic cleanup of unused cache entries

4. **Security**:
   - Encrypt `openai_api_key` in `ai_config` table
   - Implement rate limiting on AI API calls
   - Validate and sanitize all user inputs before AI processing

## Testing Queries

### Test skill search cache insertion:
```sql
INSERT INTO `skill_search_cache`
(`search_term`, `normalized_search`, `suggested_skills`, `context_type`)
VALUES
('React Developer', 'react developer',
'[{"skill_name":"React","skill_category":"Frontend","relevance_score":0.95},{"skill_name":"JavaScript","skill_category":"Programming","relevance_score":0.90}]',
'jobseeker');
```

### Test cache lookup:
```sql
SELECT * FROM skill_search_cache
WHERE normalized_search = 'react developer'
AND context_type = 'jobseeker'
ORDER BY last_used_at DESC
LIMIT 1;
```

### Update skill usage statistics:
```sql
UPDATE skills
SET times_selected = times_selected + 1
WHERE skill_id = 123;
```

## Rollback Plan

If needed, execute these statements to rollback changes:

```sql
-- Drop new tables
DROP TABLE IF EXISTS `skill_search_cache`;
DROP TABLE IF EXISTS `skill_synonyms`;
DROP TABLE IF EXISTS `ai_config`;

-- Remove new columns from skills table
ALTER TABLE `skills`
DROP COLUMN `ai_generated`,
DROP COLUMN `times_suggested`,
DROP COLUMN `times_selected`,
DROP COLUMN `relevance_score`;
```

## Next Steps

1. Execute the SQL statements in a development environment first
2. Test thoroughly with sample data
3. Backup production database before applying changes
4. Execute SQL statements in production during low-traffic hours
5. Monitor performance and adjust indexes as needed
6. Implement API endpoints for AI skill suggestions
7. Update frontend components to use new AI suggestion system
