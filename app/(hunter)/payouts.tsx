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
import { usePropertyStore } from '../../src/store/propertyStore';
import { useAuthStore } from '../../src/store/authStore';

export default function PayoutsScreen() {
  const { hunterLeads, claimBountyPayout } = usePropertyStore();
  const { user } = useAuthStore();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedLeadForPayout, setSelectedLeadForPayout] = useState<any | null>(null);
  const [mpesaNumber, setMpesaNumber] = useState(user?.phone || '254712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter lead bounties
  const availableBounties = hunterLeads.filter((l) => l.status === 'Booked');
  const pendingBounties = hunterLeads.filter((l) => l.status === 'Verified' || l.status === 'New');

  const availableBalance = availableBounties.reduce((sum, l) => sum + (l.bounty_amount || 0), 0);
  const pendingAmount = pendingBounties.reduce((sum, l) => sum + (l.bounty_amount || 0), 0);
  const totalEarned = availableBalance + pendingAmount;

  const handleOpenWithdraw = (lead?: any) => {
    if (availableBalance === 0 && !lead) {
      Alert.alert('No Balance Available', 'You have no move-in confirmed bounties available for instant release yet.');
      return;
    }
    setSelectedLeadForPayout(lead || availableBounties[0]);
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmPayout = () => {
    if (!mpesaNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter your M-PESA phone number.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      if (selectedLeadForPayout) {
        claimBountyPayout(selectedLeadForPayout.id, mpesaNumber);
      }
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);

      const txRef = `MPESA_${Math.floor(100000 + Math.random() * 900000)}`;
      Alert.alert(
        'Bounty Released Instantly!',
        `Ref: ${txRef}\nKES ${(selectedLeadForPayout?.bounty_amount || availableBalance).toLocaleString()} has been sent to M-PESA (${mpesaNumber}).`
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Scout Bounties & Wallet</Text>
          <Text style={styles.subtitle}>Instant Payout Release for Confirmed Move-Ins</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available for Instant Release</Text>
          <Text style={styles.balanceAmount}>KES {availableBalance.toLocaleString()}</Text>

          <TouchableOpacity
            style={[styles.withdrawBtn, availableBalance === 0 && styles.withdrawBtnDisabled]}
            onPress={() => handleOpenWithdraw()}
            disabled={availableBalance === 0}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color={Colors.deepCocoa} />
            <Text style={styles.withdrawBtnText}>Withdraw Finder's Bounty to M-PESA</Text>
          </TouchableOpacity>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Pending Move-In</Text>
              <Text style={styles.balanceItemValue}>KES {pendingAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Total Lifetime Earned</Text>
              <Text style={styles.balanceItemValue}>KES {totalEarned.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOURCED LEADS & BOUNTY BREAKDOWN</Text>

          {hunterLeads.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Sourced Leads Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add off-market properties to earn finder bounties upon client move-in.
              </Text>
            </View>
          ) : (
            hunterLeads.map((lead) => {
              const isReady = lead.status === 'Booked';
              const propTitle = lead.property?.title || 'Off-Market Property Lead';

              return (
                <View key={lead.id} style={styles.payoutItem}>
                  <View style={styles.payoutIcon}>
                    <Ionicons
                      name={isReady ? 'checkmark-circle' : 'time'}
                      size={26}
                      color={isReady ? Colors.badgeSuccess : Colors.badgePending}
                    />
                  </View>
                  <View style={styles.payoutInfo}>
                    <Text style={styles.payoutProperty}>{propTitle}</Text>
                    <Text style={styles.payoutDate}>
                      {lead.notes || (isReady ? 'Move-in confirmed • Ready for payout' : 'Pending client booking & move-in')}
                    </Text>
                  </View>
                  <View style={styles.payoutRight}>
                    <Text style={styles.payoutAmount}>KES {(lead.bounty_amount || 0).toLocaleString()}</Text>
                    <TouchableOpacity
                      style={[styles.statusBadge, isReady ? styles.statusBadgeReady : styles.statusBadgePending]}
                      onPress={() => isReady && handleOpenWithdraw(lead)}
                      disabled={!isReady}
                    >
                      <Text style={[styles.statusBadgeText, isReady && styles.statusBadgeTextReady]}>
                        {isReady ? 'Claim Bounty' : 'Pending Move-In'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* WITHDRAW TO M-PESA MODAL */}
      <Modal visible={isWithdrawModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Instant M-PESA Bounty Payout</Text>
              <TouchableOpacity onPress={() => setIsWithdrawModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <View style={styles.payoutNoticeCard}>
              <Ionicons name="flash" size={20} color={Colors.badgeSuccess} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutNoticeTitle}>Finder's Bounty Ready for Release</Text>
                <Text style={styles.payoutNoticeSub}>
                  Client confirmed move-in for "{selectedLeadForPayout?.property?.title || 'Sourced Listing'}".
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Payout Amount</Text>
            <Text style={styles.payoutAmountBig}>
              KES {(selectedLeadForPayout?.bounty_amount || availableBalance).toLocaleString()}
            </Text>

            <Text style={styles.inputLabel}>M-PESA Registered Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={mpesaNumber}
              onChangeText={setMpesaNumber}
              keyboardType="phone-pad"
              placeholder="e.g. 254712345678"
            />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmPayout}
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
  balanceCard: {
    backgroundColor: Colors.deepCocoa,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    ...Shadows.card,
  },
  balanceLabel: { fontSize: Typography.bodySmall, color: Colors.warmAlmond },
  balanceAmount: { fontSize: 36, fontWeight: Typography.bold, color: Colors.white, marginTop: 4 },
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
  balanceRow: { flexDirection: 'row', marginTop: Spacing.xl },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: Typography.caption, color: Colors.warmAlmond },
  balanceItemValue: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.white, marginTop: 2 },
  balanceDivider: { width: 1, backgroundColor: Colors.warmAlmond, opacity: 0.3, marginHorizontal: Spacing.md },
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
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  payoutIcon: { marginRight: Spacing.md },
  payoutInfo: { flex: 1 },
  payoutProperty: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  payoutDate: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  payoutRight: { alignItems: 'flex-end' },
  payoutAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill, backgroundColor: Colors.softCream },
  statusBadgeReady: { backgroundColor: Colors.badgeSuccess },
  statusBadgePending: { backgroundColor: Colors.warmAlmond },
  statusBadgeText: { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.textSecondary },
  statusBadgeTextReady: { color: Colors.white, fontWeight: Typography.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  payoutNoticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: '#ECFDF5', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  payoutNoticeTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  payoutNoticeSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  inputLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.xs, marginBottom: 4 },
  payoutAmountBig: { fontSize: 32, fontWeight: Typography.bold, color: Colors.matteClay, marginBottom: Spacing.md },
  textInput: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginBottom: Spacing.md },
  confirmBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.lg },
  confirmBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },
});
