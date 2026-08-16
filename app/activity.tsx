import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';
import { BorderRadius, Colors, Spacing, Typography } from '../src/constants/theme';

type ActivityItem = {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  move_in_date: string;
  notes: string | null;
  property?: { title: string } | null;
  product?: { name: string } | null;
  service?: { name: string } | null;
};

export default function ActivityScreen() {
  const router = useRouter();
  const { initialized, user } = useAuthStore();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cancelRequest = async (item: ActivityItem) => {
    const { error } = await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', item.id);
    if (error) {
      Alert.alert('Cancellation Failed', error.message);
      return;
    }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'Cancelled' } : entry));
  };

  useEffect(() => {
    if (!user) return;
    supabase.from('bookings')
      .select('*, property:properties(title), product:products(name), service:services(name)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) Alert.alert('Activity Error', error.message);
        else setItems((data || []) as unknown as ActivityItem[]);
      });
  }, [user?.id]);

  if (!initialized) return <View style={styles.loading}><ActivityIndicator color={Colors.matteClay} /></View>;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.deepCocoa} />
        </TouchableOpacity>
        <Text style={styles.title}>My Requests & Orders</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={Colors.matteClay} /> : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={44} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>Property viewings, rental requests, product orders, and service requests will appear here.</Text>
          </View>
        ) : items.map((item) => {
          const name = item.property?.title || item.product?.name || item.service?.name || 'Request';
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.itemName}>{name}</Text>
                <View style={styles.status}><Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text></View>
              </View>
              <Text style={styles.amount}>{item.currency} {Number(item.total_amount).toLocaleString()}</Text>
              <Text style={styles.meta}>Scheduled date: {item.move_in_date}</Text>
              {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
              {item.status === 'Pending' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => Alert.alert('Cancel Request', `Cancel "${name}"?`, [
                    { text: 'Keep', style: 'cancel' },
                    { text: 'Cancel Request', style: 'destructive', onPress: () => cancelRequest(item) },
                  ])}
                >
                  <Text style={styles.cancelText}>Cancel request</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.deepCocoa },
  content: { padding: Spacing.lg, gap: Spacing.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.sm },
  emptyText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemName: { flex: 1, fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa },
  status: { backgroundColor: Colors.warmAlmond, borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  statusText: { fontSize: Typography.tiny, fontWeight: Typography.bold, color: Colors.deepCocoa, textTransform: 'capitalize' },
  amount: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.matteClay, marginTop: Spacing.sm },
  meta: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 3 },
  notes: { fontSize: Typography.caption, color: Colors.deepCocoa, marginTop: Spacing.sm, lineHeight: 18 },
  cancelButton: { alignSelf: 'flex-start', marginTop: Spacing.md, paddingVertical: Spacing.xs },
  cancelText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.error },
});
