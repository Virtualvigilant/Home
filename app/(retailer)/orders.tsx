import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

interface OrderItem {
  id: string;
  clientName: string;
  clientAvatar: string;
  items: string[];
  total: number;
  status: string;
  date: string;
  moveInDate: string;
}

const statusColors: Record<string, string> = {
  Processing: Colors.badgePending,
  Shipped: Colors.info,
  Delivered: Colors.badgeSuccess,
};

export default function OrdersScreen() {
  const mockOrders: OrderItem[] = [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>{mockOrders.length} active orders</Text>
        </View>

        {mockOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bag-handle-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders placed by home buyers and clients for your furniture and catalog items will appear here.
            </Text>
          </View>
        ) : (
          mockOrders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.9}>
              <View style={styles.orderHeader}>
                <View style={styles.clientRow}>
                  <Image source={{ uri: order.clientAvatar }} style={styles.avatar} contentFit="cover" />
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{order.clientName}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColors[order.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColors[order.status] }]}>{order.status}</Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {order.items.map((item, i) => (
                  <Text key={i} style={styles.itemText}>• {item}</Text>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>KES {order.total.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  orderCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.lg, ...Shadows.card,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: Spacing.sm },
  clientInfo: {},
  clientName: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  orderDate: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  statusText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold },
  itemsList: { marginVertical: Spacing.md, paddingLeft: Spacing.xs },
  itemText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 22 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  totalLabel: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  totalAmount: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa },
});
