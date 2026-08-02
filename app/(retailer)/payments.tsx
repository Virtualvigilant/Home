import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

interface PaymentItem {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  date: string;
}

export default function PaymentsScreen() {
  const recentPayments: PaymentItem[] = [];

  const totalRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingRelease = recentPayments
    .filter(p => p.status === 'Pending Release')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Payments</Text>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>KES {totalRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>In Escrow</Text>
              <Text style={[styles.revenueValue, { color: Colors.warning }]}>
                KES {pendingRelease.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
          {recentPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed customer order payments and escrow disbursements will be tracked here.
              </Text>
            </View>
          ) : (
            recentPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentLeft}>
                  <Ionicons
                    name={payment.status === 'Completed' ? 'checkmark-circle' : 'time'}
                    size={24}
                    color={payment.status === 'Completed' ? Colors.badgeSuccess : Colors.warning}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentOrderId}>{payment.orderId}</Text>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>KES {payment.amount.toLocaleString()}</Text>
                  <Text style={[styles.paymentStatus, payment.status === 'Completed' ? { color: Colors.badgeSuccess } : { color: Colors.warning }]}>
                    {payment.status}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  revenueCard: {
    backgroundColor: Colors.deepCocoa, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, padding: Spacing.xl, marginTop: Spacing.md,
  },
  revenueRow: { flexDirection: 'row' },
  revenueItem: { flex: 1 },
  revenueLabel: { fontSize: Typography.caption, color: Colors.warmAlmond },
  revenueValue: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.white, marginTop: Spacing.xs },
  revenueDivider: { width: 1, backgroundColor: Colors.warmAlmond, opacity: 0.3, marginHorizontal: Spacing.lg },
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
  paymentItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  paymentLeft: { marginRight: Spacing.md },
  paymentInfo: { flex: 1 },
  paymentOrderId: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  paymentDate: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  paymentStatus: { fontSize: Typography.tiny, marginTop: 2 },
});
