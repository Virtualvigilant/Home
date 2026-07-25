// Design system tokens matching the Home App specification
// Warm, organic, high-end lifestyle design language

export const Colors = {
  // Primary palette
  softCream: '#F7F4F0',
  deepCocoa: '#3D2314',
  matteClay: '#A67C52',
  warmAlmond: '#D9C5B2',

  // Surfaces
  white: '#FFFFFF',
  cardBackground: '#FFFFFF',
  overlay: 'rgba(61, 35, 20, 0.5)',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E53935',
  info: '#2196F3',

  // Text
  textPrimary: '#3D2314',
  textSecondary: '#7A6B5D',
  textTertiary: '#A89B8C',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#D9C5B2',
  borderLight: '#E8DDD2',
  divider: '#E8DDD2',

  // Tab & Navigation
  tabActive: '#A67C52',
  tabInactive: '#A89B8C',
  tabIndicator: '#3D2314',

  // Badge colors
  badgeVerified: '#4CAF50',
  badgeNew: '#FF9800',
  badgeSuccess: '#4CAF50',
  badgePending: '#FF9800',

  // Shadows
  shadowColor: '#3D2314',
};

export const Typography = {
  // Font sizes
  hero: 28,
  h1: 24,
  h2: 20,
  h3: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,

  // Font weights
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 50,
  round: 9999,
};

export const Shadows = {
  card: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  bottomTab: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
};
