import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const TABS = ['Available', 'My Jobs'];

const initialJobs = [
  {
    id: 'j1', clientName: 'James Kariuki', clientAvatar: 'https://i.pravatar.cc/150?img=11',
    from: 'Kilimani, Nairobi', to: 'Kileleshwa, Nairobi',
    date: 'Jul 20, 2024', time: '8:00 AM', items: '2BR apartment', fee: 15000, status: 'Open',
  },
  {
    id: 'j2', clientName: 'Aisha Mohammed', clientAvatar: 'https://i.pravatar.cc/150?img=25',
    from: 'Westlands, Nairobi', to: 'Runda, Nairobi',
    date: 'Jul 22, 2024', time: '9:00 AM', items: '3BR house', fee: 25000, status: 'Open',
  },
  {
    id: 'j3', clientName: 'Brian Otieno', clientAvatar: 'https://i.pravatar.cc/150?img=53',
    from: 'CBD, Nairobi', to: 'Karen, Nairobi',
    date: 'Jul 18, 2024', time: '7:00 AM', items: '1BR studio', fee: 10000, status: 'Accepted',
  },
];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState(initialJobs);

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
          <Text style={styles.subtitle}>{jobs.filter(j => j.status === 'Open').length} jobs available near you</Text>
        </View>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <View style={styles.jobsList}>
          {filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              {/* Client Info */}
              <View style={styles.clientRow}>
                <Image source={{ uri: job.clientAvatar }} style={styles.avatar} contentFit="cover" />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{job.clientName}</Text>
                  <Text style={styles.dateText}>{job.date} • {job.time}</Text>
                </View>
                <Text style={styles.fee}>KES {job.fee.toLocaleString()}</Text>
              </View>

              {/* Route */}
              <View style={styles.routeContainer}>
                <View style={styles.routeDots}>
                  <View style={styles.dotFilled} />
                  <View style={styles.routeLine} />
                  <View style={styles.dotOutline} />
                </View>
                <View style={styles.routeTexts}>
                  <Text style={styles.routeFrom}>{job.from}</Text>
                  <Text style={styles.routeTo}>{job.to}</Text>
                </View>
              </View>

              {/* Items & Action */}
              <View style={styles.jobFooter}>
                <View style={styles.itemsBadge}>
                  <Ionicons name="cube-outline" size={14} color={Colors.matteClay} />
                  <Text style={styles.itemsText}>{job.items}</Text>
                </View>
                {job.status === 'Open' ? (
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptJob(job.id, job.clientName)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.acceptButtonText}>Accept Job</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.acceptedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.badgeSuccess} />
                    <Text style={styles.acceptedText}>Accepted</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {filteredJobs.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No jobs here</Text>
            <Text style={styles.emptySubtitle}>Check back soon for new moving requests.</Text>
          </View>
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
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  jobsList: { marginTop: Spacing.lg },
  jobCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.lg, ...Shadows.card,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  clientInfo: { flex: 1, marginLeft: Spacing.md },
  clientName: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  dateText: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 1 },
  fee: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.matteClay },
  routeContainer: { flexDirection: 'row', marginTop: Spacing.lg, paddingLeft: Spacing.xs },
  routeDots: { alignItems: 'center', marginRight: Spacing.md, paddingTop: 2 },
  dotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.matteClay },
  routeLine: { width: 2, height: 28, backgroundColor: Colors.warmAlmond, marginVertical: 2 },
  dotOutline: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.deepCocoa },
  routeTexts: { flex: 1, justifyContent: 'space-between' },
  routeFrom: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, fontWeight: Typography.medium },
  routeTo: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, fontWeight: Typography.medium },
  jobFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  itemsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemsText: { fontSize: Typography.caption, color: Colors.matteClay, fontWeight: Typography.medium },
  acceptButton: {
    backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
  },
  acceptButtonText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.white },
  acceptedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  acceptedText: { fontSize: Typography.bodySmall, fontWeight: Typography.medium, color: Colors.badgeSuccess },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.huge, paddingHorizontal: Spacing.xxxl },
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.md },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
