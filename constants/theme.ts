/**
 * Eco-Relais Design System
 *
 * Identité visuelle:
 * - Vert: écologie, durabilité
 * - Bleu: confiance, fiabilité
 * - Orange: dynamisme, action
 * - Style chaleureux et humain
 */

import { Platform } from 'react-native';

// =============================================================================
// COULEURS ECO-RELAIS
// =============================================================================

/**
 * Palette de couleurs officielle Eco-Relais
 */
export const Palette = {
  // Primary - Vert (écologie)
  green: {
    dark: '#2D5A27',   // Primary main
    light: '#A8D5BA',  // Primary light
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A8D5BA',    // = light
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2D5A27',    // = dark
    900: '#1B5E20',
  },

  // Secondary - Bleu (confiance)
  blue: {
    dark: '#1E3A8A',   // Secondary main
    light: '#E0F2FE',  // Secondary light
    50: '#E0F2FE',     // = light
    100: '#BAE6FD',
    200: '#7DD3FC',
    300: '#38BDF8',
    400: '#0EA5E9',
    500: '#0284C7',
    600: '#0369A1',
    700: '#075985',
    800: '#0C4A6E',
    900: '#1E3A8A',    // = dark
  },

  // Accent - Orange (dynamisme)
  orange: {
    main: '#F97316',   // Accent main
    light: '#FEF3C7',  // Accent light
    50: '#FEF3C7',     // = light
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',    // = main
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Semantic
  success: '#2D5A27',  // Vert primary
  error: '#EF4444',
  warning: '#F97316',  // Orange accent
  info: '#1E3A8A',     // Bleu secondary
} as const;

/**
 * Thème clair et sombre
 */
export const Colors = {
  light: {
    // Backgrounds
    background: Palette.white,
    backgroundSecondary: Palette.gray[50],
    backgroundTertiary: Palette.gray[100],

    // Surfaces (cards, modals)
    surface: Palette.white,
    surfaceElevated: Palette.white,

    // Text
    text: Palette.gray[900],
    textSecondary: Palette.gray[600],
    textTertiary: Palette.gray[400],
    textInverse: Palette.white,

    // Primary (vert)
    primary: Palette.green.dark,         // #2D5A27
    primaryLight: Palette.green.light,   // #A8D5BA
    primaryDark: Palette.green[900],
    onPrimary: Palette.white,

    // Secondary (bleu)
    secondary: Palette.blue.dark,        // #1E3A8A
    secondaryLight: Palette.blue.light,  // #E0F2FE
    secondaryDark: Palette.blue[900],
    onSecondary: Palette.white,

    // Accent (orange)
    accent: Palette.orange.main,         // #F97316
    accentLight: Palette.orange.light,   // #FEF3C7
    accentDark: Palette.orange[700],
    onAccent: Palette.white,

    // Semantic
    success: Palette.green.dark,
    successLight: Palette.green.light,
    error: Palette.error,
    errorLight: '#FEE2E2',
    warning: Palette.orange.main,
    warningLight: Palette.orange.light,
    info: Palette.blue.dark,
    infoLight: Palette.blue.light,

    // Borders
    border: Palette.gray[200],
    borderFocused: Palette.green.dark,

    // Icons
    icon: Palette.gray[500],
    iconSecondary: Palette.gray[400],

    // Navigation
    tabIconDefault: Palette.gray[400],
    tabIconSelected: Palette.green.dark,
    tint: Palette.green.dark,

    // Status colis
    statusPending: Palette.gray[400],
    statusAssigned: Palette.blue.dark,
    statusCollected: Palette.orange.main,
    statusDelivered: Palette.green.dark,

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  dark: {
    // Backgrounds
    background: Palette.gray[900],
    backgroundSecondary: Palette.gray[800],
    backgroundTertiary: Palette.gray[700],

    // Surfaces (cards, modals)
    surface: Palette.gray[800],
    surfaceElevated: Palette.gray[700],

    // Text
    text: Palette.gray[50],
    textSecondary: Palette.gray[300],
    textTertiary: Palette.gray[500],
    textInverse: Palette.gray[900],

    // Primary (vert)
    primary: Palette.green.light,        // #A8D5BA
    primaryLight: Palette.green[900],
    primaryDark: Palette.green[300],
    onPrimary: Palette.gray[900],

    // Secondary (bleu)
    secondary: Palette.blue[300],
    secondaryLight: Palette.blue[900],
    secondaryDark: Palette.blue[200],
    onSecondary: Palette.gray[900],

    // Accent (orange)
    accent: Palette.orange[400],
    accentLight: Palette.orange[900],
    accentDark: Palette.orange[300],
    onAccent: Palette.gray[900],

    // Semantic
    success: Palette.green.light,
    successLight: Palette.green[900],
    error: '#F87171',
    errorLight: '#7F1D1D',
    warning: Palette.orange[400],
    warningLight: '#78350F',
    info: Palette.blue[300],
    infoLight: Palette.blue[900],

    // Borders
    border: Palette.gray[700],
    borderFocused: Palette.green.light,

    // Icons
    icon: Palette.gray[400],
    iconSecondary: Palette.gray[500],

    // Navigation
    tabIconDefault: Palette.gray[500],
    tabIconSelected: Palette.green.light,
    tint: Palette.green.light,

    // Status colis
    statusPending: Palette.gray[500],
    statusAssigned: Palette.blue[300],
    statusCollected: Palette.orange[400],
    statusDelivered: Palette.green.light,

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

// =============================================================================
// TYPOGRAPHY - ARIAL
// =============================================================================

/**
 * Familles de polices - Arial
 */
export const FontFamily = Platform.select({
  ios: {
    regular: 'Arial',
    medium: 'Arial',
    semibold: 'Arial-BoldMT',
    bold: 'Arial-BoldMT',
  },
  android: {
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semibold: 'sans-serif-medium',
    bold: 'sans-serif-bold',
  },
  web: {
    regular: 'Arial, Helvetica, sans-serif',
    medium: 'Arial, Helvetica, sans-serif',
    semibold: 'Arial, Helvetica, sans-serif',
    bold: 'Arial, Helvetica, sans-serif',
  },
  default: {
    regular: 'Arial',
    medium: 'Arial',
    semibold: 'Arial',
    bold: 'Arial',
  },
}) as {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
};

/**
 * Tailles de police
 */
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

/**
 * Poids de police
 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Hauteurs de ligne
 */
export const LineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Styles de typographie prédéfinis
 */
export const Typography = {
  // Headings
  h1: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
    fontFamily: FontFamily.bold,
  },
  h2: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    fontFamily: FontFamily.bold,
  },
  h3: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize['2xl'] * LineHeight.tight,
    fontFamily: FontFamily.semibold,
  },
  h4: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.tight,
    fontFamily: FontFamily.semibold,
  },
  h5: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.lg * LineHeight.tight,
    fontFamily: FontFamily.semibold,
  },

  // Body
  bodyLarge: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.lg * LineHeight.normal,
    fontFamily: FontFamily.regular,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.normal,
    fontFamily: FontFamily.regular,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    fontFamily: FontFamily.regular,
  },

  // Labels
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
    fontFamily: FontFamily.medium,
  },
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
    fontFamily: FontFamily.medium,
  },

  // Special
  button: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.tight,
    fontFamily: FontFamily.semibold,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
    fontFamily: FontFamily.regular,
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

