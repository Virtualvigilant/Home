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
import { UserRole } from '../../src/lib/database.types';
import { useRouter } from 'expo-router';

const roleOptions: { role: UserRole; label: string; icon: string }[] = [
  { role: 'client', label: 'Client', icon: 'person-outline' },
  { role: 'hunter', label: 'House Hunter', icon: 'search-outline' },
  { role: 'landlord', label: 'Landlord', icon: 'business-outline' },
  { role: 'retailer', label: 'Retailer', icon: 'storefront-outline' },
  { role: 'mover', label: 'Mover', icon: 'car-outline' },
];

const menuItems = [
  { icon: 'shield-checkmark-outline', label: 'Verification', badge: 'Verified' },
  { icon: 'document-text-outline', label: 'Lease History' },
  { icon: 'card-outline', label: 'Payment Methods' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
];

export default function ProfileScreen() {
  const { user, role, setRole } = useAuthStore();
  const router = useRouter();

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
    // Navigate to the new role's home screen
    switch (newRole) {
      case 'hunter':
        router.replace('/(hunter)/leads');
        break;
      case 'landlord':
        router.replace('/(landlord)/portfolio');
        break;
      case 'retailer':
        router.replace('/(retailer)/catalog');
        break;
      case 'mover':
        router.replace('/(mover)/jobs');
        break;
      default:
        router.replace('/(client)/(explore)/homes');
    }
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
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Role Switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Role</Text>
          <View style={styles.roleGrid}>
            {roleOptions.map((option) => (
              <TouchableOpacity
                key={option.role}
                style={[
                  styles.roleButton,
                  role === option.role && styles.roleButtonActive,
                ]}
                onPress={() => handleRoleSwitch(option.role)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as any}
                  size={22}
                  color={role === option.role ? Colors.white : Colors.deepCocoa}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    role === option.role && styles.roleButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
        <TouchableOpacity style={styles.signOutButton} activeOpacity={0.7}>
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
    flex: 1,
    marginLeft: Spacing.md,
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
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    borderColor: Colors.warmAlmond,
    backgroundColor: Colors.white,
  },
  roleButtonActive: {
    backgroundColor: Colors.matteClay,
    borderColor: Colors.matteClay,
  },
  roleButtonText: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: Colors.deepCocoa,
  },
  roleButtonTextActive: {
    color: Colors.white,
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
