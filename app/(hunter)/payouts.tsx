import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const payoutHistory = [
  { id: '1', property: '1-Bed Studio Kilimani', amount: 3500, status: 'Completed', date: 'Jun 13, 2024' },
  { id: '2', property: 'Room in Kileleshwa', amount: 4000, status: 'Completed', date: 'Jun 8, 2024' },
  { id: '3', property: '2-Bed Apt Kileleshwa', amount: 5000, status: 'Pending', date: 'Jun 14, 2024' },
];

export default function PayoutsScreen() {
  const totalEarnings = payoutHistory.reduce((sum, p) => p.status === 'Completed' ? sum + p.amount : sum, 0);
  const pendingAmount = payoutHistory.reduce((sum, p) => p.status === 'Pending' ? sum + p.amount : sum, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Payouts</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Earnings</Text>
          <Text style={styles.balanceAmount}>KES {totalEarnings.toLocaleString()}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Pending</Text>
              <Text style={styles.balanceItemValue}>KES {pendingAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>This Month</Text>
              <Text style={styles.balanceItemValue}>KES {totalEarnings.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYOUT HISTORY</Text>
          {payoutHistory.map((payout) => (
            <View key={payout.id} style={styles.payoutItem}>
              <View style={styles.payoutIcon}>
                <Ionicons
                  name={payout.status === 'Completed' ? 'checkmark-circle' : 'time'}
                  size={24}
                  color={payout.status === 'Completed' ? Colors.badgeSuccess : Colors.badgePending}
                />
              </View>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutProperty}>{payout.property}</Text>
                <Text style={styles.payoutDate}>{payout.date}</Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>KES {payout.amount.toLocaleString()}</Text>
                <Text style={[styles.payoutStatus, payout.status === 'Pending' && styles.payoutStatusPending]}>
                  {payout.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  balanceCard: {
    backgroundColor: Colors.deepCocoa, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, padding: Spacing.xl, marginTop: Spacing.md,
  },
  balanceLabel: { fontSize: Typography.bodySmall, color: Colors.warmAlmond },
  balanceAmount: { fontSize: 36, fontWeight: Typography.bold, color: Colors.white, marginTop: Spacing.xs },
  balanceRow: { flexDirection: 'row', marginTop: Spacing.xl },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: Typography.caption, color: Colors.warmAlmond },
  balanceItemValue: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.white, marginTop: 2 },
  balanceDivider: { width: 1, backgroundColor: Colors.warmAlmond, opacity: 0.3, marginHorizontal: Spacing.lg },
  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md },
  payoutItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  payoutIcon: { marginRight: Spacing.md },
  payoutInfo: { flex: 1 },
  payoutProperty: { fontSize: Typography.bodySmall, fontWeight: Typography.medium, color: Colors.deepCocoa },
  payoutDate: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  payoutRight: { alignItems: 'flex-end' },
  payoutAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  payoutStatus: { fontSize: Typography.tiny, color: Colors.badgeSuccess, marginTop: 2 },
  payoutStatusPending: { color: Colors.badgePending },
});
