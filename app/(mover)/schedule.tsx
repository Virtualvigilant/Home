import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const scheduleData = [
  { id: '1', day: 'Today', date: 'Jul 20', jobs: [
    { time: '8:00 AM', client: 'James Kariuki', route: 'Kilimani → Kileleshwa', status: 'active' },
  ]},
  { id: '2', day: 'Tuesday', date: 'Jul 22', jobs: [
    { time: '9:00 AM', client: 'Aisha Mohammed', route: 'Westlands → Runda', status: 'upcoming' },
  ]},
  { id: '3', day: 'Thursday', date: 'Jul 24', jobs: [] },
];

export default function ScheduleScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>July 2024</Text>
        </View>

        {scheduleData.map((day) => (
          <View key={day.id} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day.day}</Text>
              <Text style={styles.dayDate}>{day.date}</Text>
            </View>
            {day.jobs.length > 0 ? (
              day.jobs.map((job, idx) => (
                <View key={idx} style={styles.jobItem}>
                  <View style={[
                    styles.timeIndicator,
                    { backgroundColor: job.status === 'active' ? Colors.matteClay : Colors.warmAlmond }
                  ]} />
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTime}>{job.time}</Text>
                    <Text style={styles.jobClient}>{job.client}</Text>
                    <View style={styles.routeRow}>
                      <Ionicons name="navigate-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.routeText}> {job.route}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.freeDay}>
                <Text style={styles.freeDayText}>No jobs scheduled</Text>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  daySection: { marginTop: Spacing.lg },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  dayTitle: { fontSize: Typography.h3, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  dayDate: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  jobItem: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, padding: Spacing.lg, ...Shadows.card,
  },
  timeIndicator: { width: 4, borderRadius: 2, marginRight: Spacing.md },
  jobInfo: { flex: 1 },
  jobTime: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.matteClay },
  jobClient: { fontSize: Typography.body, fontWeight: Typography.medium, color: Colors.deepCocoa, marginTop: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  routeText: { fontSize: Typography.caption, color: Colors.textTertiary },
  freeDay: {
    backgroundColor: Colors.borderLight, borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg, padding: Spacing.lg, alignItems: 'center',
  },
  freeDayText: { fontSize: Typography.bodySmall, color: Colors.textTertiary },
});
