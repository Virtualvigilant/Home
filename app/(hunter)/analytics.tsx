import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { usePropertyStore } from '../../src/store/propertyStore';

export default function AnalyticsScreen() {
  const { hunterLeads } = usePropertyStore();

  const totalLeads = hunterLeads.length;
  const verifiedLeads = hunterLeads.filter((l) => l.status === 'Verified' || l.status === 'Booked').length;
  const bookedLeads = hunterLeads.filter((l) => l.status === 'Booked').length;
  const conversionRate = totalLeads > 0 ? `${Math.round((bookedLeads / totalLeads) * 100)}%` : '0%';

  const stats = [
    { label: 'Total Leads', value: `${totalLeads}`, icon: 'people-outline', color: Colors.matteClay },
    { label: 'Verified', value: `${verifiedLeads}`, icon: 'shield-checkmark-outline', color: Colors.badgeVerified },
    { label: 'Booked', value: `${bookedLeads}`, icon: 'checkmark-circle-outline', color: Colors.badgeSuccess },
    { label: 'Conversion', value: conversionRate, icon: 'trending-up-outline', color: Colors.info },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Analytics Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Leads Performance</Text>
          {totalLeads === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bar-chart-outline" size={42} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Performance Data Yet</Text>
              <Text style={styles.emptySubtitle}>
                Once you start submitting and verifying property leads, your monthly analytics and conversion metrics will render here.
              </Text>
            </View>
          ) : (
            <Text style={styles.activeText}>Showing real-time conversion metrics across your verified property leads.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  statCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, ...Shadows.card,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  statLabel: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  chartCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    margin: Spacing.lg, padding: Spacing.lg, ...Shadows.card,
  },
  chartTitle: { fontSize: Typography.h3, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginBottom: Spacing.sm },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  activeText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