/**
 * Échelle d'espacement (multiples de 4)
 */
export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Rayons de bordure
 */
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * Ombres (iOS et Android)
 */
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: Palette.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

/**
 * Dimensions de layout
 */
export const Layout = {
  // Screen padding
  screenPaddingHorizontal: Spacing.base,
  screenPaddingVertical: Spacing.base,

  // Content max width (pour tablettes/web)
  contentMaxWidth: 600,

  // Tab bar
  tabBarHeight: 60,

  // Header
  headerHeight: 56,

  // Input
  inputHeight: 48,
  inputHeightLarge: 56,

  // Button
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  // Card
  cardPadding: Spacing.base,

  // Avatar
  avatarSizeSmall: 32,
  avatarSizeMedium: 48,
  avatarSizeLarge: 64,
  avatarSizeXLarge: 96,

  // Icon
  iconSizeSmall: 16,
  iconSizeMedium: 24,
  iconSizeLarge: 32,
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

/**
 * Durées d'animation
 */
export const Duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/**
 * Easing curves
 */
export const Easing = {
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = {
  [K in keyof typeof Colors.light]: string;
};
export type PaletteColor = keyof typeof Palette;
export type SpacingKey = keyof typeof Spacing;
export type FontSizeKey = keyof typeof FontSize;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type ShadowKey = keyof typeof Shadows;

// =============================================================================
// LEGACY EXPORTS (rétro-compatibilité)
// =============================================================================

/**
 * @deprecated Utiliser FontFamily à la place
 */
export const Fonts = {
  sans: FontFamily.regular,
  serif: FontFamily.regular,
  rounded: FontFamily.regular,
  mono: FontFamily.regular,
};
