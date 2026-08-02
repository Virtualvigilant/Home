import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

interface JobItem {
  id: string;
  clientName: string;
  clientAvatar: string;
  from: string;
  to: string;
  date: string;
  time: string;
  items: string;
  fee: number;
  status: string;
}

const TABS = ['Available', 'My Jobs'];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState<JobItem[]>([]);

  const handleAcceptJob = (jobId: string, clientName: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'Accepted' } : j))
    );
    Alert.alert('Job Accepted!', `You have accepted the move for ${clientName}. Details added to your schedule.`);
  };

  const filteredJobs = activeTab === 0
    ? jobs.filter(j => j.status === 'Open')
    : jobs.filter(j => j.status === 'Accepted');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Moving Jobs</Text>
        </View>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bus-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptySubtitle}>
              New moving job requests from clients relocating across Kenya will be listed here.
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.cardHeader}>
                <View style={styles.clientRow}>
                  <Image source={{ uri: job.clientAvatar }} style={styles.avatar} contentFit="cover" />
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{job.clientName}</Text>
                    <Text style={styles.moveDetails}>{job.items}</Text>
                  </View>
                </View>
                <Text style={styles.feeText}>KES {job.fee.toLocaleString()}</Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                  <Ionicons name="location-outline" size={16} color={Colors.matteClay} />
                  <Text style={styles.routeText}>From: {job.from}</Text>
                </View>
                <View style={styles.routeRow}>
                  <Ionicons name="navigate-outline" size={16} color={Colors.badgeSuccess} />
                  <Text style={styles.routeText}>To: {job.to}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.timeText}>{job.date} at {job.time}</Text>
              </View>

              {activeTab === 0 && (
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptJob(job.id, job.clientName)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptBtnText}>Accept Move</Text>
                </TouchableOpacity>
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
  jobCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md, padding: Spacing.lg, ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: Spacing.sm },
  clientInfo: {},
  clientName: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  moveDetails: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  feeText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.matteClay },
  routeContainer: { marginVertical: Spacing.md, gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeText: { fontSize: Typography.bodySmall, color: Colors.deepCocoa },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  timeText: { fontSize: Typography.caption, color: Colors.textTertiary },
  acceptBtn: {
    backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
});
