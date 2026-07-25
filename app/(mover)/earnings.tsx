import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const completedHauls = [
  { id: '1', route: 'Kilimani → Kileleshwa', amount: 15000, date: 'Jul 15, 2024', status: 'Paid' },
  { id: '2', route: 'Westlands → Lavington', amount: 12000, date: 'Jul 10, 2024', status: 'Paid' },
  { id: '3', route: 'CBD → Karen', amount: 18000, date: 'Jul 04, 2024', status: 'Paid' },
];

export default function EarningsScreen() {
  const totalEarnings = completedHauls.reduce((sum, h) => sum + h.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mover Earnings</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Available Balance</Text>
          <Text style={styles.cardAmount}>KES {totalEarnings.toLocaleString()}</Text>
          <View style={styles.cardRow}>
            <View style={styles.cardCol}>
              <Text style={styles.cardSubLabel}>Completed Gigs</Text>
              <Text style={styles.cardSubValue}>{completedHauls.length}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardCol}>
              <Text style={styles.cardSubLabel}>Rating</Text>
              <Text style={styles.cardSubValue}>4.9 ★</Text>
            </View>
          </View>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT HAULING GIGS</Text>
          {completedHauls.map((haul) => (
            <View key={haul.id} style={styles.haulItem}>
              <View style={styles.haulIcon}>
                <Ionicons name="car" size={22} color={Colors.badgeSuccess} />
              </View>
              <View style={styles.haulInfo}>
                <Text style={styles.haulRoute}>{haul.route}</Text>
                <Text style={styles.haulDate}>{haul.date}</Text>
              </View>
              <View style={styles.haulRight}>
                <Text style={styles.haulAmount}>KES {haul.amount.toLocaleString()}</Text>
                <Text style={styles.haulStatus}>{haul.status}</Text>
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
  card: {
    backgroundColor: Colors.deepCocoa, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, padding: Spacing.xl, marginTop: Spacing.md,
  },
  cardLabel: { fontSize: Typography.bodySmall, color: Colors.warmAlmond },
  cardAmount: { fontSize: 36, fontWeight: Typography.bold, color: Colors.white, marginTop: Spacing.xs },
  cardRow: { flexDirection: 'row', marginTop: Spacing.xl },
  cardCol: { flex: 1 },
  cardSubLabel: { fontSize: Typography.caption, color: Colors.warmAlmond },
  cardSubValue: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.white, marginTop: 2 },
  cardDivider: { width: 1, backgroundColor: Colors.warmAlmond, opacity: 0.3, marginHorizontal: Spacing.lg },
  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md },
  haulItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  haulIcon: { marginRight: Spacing.md },
  haulInfo: { flex: 1 },
  haulRoute: { fontSize: Typography.bodySmall, fontWeight: Typography.medium, color: Colors.deepCocoa },
  haulDate: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  haulRight: { alignItems: 'flex-end' },
  haulAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  haulStatus: { fontSize: Typography.tiny, color: Colors.badgeSuccess, marginTop: 2 },
});
