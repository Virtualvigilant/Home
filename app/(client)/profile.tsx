import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

const menuItems = [
  { icon: 'shield-checkmark-outline', label: 'Verification', badge: 'Verified' },
  { icon: 'document-text-outline', label: 'Lease History' },
  { icon: 'card-outline', label: 'Payment Methods' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
];

export default function ProfileScreen() {
  const { user, role, signOut } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <Image
            source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?img=11' }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.display_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
            </View>
          </View>
        </View>

        {/* Admin Shortcut Banner if user is Admin */}
        {role === 'admin' && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => router.push('/(admin)/dashboard')}
            activeOpacity={0.85}
          >
            <View style={styles.adminBannerIconBg}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>Admin Control Center</Text>
              <Text style={styles.adminBannerSub}>Manage user roles & pending approvals</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.deepCocoa} />
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              activeOpacity={0.7}
              onPress={() => Alert.alert(item.label, `${item.label} preferences & settings.`)}
            >
              <Ionicons name={item.icon as any} size={22} color={Colors.deepCocoa} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginTop: 2,
  },
  rolePill: {
    backgroundColor: Colors.matteClay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  roleText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  adminBannerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.matteClay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBannerTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  adminBannerSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.md,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.deepCocoa,
  },
  menuBadge: {
    backgroundColor: Colors.badgeVerified,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  menuBadgeText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
  signOutButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.pill,
  },
  signOutText: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.error,
  },
});
