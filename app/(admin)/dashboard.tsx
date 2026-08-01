import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

export default function AdminDashboardScreen() {
  const { user, usersList, signOut, setRole } = useAuthStore();
  const router = useRouter();

  const totalUsers = usersList.length;
  const pendingApprovals = usersList.filter(
    (u) => u.role_approval_status === 'pending' || u.requested_role
  ).length;
  const totalLandlords = usersList.filter((u) => u.role === 'landlord').length;
  const totalHunters = usersList.filter((u) => u.role === 'hunter').length;
  const totalRetailers = usersList.filter((u) => u.role === 'retailer').length;
  const totalMovers = usersList.filter((u) => u.role === 'mover').length;
  const totalClients = usersList.filter((u) => u.role === 'client').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Admin Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.adminBadgeText}>SYSTEM ADMIN</Text>
            <Text style={styles.title}>Control Center</Text>
          </View>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.signOutBtnText}>Exit Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.adminCard}>
          <Image
            source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?img=68' }}
            style={styles.avatar}
          />
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{user?.display_name || 'Super Admin'}</Text>
            <Text style={styles.adminEmail}>{user?.email || 'admin@email.com'}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.white} />
              <Text style={styles.roleBadgeText}>Platform Administrator</Text>
            </View>
          </View>
        </View>

        {/* Role Quick Switch Demo Pill Bar */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionHeading}>Preview Role Dashboards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.demoScroll}>
            {[
              { role: 'client', label: 'Client View', path: '/(client)/(explore)/homes' },
              { role: 'hunter', label: 'Hunter View', path: '/(hunter)/leads' },
              { role: 'landlord', label: 'Landlord View', path: '/(landlord)/portfolio' },
              { role: 'retailer', label: 'Retailer View', path: '/(retailer)/catalog' },
              { role: 'mover', label: 'Mover View', path: '/(mover)/jobs' },
            ].map((item) => (
              <TouchableOpacity
                key={item.role}
                style={styles.demoChip}
                onPress={() => {
                  setRole(item.role as any);
                  router.push(item.path as any);
                }}
              >
                <Text style={styles.demoChipText}>{item.label}</Text>
                <Ionicons name="open-outline" size={14} color={Colors.matteClay} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pending Approvals Notice Banner */}
        {pendingApprovals > 0 && (
          <TouchableOpacity
            style={styles.pendingNoticeBanner}
            onPress={() => router.push('/(admin)/approvals')}
            activeOpacity={0.85}
          >
            <View style={styles.pendingIconBg}>
              <Ionicons name="notifications-outline" size={20} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingBannerTitle}>
                {pendingApprovals} Pending Role {pendingApprovals === 1 ? 'Request' : 'Requests'}
              </Text>
              <Text style={styles.pendingBannerSub}>
                Users have registered and requested dashboard role access. Tap to review.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.deepCocoa} />
          </TouchableOpacity>
        )}

        {/* System Stats Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Platform Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.matteClay + '15' }]}>
                <Ionicons name="people" size={22} color={Colors.matteClay} />
              </View>
              <Text style={styles.statValue}>{totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="time" size={22} color="#F57C00" />
              </View>
              <Text style={[styles.statValue, { color: '#F57C00' }]}>{pendingApprovals}</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="business" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.statValue}>{totalLandlords}</Text>
              <Text style={styles.statLabel}>Landlords</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="search" size={22} color="#0288D1" />
              </View>
              <Text style={styles.statValue}>{totalHunters}</Text>
              <Text style={styles.statLabel}>House Hunters</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="storefront" size={22} color="#7B1FA2" />
              </View>
              <Text style={styles.statValue}>{totalRetailers}</Text>
              <Text style={styles.statLabel}>Retailers</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#EFEBE9' }]}>
                <Ionicons name="car" size={22} color="#5D4037" />
              </View>
              <Text style={styles.statValue}>{totalMovers}</Text>
              <Text style={styles.statLabel}>Movers</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Navigation */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Management Actions</Text>
          
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(admin)/approvals')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#F57C00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Review Role Approvals</Text>
              <Text style={styles.actionDesc}>Approve or reject requested user roles</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(admin)/users')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person-add" size={20} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Change User Roles</Text>
              <Text style={styles.actionDesc}>Manually promote/demote any registered user</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  adminBadgeText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
    letterSpacing: 1,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
    gap: 4,
  },
  signOutBtnText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.error,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.deepCocoa,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  adminInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  adminName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  adminEmail: {
    fontSize: Typography.caption,
    color: Colors.warmAlmond,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.matteClay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  demoSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  demoScroll: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warmAlmond,
    borderRadius: BorderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  demoChipText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  pendingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pendingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F57C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBannerTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#E65100',
  },
  pendingBannerSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeading: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  statLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  actionDesc: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
