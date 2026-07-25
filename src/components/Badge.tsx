import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'verified' | 'new' | 'success' | 'pending' | 'saved' | 'default';
  size?: 'small' | 'medium';
}

const variantColors = {
  verified: { bg: Colors.badgeVerified, text: Colors.white },
  new: { bg: Colors.badgeNew, text: Colors.white },
  success: { bg: Colors.badgeSuccess, text: Colors.white },
  pending: { bg: Colors.badgePending, text: Colors.white },
  saved: { bg: Colors.matteClay, text: Colors.white },
  default: { bg: Colors.warmAlmond, text: Colors.deepCocoa },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'small',
}) => {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'medium' && styles.badgeMedium,
      ]}
    >
      {variant === 'verified' && (
        <Text style={[styles.icon, { color: colors.text }]}>✓ </Text>
      )}
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'medium' && styles.textMedium,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  badgeMedium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  icon: {
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
  },
  text: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
  },
  textMedium: {
    fontSize: Typography.caption,
  },
});
