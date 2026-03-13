// Manvue App Theme Configuration
// Primary theme colors from logo and design system

export const colors = {
  // Primary Theme Colors
  primary: {
    teal: '#1BA3A3',
    orange: '#FF8A3D', 
    deepBlue: '#1E4A72',
  },
  
  // Extended Color Palette
  secondary: {
    lightTeal: '#4DB6B6',
    darkTeal: '#158B8B',
    lightOrange: '#FFB366',
    darkOrange: '#E6722A',
    lightBlue: '#2E5A82',
    darkBlue: '#0F3552',
  },
  
  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    offWhite: '#FAFAFA',
    lightGray: '#F5F5F5',
    gray: '#E5E5E5',
    mediumGray: '#9CA3AF',
    darkGray: '#6B7280',
    charcoal: '#374151',
    black: '#000000',
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Background Variants
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    accent: '#F0FDFD', // Very light teal
    card: '#FFFFFF',
    modal: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text Colors
  text: {
    primary: '#1E4A72', // Deep blue for headers
    secondary: '#374151', // Charcoal for body text
    tertiary: '#6B7280', // Medium gray for captions
    inverse: '#FFFFFF', // White text on dark backgrounds
    accent: '#1BA3A3', // Teal for links/accents
    placeholder: '#9CA3AF',
  },
  
  // Border Colors
  border: {
    light: '#E5E5E5',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    focus: '#1BA3A3',
    error: '#EF4444',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  // Font Families
  fonts: {
    thin: 'Outfit-Thin',
    extraLight: 'Outfit-ExtraLight',
    light: 'Outfit-Light',
    regular: 'Outfit-Regular',
    medium: 'Outfit-Medium',
    semiBold: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
    extraBold: 'Outfit-ExtraBold',
    black: 'Outfit-Black',
  },
  
  // Font Sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    heading: 32,
    display: 40,
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};

// Animation Configurations
export const animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Gradient Definitions
export const gradients = {
  primary: ['#1BA3A3', '#158B8B'], // Teal gradient
  secondary: ['#FF8A3D', '#E6722A'], // Orange gradient
  accent: ['#1E4A72', '#0F3552'], // Blue gradient
  warm: ['#FF8A3D', '#1BA3A3'], // Orange to teal
  cool: ['#1BA3A3', '#1E4A72'], // Teal to blue
  subtle: ['#F0FDFD', '#FFFFFF'], // Very light teal to white
};

// Component-specific theme styles
export const componentStyles = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.primary.teal,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.md,
    },
    secondary: {
      backgroundColor: colors.primary.orange,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      ...shadows.md,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary.teal,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md - 2, // Account for border
      paddingHorizontal: spacing.xl,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
  },
  
  // Card Styles
  card: {
    default: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      ...shadows.md,
    },
    elevated: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      ...shadows.lg,
    },
    flat: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  },
  
  // Input Styles
  input: {
    default: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      fontSize: typography.sizes.base,
      fontFamily: typography.fonts.regular,
      color: colors.text.primary,
    },
    focused: {
      borderColor: colors.border.focus,
      borderWidth: 2,
      ...shadows.sm,
    },
    error: {
      borderColor: colors.border.error,
      borderWidth: 2,
    },
  },
  
  // Header Styles
  header: {
    default: {
      backgroundColor: colors.background.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    elevated: {
      backgroundColor: colors.background.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      ...shadows.sm,
    },
  },
};

// Utility functions for theme usage
export const getColor = (colorPath) => {
  const keys = colorPath.split('.');
  let result = colors;
  
  for (const key of keys) {
    if (result[key]) {
      result = result[key];
    } else {
      console.warn(`Color path "${colorPath}" not found in theme`);
      return colors.primary.teal; // Fallback color
    }
  }
  
  return result;
};

export const getSpacing = (multiplier = 1) => spacing.md * multiplier;

export const getFontStyle = (size, weight = 'regular', color = 'text.primary') => ({
  fontSize: typography.sizes[size] || typography.sizes.base,
  fontFamily: typography.fonts[weight] || typography.fonts.regular,
  color: getColor(color),
});

// Export default theme object
export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  animations,
  gradients,
  componentStyles,
  getColor,
  getSpacing,
  getFontStyle,
};