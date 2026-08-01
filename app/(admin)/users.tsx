import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { UserRole, Profile } from '../../src/lib/database.types';

const allRoles: { role: UserRole; label: string; icon: any }[] = [
  { role: 'client', label: 'Client (Normal User)', icon: 'person-outline' },
  { role: 'landlord', label: 'Landlord', icon: 'business-outline' },
  { role: 'hunter', label: 'House Hunter', icon: 'search-outline' },
  { role: 'retailer', label: 'Retailer', icon: 'storefront-outline' },
  { role: 'mover', label: 'Mover', icon: 'car-outline' },
  { role: 'admin', label: 'Administrator', icon: 'shield-checkmark-outline' },
];

export default function AdminUsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const { usersList, changeUserRole, toggleUserVerification } = useAuthStore();

  const filteredUsers = searchQuery
    ? usersList.filter(
        (u) =>
          u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usersList;

  const handleRoleChange = (targetRole: UserRole) => {
    if (!selectedUser) return;
    changeUserRole(selectedUser.id, targetRole);
    setIsRoleModalOpen(false);
    Alert.alert(
      'Role Updated!',
      `${selectedUser.display_name}'s role has been changed to ${targetRole.toUpperCase()}. They can now access the ${targetRole} dashboard.`
    );
    setSelectedUser(null);
  };

  const handleToggleVerification = (userId: string, name: string, currentVerified: boolean) => {
    toggleUserVerification(userId);
    Alert.alert(
      currentVerified ? 'Verification Revoked' : 'User Verified',
      `${name} is now ${currentVerified ? 'unverified' : 'verified'} on the platform.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>
            Manage registered users and assign dashboard access permissions
          </Text>
        </View>

        <SearchBar
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.usersListContainer}>
          {filteredUsers.map((userItem) => (
            <View key={userItem.id} style={styles.userCard}>
              <View style={styles.userRow}>
                <Image
                  source={{ uri: userItem.avatar_url || 'https://i.pravatar.cc/150?img=11' }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName}>{userItem.display_name}</Text>
                    {userItem.verification_status && (
                      <Ionicons name="checkmark-circle" size={16} color={Colors.badgeVerified} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.userEmail}>{userItem.email}</Text>
                  <Text style={styles.userPhone}>{userItem.phone || '+254 712 345 678'}</Text>
                </View>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{userItem.role.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={() =>
                    handleToggleVerification(
                      userItem.id,
                      userItem.display_name,
                      userItem.verification_status
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={userItem.verification_status ? 'shield-outline' : 'shield-checkmark-outline'}
                    size={16}
                    color={userItem.verification_status ? Colors.textTertiary : Colors.badgeVerified}
                  />
                  <Text style={styles.verifyBtnText}>
                    {userItem.verification_status ? 'Unverify' : 'Verify'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeRoleBtn}
                  onPress={() => {
                    setSelectedUser(userItem);
                    setIsRoleModalOpen(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color={Colors.white} />
                  <Text style={styles.changeRoleBtnText}>Change Role</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CHANGE ROLE MODAL */}
      <Modal visible={isRoleModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Role for {selectedUser.display_name}</Text>
                  <TouchableOpacity onPress={() => setIsRoleModalOpen(false)}>
                    <Ionicons name="close" size={24} color={Colors.deepCocoa} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtext}>
                  Select the dashboard role to grant to this user. Changing their role unlocks that role's interface immediately.
                </Text>

                <View style={styles.roleOptionsList}>
                  {allRoles.map((item) => (
                    <TouchableOpacity
                      key={item.role}
                      style={[
                        styles.roleOptionCard,
                        selectedUser.role === item.role && styles.roleOptionActive,
                      ]}
                      onPress={() => handleRoleChange(item.role)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={selectedUser.role === item.role ? Colors.matteClay : Colors.deepCocoa}
                      />
                      <Text
                        style={[
                          styles.roleOptionText,
                          selectedUser.role === item.role && styles.roleOptionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {selectedUser.role === item.role && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.matteClay} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  usersListContainer: {
    marginTop: Spacing.md,
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
  rolePill: {
    backgroundColor: Colors.matteClay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  rolePillText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 4,
  },
  verifyBtnText: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
  },
  changeRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.matteClay,
    gap: 4,
  },
  changeRoleBtnText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    flex: 1,
    marginRight: Spacing.md,
  },
  modalSubtext: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  roleOptionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.softCream,
    gap: Spacing.md,
  },
  roleOptionActive: {
    borderColor: Colors.matteClay,
    backgroundColor: '#FAF5EF',
  },
  roleOptionText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.medium,
    color: Colors.deepCocoa,
    flex: 1,
  },
  roleOptionTextActive: {
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
});
