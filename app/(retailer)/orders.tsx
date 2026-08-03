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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useRetailerStore, RetailerOrder } from '../../src/store/retailerStore';

export default function OrdersScreen() {
  const { orders, coordinateScoutDropoff, confirmClientSignoff } = useRetailerStore();

  const [selectedOrder, setSelectedOrder] = useState<RetailerOrder | null>(null);
  const [isScoutModalOpen, setIsScoutModalOpen] = useState(false);
  const [scoutName, setScoutName] = useState('Hunter Scout Alex');
  const [scoutNotes, setScoutNotes] = useState('');

  const handleOpenScoutCoordination = (order: RetailerOrder) => {
    setSelectedOrder(order);
    setScoutNotes(order.scout_notes || 'Deliver to building caretaker at 10:00 AM on move-in date.');
    setIsScoutModalOpen(true);
  };

  const handleSaveScoutCoordination = () => {
    if (!selectedOrder) return;
    coordinateScoutDropoff(selectedOrder.id, scoutName, scoutNotes);
    setIsScoutModalOpen(false);
    Alert.alert(
      'Drop-Off Coordinated!',
      `Delivery drop-off details for "${selectedOrder.client_name}" updated with House Hunter ${scoutName}.`
    );
  };

  const handleConfirmSignoff = (order: RetailerOrder) => {
    confirmClientSignoff(order.id);
    Alert.alert(
      'Payment Released from Escrow!',
      `Client "${order.client_name}" signed off on delivery. KES ${order.total_amount.toLocaleString()} has been released to your payout balance!`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Move-In Orders</Text>
          <Text style={styles.subtitle}>Location-specific furniture purchases linked with client move-in dates</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bag-handle-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Move-In Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders placed by home clients for move-in furniture packages will appear here.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const isSignedOff = order.status === 'Signed_Off';
            const isCoordinated = order.status === 'Scout_Coordinated' || isSignedOff;

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Linked Move-In Date Header Badge */}
                <View style={styles.moveInBadgeRow}>
                  <View style={styles.moveInBadge}>
                    <Ionicons name="calendar" size={14} color={Colors.white} />
                    <Text style={styles.moveInBadgeText}>Move-In Date: {order.move_in_date}</Text>
                  </View>
                  <View
                    style={[
                      styles.escrowBadge,
                      isSignedOff ? styles.escrowBadgeReleased : styles.escrowBadgeHeld,
                    ]}
                  >
                    <Ionicons
                      name={isSignedOff ? 'checkmark-circle' : 'lock-closed'}
                      size={12}
                      color={isSignedOff ? Colors.badgeSuccess : Colors.deepCocoa}
                    />
                    <Text style={[styles.escrowBadgeText, isSignedOff && { color: Colors.badgeSuccess }]}>
                      {isSignedOff ? 'Payment Released' : 'Escrow Secured'}
                    </Text>
                  </View>
                </View>

                {/* Client Info */}
                <View style={styles.clientRow}>
                  <Image source={{ uri: order.client_avatar }} style={styles.avatar} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{order.client_name}</Text>
                    <View style={styles.locRow}>
                      <Ionicons name="location" size={14} color={Colors.matteClay} />
                      <Text style={styles.locText}>{order.delivery_address}</Text>
                    </View>
                  </View>
                </View>

                {/* Purchased Items List */}
                <View style={styles.itemsBox}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>• {item.name}</Text>
                      <Text style={styles.itemPrice}>KES {item.price.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                {/* Scout Coordination Info Box if Coordinated */}
                {order.scout_notes && (
                  <View style={styles.scoutBox}>
                    <Ionicons name="person-outline" size={16} color={Colors.deepCocoa} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scoutTitle}>Coordinated with {order.scout_name || 'House Hunter'}</Text>
                      <Text style={styles.scoutSub}>{order.scout_notes}</Text>
                    </View>
                  </View>
                )}

                {/* Actions Footer */}
                <View style={styles.orderFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalLabel}>Total Purchase</Text>
                    <Text style={styles.totalAmount}>KES {order.total_amount.toLocaleString()}</Text>
                  </View>

                  <View style={{ gap: Spacing.xs }}>
                    {!isSignedOff && (
                      <TouchableOpacity
                        style={styles.scoutBtn}
                        onPress={() => handleOpenScoutCoordination(order)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="navigate-outline" size={14} color={Colors.deepCocoa} />
                        <Text style={styles.scoutBtnText}>
                          {isCoordinated ? 'Edit Scout Notes' : 'Coordinate Drop-off'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {!isSignedOff ? (
                      <TouchableOpacity
                        style={styles.signoffBtn}
                        onPress={() => handleConfirmSignoff(order)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
                        <Text style={styles.signoffBtnText}>Client Sign-off & Release Pay</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-done-circle" size={16} color={Colors.badgeSuccess} />
                        <Text style={styles.completedText}>Sign-off Complete</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SCOUT DROP-OFF COORDINATION MODAL */}
      <Modal visible={isScoutModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Coordinate Drop-off with Scout</Text>
              <TouchableOpacity onPress={() => setIsScoutModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Coordinate drop-off timing and key handoff instructions directly with the assigned House Hunter for client "{selectedOrder?.client_name}".
            </Text>

            <Text style={styles.inputLabel}>Assigned House Hunter / Scout</Text>
            <TextInput
              style={styles.textInput}
              value={scoutName}
              onChangeText={setScoutName}
              placeholder="e.g. Hunter Scout Alex"
            />

            <Text style={styles.inputLabel}>Drop-off Instructions & Timing</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
              value={scoutNotes}
              onChangeText={setScoutNotes}
              placeholder="e.g. Deliver to building caretaker at 10:00 AM on move-in date. House Hunter will verify entry."
              multiline
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveScoutCoordination} activeOpacity={0.8}>
              <Text style={styles.confirmBtnText}>Save Drop-Off Coordination</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.sm },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  moveInBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  moveInBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.matteClay, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  moveInBadgeText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  escrowBadgeHeld: { backgroundColor: Colors.warmAlmond },
  escrowBadgeReleased: { backgroundColor: '#ECFDF5' },
  escrowBadgeText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xs },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  clientName: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locText: { fontSize: Typography.caption, color: Colors.textSecondary },
  itemsBox: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, marginVertical: Spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  itemPrice: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  scoutBox: { flexDirection: 'row', gap: Spacing.xs, backgroundColor: '#FFFBEB', padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  scoutTitle: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.deepCocoa },
  scoutSub: { fontSize: Typography.tiny, color: Colors.textSecondary, marginTop: 1 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  totalLabel: { fontSize: Typography.caption, color: Colors.textSecondary },
  totalAmount: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa },
  scoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warmAlmond, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.pill },
  scoutBtnText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.deepCocoa },
  signoffBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.badgeSuccess, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.pill },
  signoffBtnText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.white },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.badgeSuccess },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  modalSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  inputLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.xs, marginBottom: 4 },
  textInput: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginBottom: Spacing.md },
  confirmBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md },
  confirmBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },
});
