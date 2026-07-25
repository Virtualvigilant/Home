import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const mockOrders = [
  {
    id: 'ord1', clientName: 'James Kariuki', clientAvatar: 'https://i.pravatar.cc/150?img=11',
    items: ['Queen Bed Frame', 'Premium Mattress'], total: 77000,
    status: 'Processing', date: 'Jul 15, 2024', moveInDate: 'Jul 20, 2024',
  },
  {
    id: 'ord2', clientName: 'Aisha Mohammed', clientAvatar: 'https://i.pravatar.cc/150?img=25',
    items: ['Sofa Set', 'Dining Table'], total: 83000,
    status: 'Shipped', date: 'Jul 12, 2024', moveInDate: 'Jul 18, 2024',
  },
  {
    id: 'ord3', clientName: 'Brian Otieno', clientAvatar: 'https://i.pravatar.cc/150?img=53',
    items: ['Living Room Set'], total: 55000,
    status: 'Delivered', date: 'Jul 8, 2024', moveInDate: 'Jul 10, 2024',
  },
];

const statusColors: Record<string, string> = {
  Processing: Colors.badgePending,
  Shipped: Colors.info,
  Delivered: Colors.badgeSuccess,
};

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>{mockOrders.length} active orders</Text>
        </View>

        {mockOrders.map((order) => (
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
              <View>
                <Text style={styles.moveInLabel}>Move-in: {order.moveInDate}</Text>
              </View>
              <Text style={styles.totalAmount}>KES {order.total.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        ))}

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
  orderCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.lg, ...Shadows.card,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  clientInfo: { marginLeft: Spacing.md },
  clientName: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  orderDate: { fontSize: Typography.caption, color: Colors.textTertiary, marginTop: 1 },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill },
  statusText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold },
  itemsList: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  itemText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginBottom: 4 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  moveInLabel: { fontSize: Typography.caption, color: Colors.matteClay, fontWeight: Typography.medium },
  totalAmount: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
});
