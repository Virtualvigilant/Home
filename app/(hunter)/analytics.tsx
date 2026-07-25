import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const stats = [
  { label: 'Total Leads', value: '24', icon: 'people-outline', color: Colors.matteClay },
  { label: 'Verified', value: '18', icon: 'shield-checkmark-outline', color: Colors.badgeVerified },
  { label: 'Booked', value: '12', icon: 'checkmark-circle-outline', color: Colors.badgeSuccess },
  { label: 'Conversion', value: '67%', icon: 'trending-up-outline', color: Colors.info },
];

const monthlyData = [
  { month: 'Jan', leads: 3 },
  { month: 'Feb', leads: 5 },
  { month: 'Mar', leads: 4 },
  { month: 'Apr', leads: 7 },
  { month: 'May', leads: 6 },
  { month: 'Jun', leads: 8 },
];

export default function AnalyticsScreen() {
  const maxLeads = Math.max(...monthlyData.map(d => d.leads));

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

        {/* Simple Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Leads</Text>
          <View style={styles.chart}>
            {monthlyData.map((item) => (
              <View key={item.month} style={styles.barContainer}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${(item.leads / maxLeads) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>
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
  chartTitle: { fontSize: Typography.h3, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginBottom: Spacing.lg },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 140, alignItems: 'flex-end' },
  barContainer: { alignItems: 'center', flex: 1 },
  barTrack: { width: 28, height: 120, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: Colors.matteClay, borderRadius: 6 },
  barLabel: { fontSize: Typography.tiny, color: Colors.textSecondary, marginTop: Spacing.xs },
});
