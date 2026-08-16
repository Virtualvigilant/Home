import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useMoverStore, MoverJob } from '../../src/store/moverStore';

const TABS = ['Open Moving Gigs', 'My Accepted Jobs'];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const { jobs, acceptJob, startGpsNavigation, fetchJobs } = useMoverStore();

  useEffect(() => {
    fetchJobs().catch((error) => Alert.alert('Jobs Error', error?.message || 'Unable to load moving jobs.'));
  }, [fetchJobs]);

  // GPS Route Modal State
  const [selectedGpsJob, setSelectedGpsJob] = useState<MoverJob | null>(null);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);

  const handleAccept = async (job: MoverJob) => {
    try {
      await acceptJob(job.id);
      Alert.alert('Moving Job Accepted', `You accepted the move for ${job.client_name} on ${job.move_in_date}.`);
    } catch (error: any) {
      Alert.alert('Accept Failed', error?.message || 'Unable to accept this job.');
    }
  };

  const handleOpenGpsRoute = async (job: MoverJob) => {
    setSelectedGpsJob(job);
    try {
      await startGpsNavigation(job.id);
      setIsGpsModalOpen(true);
    } catch (error: any) {
      Alert.alert('Navigation Update Failed', error?.message || 'Unable to start this job.');
    }
  };

  const filteredJobs = activeTab === 0
    ? jobs.filter((j) => j.status === 'Open')
    : jobs.filter((j) => j.status !== 'Open');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hauling & Moving Gigs</Text>
          <Text style={styles.subtitle}>Local relocation jobs linked with client move-in dates</Text>
        </View>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bus-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {activeTab === 0 ? 'No Open Gigs Available' : 'No Accepted Gigs Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 0
                ? 'New local relocation requests from clients moving in across Nairobi will appear here.'
                : 'Jobs you accept from the "Open Moving Gigs" tab will be managed here.'}
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => {
            const isAccepted = job.status !== 'Open';

            return (
              <View key={job.id} style={styles.jobCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.clientRow}>
                    <Image source={{ uri: job.client_avatar }} style={styles.avatar} contentFit="cover" />
                    <View>
                      <Text style={styles.clientName}>{job.client_name}</Text>
                      <Text style={styles.moveDetails}>{job.cargo_description}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.feeText}>KES {job.fee.toLocaleString()}</Text>
                    <Text style={styles.feeSub}>Guaranteed Escrow Fee</Text>
                  </View>
                </View>

                {/* Move-In Date & Distance Banner */}
                <View style={styles.infoBanner}>
                  <View style={styles.infoChip}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.matteClay} />
                    <Text style={styles.infoChipText}>{job.move_in_date} ({job.move_in_time})</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Ionicons name="speedometer-outline" size={14} color={Colors.deepCocoa} />
                    <Text style={styles.infoChipText}>{job.distance_km} km ({job.est_duration_mins} mins)</Text>
                  </View>
                </View>

                {/* GPS Route Overview */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={styles.dotOrigin} />
                    <Text style={styles.routeText}>Pickup: {job.from_address}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={styles.dotDest} />
                    <Text style={styles.routeText}>Move-In Destination: {job.to_address}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  {activeTab === 0 ? (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(job)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                      <Text style={styles.acceptBtnText}>Accept Local Hauling Gig</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.gpsBtn}
                      onPress={() => handleOpenGpsRoute(job)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="navigate" size={18} color={Colors.white} />
                      <Text style={styles.gpsBtnText}>Open GPS Navigation Route</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* GPS NAVIGATION OVERLAY MODAL */}
      <Modal visible={isGpsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GPS Coordination Navigation</Text>
              <TouchableOpacity onPress={() => setIsGpsModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            {/* Map Preview Box */}
            <View style={styles.mapPreviewBox}>
              <Ionicons name="map" size={42} color={Colors.matteClay} />
              <Text style={styles.mapTitle}>Live GPS Route Guided Navigation</Text>
              <Text style={styles.mapCoords}>
                Pickup Coords: ({selectedGpsJob?.pickup_lat}, {selectedGpsJob?.pickup_lng})
              </Text>
              <Text style={styles.mapCoords}>
                Destination Coords: ({selectedGpsJob?.dropoff_lat}, {selectedGpsJob?.dropoff_lng})
              </Text>
              <View style={styles.etaBadge}>
                <Ionicons name="compass" size={16} color={Colors.white} />
                <Text style={styles.etaBadgeText}>
                  {selectedGpsJob?.distance_km} km • Estimated {selectedGpsJob?.est_duration_mins} mins via Thika/Waiyaki Way
                </Text>
              </View>
            </View>

            <View style={styles.navDetailCard}>
              <Text style={styles.navDetailTitle}>Client Destination Address</Text>
              <Text style={styles.navDetailText}>{selectedGpsJob?.to_address}</Text>

              <Text style={[styles.navDetailTitle, { marginTop: Spacing.sm }]}>Client Contact</Text>
              <Text style={styles.navDetailText}>
                {selectedGpsJob?.client_name} ({selectedGpsJob?.client_phone})
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeGpsBtn}
              onPress={() => {
                if (!selectedGpsJob?.to_address) return;
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGpsJob.to_address)}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.closeGpsBtnText}>Open Destination in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
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
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.sm },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  clientName: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  moveDetails: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  feeText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.matteClay },
  feeSub: { fontSize: Typography.tiny, color: Colors.textTertiary, marginTop: 1 },
  infoBanner: { flexDirection: 'row', gap: Spacing.xs, marginVertical: Spacing.md },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.softCream, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  infoChipText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  routeContainer: { backgroundColor: '#FAF7F2', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.matteClay },
  dotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.badgeSuccess },
  routeLine: { width: 2, height: 12, backgroundColor: Colors.divider, marginLeft: 4, marginVertical: 2 },
  routeText: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, flex: 1 },
  cardActions: { marginTop: Spacing.xs },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md },
  acceptBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.deepCocoa, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md },
  gpsBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  mapPreviewBox: { backgroundColor: '#F3F4F6', borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  mapTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.xs },
  mapCoords: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.badgeVerified, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.pill, marginTop: Spacing.md },
  etaBadgeText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },
  navDetailCard: { backgroundColor: Colors.softCream, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  navDetailTitle: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.textSecondary },
  navDetailText: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginTop: 2 },
  closeGpsBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center' },
  closeGpsBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
});
