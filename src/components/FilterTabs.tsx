import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface FilterTabsProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeTab,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [activeTab]);

  const tabWidth = 100 / tabs.length;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => onTabChange(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[
            styles.indicator,
            {
              width: `${tabWidth}%`,
              transform: [
                {
                  translateX: indicatorAnim.interpolate({
                    inputRange: tabs.map((_, i) => i),
                    outputRange: tabs.map((_, i) => i * (100 / tabs.length) * 3.5),
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.deepCocoa,
    fontWeight: Typography.semiBold,
  },
  indicatorTrack: {
    height: 2,
    backgroundColor: Colors.borderLight,
    borderRadius: 1,
  },
  indicator: {
    height: 2,
    backgroundColor: Colors.deepCocoa,
    borderRadius: 1,
  },
});
