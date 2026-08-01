import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { UserRole } from '../../src/lib/database.types';

const TABS = ['Pending', 'Approved', 'Rejected'];

export default function AdminApprovalsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const { usersList, approveRoleRequest, rejectRoleRequest } = useAuthStore();

  const pendingUsers = usersList.filter(
    (u) => u.role_approval_status === 'pending' || u.requested_role
  );

  const approvedUsers = usersList.filter(
    (u) => u.role_approval_status === 'approved' && u.role !== 'client' && u.role !== 'admin'
  );

  const rejectedUsers = usersList.filter(
    (u) => u.role_approval_status === 'rejected'
  );

  const displayList = activeTab === 0 ? pendingUsers : activeTab === 1 ? approvedUsers : rejectedUsers;

  const handleApprove = (userId: string, name: string, requestedRole: UserRole) => {
    approveRoleRequest(userId, requestedRole);
    Alert.alert(
      'Role Approved!',
      `${name} has been promoted to ${requestedRole.toUpperCase()}. They now have full access to the ${requestedRole} dashboard.`
    );
  };

  const handleReject = (userId: string, name: string) => {
    rejectRoleRequest(userId);
    Alert.alert('Request Rejected', `${name}'s request for dashboard role upgrade was rejected.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Role Approvals</Text>
          <Text style={styles.subtitle}>
            Review and grant dashboard access for Landlords, Hunters, Retailers & Movers
          </Text>
        </View>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <View style={styles.listContainer}>
          {displayList.map((userItem) => (
            <View key={userItem.id} style={styles.userCard}>
              <View style={styles.userRow}>
                <Image
                  source={{ uri: userItem.avatar_url || 'https://i.pravatar.cc/150?img=11' }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userItem.display_name}</Text>
                  <Text style={styles.userEmail}>{userItem.email}</Text>
                  <Text style={styles.userPhone}>{userItem.phone || '+254 712 345 678'}</Text>
                </View>
              </View>

              {/* Role Requested Box */}
              <View style={styles.roleRequestBox}>
                <View style={styles.roleRequestHeader}>
                  <Text style={styles.roleRequestLabel}>Requested Dashboard Access:</Text>
                  <View style={styles.requestedBadge}>
                    <Ionicons name="shield-outline" size={14} color={Colors.matteClay} />
                    <Text style={styles.requestedBadgeText}>
                      {(userItem.requested_role || userItem.role).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bioText}>
                  Current Role: <Text style={{ fontWeight: 'bold' }}>{userItem.role}</Text> • Signed up on {userItem.created_at}
                </Text>
              </View>

              {/* Actions */}
              {activeTab === 0 && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(userItem.id, userItem.display_name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() =>
                      handleApprove(
                        userItem.id,
                        userItem.display_name,
                        userItem.requested_role || 'landlord'
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                    <Text style={styles.approveBtnText}>
                      Approve as {(userItem.requested_role || 'landlord').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 1 && (
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.badgeSuccess} />
                  <Text style={styles.approvedStatusText}>
                    Approved as {userItem.role.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {displayList.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No applications found</Text>
            <Text style={styles.emptySubtitle}>
              New user role requests submitted during registration will appear here.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContainer: {
    marginTop: Spacing.lg,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  userEmail: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userPhone: {
    fontSize: Typography.tiny,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  roleRequestBox: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  roleRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleRequestLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  requestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmAlmond,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  requestedBadgeText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  bioText: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  rejectBtnText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.error,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  approveBtnText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  approvedStatusText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.badgeSuccess,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
