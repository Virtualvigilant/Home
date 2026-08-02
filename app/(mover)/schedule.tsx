import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

interface ScheduleDay {
  id: string;
  day: string;
  date: string;
  jobs: Array<{
    time: string;
    client: string;
    route: string;
    status: string;
  }>;
}

export default function ScheduleScreen() {
  const scheduleData: ScheduleDay[] = [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
        </View>

        {scheduleData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Scheduled Moves</Text>
            <Text style={styles.emptySubtitle}>
              Accepted moving jobs and scheduled client relocations will appear here.
            </Text>
          </View>
        ) : (
          scheduleData.map((day) => (
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
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  emptyCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  emptyTitle: {
    fontSize: Typography.h3,
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
  daySection: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  dayTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  dayDate: { fontSize: Typography.caption, color: Colors.textTertiary },
  jobItem: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.card,
  },
  timeIndicator: { width: 4, borderRadius: 2, marginRight: Spacing.md },
  jobInfo: { flex: 1 },
  jobTime: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.matteClay },
  jobClient: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  routeText: { fontSize: Typography.caption, color: Colors.textSecondary },
  freeDay: { padding: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, alignItems: 'center' },
  freeDayText: { fontSize: Typography.caption, color: Colors.textTertiary },
});
