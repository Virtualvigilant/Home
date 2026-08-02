import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { usePropertyStore } from '../../src/store/propertyStore';

export default function RentTrackerScreen() {
  const { properties } = usePropertyStore();

  // Derive rent tracker records dynamically from properties
  const rentData = properties.map((p) => ({
    id: p.id,
    property: p.title,
    tenant: p.status === 'Rented' ? 'Tenant Assigned' : '—',
    amount: p.price,
    status: p.status === 'Rented' ? 'Paid' : p.status === 'Pending_Escrow' ? 'Overdue' : 'Vacant',
    dueDate: '1st of Month',
    paidDate: p.status === 'Rented' ? 'Paid' : '—',
  }));

  const totalExpected = rentData.reduce((sum, r) => (r.status !== 'Vacant' ? sum + r.amount : sum), 0);
  const totalCollected = rentData.reduce((sum, r) => (r.status === 'Paid' ? sum + r.amount : sum), 0);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Rent Tracker</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.deepCocoa }]}>
            <Text style={styles.summaryLabel}>Expected</Text>
            <Text style={styles.summaryValue}>KES {totalExpected.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.matteClay }]}>
            <Text style={styles.summaryLabel}>Collected</Text>
            <Text style={styles.summaryValue}>KES {totalCollected.toLocaleString()}</Text>
          </View>
        </View>

        {/* Rent Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentMonth}</Text>
          {rentData.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="card-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Rent Records Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add properties to your portfolio to track tenant rent payments, escrow releases, and overdue balances.
              </Text>
            </View>
          ) : (
            rentData.map((item) => (
              <View key={item.id} style={styles.rentItem}>
                <View style={styles.rentLeft}>
                  <Ionicons
                    name={
                      item.status === 'Paid'
                        ? 'checkmark-circle'
                        : item.status === 'Overdue'
                        ? 'alert-circle'
                        : 'remove-circle-outline'
                    }
                    size={24}
                    color={
                      item.status === 'Paid'
                        ? Colors.badgeSuccess
                        : item.status === 'Overdue'
                        ? Colors.error
                        : Colors.textTertiary
                    }
                  />
                </View>
                <View style={styles.rentInfo}>
                  <Text style={styles.rentProperty}>{item.property}</Text>
                  <Text style={styles.rentTenant}>{item.tenant}</Text>
                </View>
                <View style={styles.rentRight}>
                  <Text style={styles.rentAmount}>KES {item.amount.toLocaleString()}</Text>
                  <Text
                    style={[
                      styles.rentStatus,
                      item.status === 'Paid' && { color: Colors.badgeSuccess },
                      item.status === 'Overdue' && { color: Colors.error },
                      item.status === 'Vacant' && { color: Colors.textTertiary },
                    ]}
                  >
                    {item.status}
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
  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.md },
  summaryCard: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  summaryLabel: { fontSize: Typography.caption, color: Colors.warmAlmond },
  summaryValue: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.white, marginTop: Spacing.xs },
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
  rentItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  rentLeft: { marginRight: Spacing.md },
  rentInfo: { flex: 1 },
  rentProperty: { fontSize: Typography.bodySmall, fontWeight: Typography.medium, color: Colors.deepCocoa },
  rentTenant: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  rentRight: { alignItems: 'flex-end' },
  rentAmount: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  rentStatus: { fontSize: Typography.tiny, marginTop: 2 },
});
