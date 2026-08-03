import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useMoverStore, MoverJob } from '../../src/store/moverStore';

export default function ScheduleScreen() {
  const { jobs, verifyCargoArrival } = useMoverStore();

  const [selectedJob, setSelectedJob] = useState<MoverJob | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // Checklist State
  const [boxesIntact, setBoxesIntact] = useState(false);
  const [furnitureUnloaded, setFurnitureUnloaded] = useState(false);
  const [clientSignoff, setClientSignoff] = useState(false);

  const acceptedJobs = jobs.filter((j) => j.status !== 'Open');

  const handleOpenChecklist = (job: MoverJob) => {
    setSelectedJob(job);
    setBoxesIntact(job.cargo_checklist?.boxes_intact || false);
    setFurnitureUnloaded(job.cargo_checklist?.furniture_unloaded || false);
    setClientSignoff(job.cargo_checklist?.client_signoff || false);
    setIsChecklistModalOpen(true);
  };

  const handleConfirmArrival = () => {
    if (!boxesIntact || !furnitureUnloaded || !clientSignoff) {
      Alert.alert('Incomplete Verification', 'Please complete all cargo verification checks before releasing payout.');
      return;
    }

    if (!selectedJob) return;

    verifyCargoArrival(selectedJob.id, {
      boxes_intact: boxesIntact,
      furniture_unloaded: furnitureUnloaded,
      client_signoff: clientSignoff,
    });

    setIsChecklistModalOpen(false);
    Alert.alert(
      'Cargo Arrival Verified & Paid!',
      `Cargo arrival for "${selectedJob.client_name}" verified.\nAutomated Service Fee of KES ${selectedJob.fee.toLocaleString()} has been released to your wallet!`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Move-In Schedule & Verification</Text>
          <Text style={styles.subtitle}>Verify cargo arrival on move-in day to trigger automated service payouts</Text>
        </View>

        {acceptedJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Scheduled Moves</Text>
            <Text style={styles.emptySubtitle}>
              Accepted moving jobs and scheduled client relocations will appear here.
            </Text>
          </View>
        ) : (
          acceptedJobs.map((job) => {
            const isVerified = job.status === 'Arrived_Verified' || job.status === 'Completed';

            return (
              <View key={job.id} style={styles.scheduleCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.dateBadge}>
                    <Ionicons name="time" size={14} color={Colors.white} />
                    <Text style={styles.dateBadgeText}>{job.move_in_date} ({job.move_in_time})</Text>
                  </View>

                  <View style={[styles.statusTag, isVerified ? styles.statusTagVerified : styles.statusTagPending]}>
                    <Text style={[styles.statusTagText, isVerified && { color: Colors.badgeSuccess }]}>
                      {isVerified ? 'Cargo Verified & Paid' : 'Scheduled Move'}
                    </Text>
                  </View>
                </View>

                {/* Job Info */}
                <Text style={styles.clientTitle}>{job.client_name} • {job.cargo_description}</Text>

                <View style={styles.routeBox}>
                  <View style={styles.routeRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.matteClay} />
                    <Text style={styles.routeText}>From: {job.from_address}</Text>
                  </View>
                  <View style={styles.routeRow}>
                    <Ionicons name="navigate-outline" size={14} color={Colors.badgeSuccess} />
                    <Text style={styles.routeText}>To: {job.to_address}</Text>
                  </View>
                </View>

                {/* Footer Fee & Action */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.feeLabel}>Automated Fee</Text>
                    <Text style={styles.feeValue}>KES {job.fee.toLocaleString()}</Text>
                  </View>

                  {!isVerified ? (
                    <TouchableOpacity
                      style={styles.verifyBtn}
                      onPress={() => handleOpenChecklist(job)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="shield-checkmark" size={16} color={Colors.white} />
                      <Text style={styles.verifyBtnText}>Verify Cargo Arrival</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-done-circle" size={18} color={Colors.badgeSuccess} />
                      <Text style={styles.paidBadgeText}>Automated Fee Paid</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CARGO ARRIVAL VERIFICATION CHECKLIST MODAL */}
      <Modal visible={isChecklistModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cargo Arrival Verification</Text>
              <TouchableOpacity onPress={() => setIsChecklistModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Verify cargo condition at destination to complete the haul and release automated service fee payout (KES {selectedJob?.fee.toLocaleString()}).
            </Text>

            <View style={styles.checklistContainer}>
              <TouchableOpacity
                style={[styles.checkItem, boxesIntact && styles.checkItemActive]}
                onPress={() => setBoxesIntact(!boxesIntact)}
              >
                <Ionicons
                  name={boxesIntact ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={boxesIntact ? Colors.badgeSuccess : Colors.textTertiary}
                />
                <Text style={styles.checkText}>1. Cargo & Boxes Intact Without Damage</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkItem, furnitureUnloaded && styles.checkItemActive]}
                onPress={() => setFurnitureUnloaded(!furnitureUnloaded)}
              >
                <Ionicons
                  name={furnitureUnloaded ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={furnitureUnloaded ? Colors.badgeSuccess : Colors.textTertiary}
                />
                <Text style={styles.checkText}>2. Furniture Unloaded at Destination</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkItem, clientSignoff && styles.checkItemActive]}
                onPress={() => setClientSignoff(!clientSignoff)}
              >
                <Ionicons
                  name={clientSignoff ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={clientSignoff ? Colors.badgeSuccess : Colors.textTertiary}
                />
                <Text style={styles.checkText}>3. Client / House Hunter Sign-Off Confirmed</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!boxesIntact || !furnitureUnloaded || !clientSignoff) && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirmArrival}
              disabled={!boxesIntact || !furnitureUnloaded || !clientSignoff}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Confirm Cargo Arrival & Trigger Payout</Text>
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
  scheduleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.matteClay, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  dateBadgeText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },
  statusTag: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  statusTagPending: { backgroundColor: Colors.warmAlmond },
  statusTagVerified: { backgroundColor: '#ECFDF5' },
  statusTagText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  clientTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa, marginVertical: Spacing.xs },
  routeBox: { backgroundColor: Colors.softCream, padding: Spacing.sm, borderRadius: BorderRadius.md, gap: 4, marginBottom: Spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeText: { fontSize: Typography.caption, color: Colors.deepCocoa },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.divider },
  feeLabel: { fontSize: Typography.caption, color: Colors.textSecondary },
  feeValue: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.badgeSuccess, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.pill },
  verifyBtnText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidBadgeText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.badgeSuccess },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  modalSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  checklistContainer: { gap: Spacing.sm, marginBottom: Spacing.lg },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.softCream, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.divider },
  checkItemActive: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  checkText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  confirmBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },
});
