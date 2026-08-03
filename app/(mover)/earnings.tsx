import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useMoverStore } from '../../src/store/moverStore';

export default function EarningsScreen() {
  const { jobs, withdrawMpesa } = useMoverStore();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('254701222333');
  const [isProcessing, setIsProcessing] = useState(false);

  const completedJobs = jobs.filter((j) => j.payout_released);
  const pendingJobs = jobs.filter((j) => !j.payout_released);

  const availableBalance = completedJobs.reduce((sum, j) => sum + j.fee, 0);
  const pendingBalance = pendingJobs.reduce((sum, j) => sum + j.fee, 0);
  const totalLifetimeEarnings = availableBalance + pendingBalance;

  const handleOpenWithdraw = () => {
    if (availableBalance === 0) {
      Alert.alert('No Balance Available', 'Complete cargo arrival verification on your scheduled moves to release service fees.');
      return;
    }
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!mpesaPhone.trim()) {
      Alert.alert('Missing Field', 'Please enter your M-PESA phone number.');
      return;
    }

    setIsProcessing(true);
    await withdrawMpesa(availableBalance, mpesaPhone);

    setTimeout(() => {
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);
      const txRef = `MOVER_MPESA_${Math.floor(100000 + Math.random() * 900000)}`;
      Alert.alert(
        'Service Fee Payout Sent!',
        `Ref: ${txRef}\nKES ${availableBalance.toLocaleString()} transferred instantly to M-PESA (${mpesaPhone}).`
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mover Wallet & Earnings</Text>
          <Text style={styles.subtitle}>Automated service fee payouts released upon cargo arrival verification</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Available Service Fee Balance</Text>
          <Text style={styles.cardAmount}>KES {availableBalance.toLocaleString()}</Text>

          <TouchableOpacity
            style={[styles.withdrawBtn, availableBalance === 0 && styles.withdrawBtnDisabled]}
            onPress={handleOpenWithdraw}
            disabled={availableBalance === 0}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color={Colors.deepCocoa} />
            <Text style={styles.withdrawBtnText}>Withdraw Service Fee to M-PESA</Text>
          </TouchableOpacity>

          <View style={styles.cardRow}>
            <View style={styles.cardCol}>
              <Text style={styles.cardSubLabel}>Completed Gigs</Text>
              <Text style={styles.cardSubValue}>{completedJobs.length}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardCol}>
              <Text style={styles.cardSubLabel}>Rating & Reviews</Text>
              <Text style={styles.cardSubValue}>5.0 ★ (Verified)</Text>
            </View>
          </View>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HAULING GIGS & PAYOUT BREAKDOWN</Text>

          {jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cash-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Hauling Gigs Yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed moving gigs and payments released from Escrow will appear here.
              </Text>
            </View>
          ) : (
            jobs.map((job) => {
              const isPaid = job.payout_released;

              return (
                <View key={job.id} style={styles.haulItem}>
                  <View style={styles.haulIcon}>
                    <Ionicons
                      name={isPaid ? 'checkmark-circle' : 'time'}
                      size={24}
                      color={isPaid ? Colors.badgeSuccess : Colors.badgePending}
                    />
                  </View>
                  <View style={styles.haulInfo}>
                    <Text style={styles.haulRoute}>{job.neighborhood} Relocation</Text>
                    <Text style={styles.haulDate}>
                      {isPaid ? 'Cargo arrival verified • Service fee paid' : `Scheduled for ${job.move_in_date}`}
                    </Text>
                  </View>
                  <View style={styles.haulRight}>
                    <Text style={styles.haulAmount}>KES {job.fee.toLocaleString()}</Text>
                    <Text style={[styles.haulStatus, isPaid && { color: Colors.badgeSuccess }]}>
                      {isPaid ? 'Paid' : 'Escrow Secured'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* WITHDRAW MODAL */}
      <Modal visible={isWithdrawModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Instant M-PESA Service Fee Payout</Text>
              <TouchableOpacity onPress={() => setIsWithdrawModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Payout Amount</Text>
            <Text style={styles.payoutAmountBig}>KES {availableBalance.toLocaleString()}</Text>

            <Text style={styles.inputLabel}>M-PESA Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={mpesaPhone}
              onChangeText={setMpesaPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmWithdraw}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {isProcessing ? 'Processing Instant Transfer...' : 'Confirm Instant M-PESA Release'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xs },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.deepCocoa,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    ...Shadows.card,
  },
  cardLabel: { fontSize: Typography.bodySmall, color: Colors.warmAlmond },
  cardAmount: { fontSize: 36, fontWeight: Typography.bold, color: Colors.white, marginTop: Spacing.xs },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.warmAlmond,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.md,
  },
  withdrawBtnDisabled: { opacity: 0.5 },
  withdrawBtnText: { color: Colors.deepCocoa, fontSize: Typography.caption, fontWeight: Typography.bold },
  cardRow: { flexDirection: 'row', marginTop: Spacing.xl },
  cardCol: { flex: 1 },
  cardSubLabel: { fontSize: Typography.caption, color: Colors.warmAlmond },
  cardSubValue: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.white, marginTop: 2 },
  cardDivider: { width: 1, backgroundColor: Colors.warmAlmond, opacity: 0.3, marginHorizontal: Spacing.lg },
  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md },
  emptyCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.sm },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },
  haulItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  haulIcon: { marginRight: Spacing.md },
  haulInfo: { flex: 1 },
  haulRoute: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  haulDate: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  haulRight: { alignItems: 'flex-end' },
  haulAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  haulStatus: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, color: Colors.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  inputLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.xs, marginBottom: 4 },
  payoutAmountBig: { fontSize: 32, fontWeight: Typography.bold, color: Colors.matteClay, marginBottom: Spacing.md },
  textInput: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginBottom: Spacing.md },
  confirmBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.lg },
  confirmBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },
});
