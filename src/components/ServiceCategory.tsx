import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface ServiceCategoryProps {
  name: string;
  icon: string;
  count?: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export const ServiceCategory: React.FC<ServiceCategoryProps> = ({
  name,
  icon,
  count,
  isSelected = false,
  onPress,
}) => {
  const getIconName = (iconKey: string) => {
    const iconMap: Record<string, any> = {
      truck: 'car-outline',
      sparkles: 'sparkles-outline',
      cube: 'cube-outline',
      construct: 'construct-outline',
      home: 'home-outline',
      brush: 'brush-outline',
      grid: 'grid-outline',
    };
    return iconMap[iconKey] || 'ellipse-outline';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconCircle,
          isSelected && styles.iconCircleSelected,
        ]}
      >
        <Ionicons
          name={getIconName(icon)}
          size={28}
          color={isSelected ? Colors.white : Colors.deepCocoa}
        />
      </View>
      <Text
        style={[
          styles.name,
          isSelected && styles.nameSelected,
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>
      {count !== undefined && (
        <Text style={styles.count}>{count} available</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 85,
    marginRight: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconCircleSelected: {
    backgroundColor: Colors.matteClay,
  },
  name: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: Colors.deepCocoa,
    textAlign: 'center',
  },
  nameSelected: {
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  count: {
    fontSize: Typography.tiny,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
