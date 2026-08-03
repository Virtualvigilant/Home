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
import { useRetailerStore } from '../../src/store/retailerStore';

export default function PaymentsScreen() {
  const { orders } = useRetailerStore();

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState('254712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  const releasedOrders = orders.filter((o) => o.payment_status === 'Released_To_Retailer');
  const escrowOrders = orders.filter((o) => o.payment_status === 'Held_In_Escrow');

  const availableBalance = releasedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const escrowBalance = escrowOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalGrossRevenue = availableBalance + escrowBalance;

  const handleOpenPayout = () => {
    if (availableBalance === 0) {
      Alert.alert('No Released Funds', 'No payments are currently released for withdrawal. Complete client sign-off to release escrow.');
      return;
    }
    setIsPayoutModalOpen(true);
  };

  const handleConfirmPayout = () => {
    if (!mpesaNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter your M-PESA phone number.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPayoutModalOpen(false);
      const txRef = `RETAIL_MPESA_${Math.floor(100000 + Math.random() * 900000)}`;
      Alert.alert(
        'Payment Transferred!',
        `Ref: ${txRef}\nKES ${availableBalance.toLocaleString()} transferred to M-PESA (${mpesaNumber}).`
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Retailer Wallet & Revenue</Text>
          <Text style={styles.subtitle}>Escrow management & payment release upon client sign-off</Text>
        </View>

        {/* Revenue Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Payout Balance</Text>
          <Text style={styles.balanceAmount}>KES {availableBalance.toLocaleString()}</Text>

          <TouchableOpacity
            style={[styles.withdrawBtn, availableBalance === 0 && styles.withdrawBtnDisabled]}
            onPress={handleOpenPayout}
            disabled={availableBalance === 0}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color={Colors.deepCocoa} />
            <Text style={styles.withdrawBtnText}>Withdraw Revenue to M-PESA</Text>
          </TouchableOpacity>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Held in Escrow</Text>
              <Text style={styles.balanceItemValue}>KES {escrowBalance.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Total Gross Sales</Text>
              <Text style={styles.balanceItemValue}>KES {totalGrossRevenue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Payment History & Escrow Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PURCHASE ESCROW & PAYOUT LOG</Text>

          {orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="card-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Payment Transactions</Text>
              <Text style={styles.emptySubtitle}>
                Completed order payments and escrow releases will appear here.
              </Text>
            </View>
          ) : (
            orders.map((order) => {
              const isReleased = order.payment_status === 'Released_To_Retailer';
              return (
                <View key={order.id} style={styles.paymentItem}>
                  <View style={styles.paymentIcon}>
                    <Ionicons
                      name={isReleased ? 'checkmark-circle' : 'lock-closed'}
                      size={24}
                      color={isReleased ? Colors.badgeSuccess : Colors.matteClay}
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentClient}>{order.client_name}</Text>
                    <Text style={styles.paymentSub}>
                      {isReleased ? 'Client sign-off completed • Funds released' : 'Order pending client sign-off'}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>KES {order.total_amount.toLocaleString()}</Text>
                    <Text style={[styles.paymentStatus, isReleased && { color: Colors.badgeSuccess }]}>
                      {isReleased ? 'Released' : 'In Escrow'}
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
      <Modal visible={isPayoutModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Retailer Revenue</Text>
              <TouchableOpacity onPress={() => setIsPayoutModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Payout Amount</Text>
            <Text style={styles.payoutAmountBig}>KES {availableBalance.toLocaleString()}</Text>

            <Text style={styles.inputLabel}>M-PESA Business / Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={mpesaNumber}
              onChangeText={setMpesaNumber}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmPayout}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {isProcessing ? 'Processing Transfer...' : 'Confirm Instant M-PESA Payout'}
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
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  paymentIcon: { marginRight: Spacing.md },
  paymentInfo: { flex: 1 },
  paymentClient: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  paymentSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  paymentStatus: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, color: Colors.textSecondary, marginTop: 2 },
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
