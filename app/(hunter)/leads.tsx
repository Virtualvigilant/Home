import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs, LeadCard } from '../../src/components';
import { Colors, Spacing, Typography } from '../../src/constants/theme';
import { usePropertyStore } from '../../src/store/propertyStore';
import { useRouter } from 'expo-router';

const TABS = ['Nearby Leads', 'Verified'];

export default function LeadsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const { hunterLeads, verifyLead, toggleWishlist } = usePropertyStore();

  const handleLeadPress = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  const handleVerify = (leadId: string, title: string) => {
    verifyLead(leadId);
    Alert.alert('Lead Verified!', `"${title}" has been physically verified. You will earn a bounty when booked.`);
  };

  const filteredLeads = activeTab === 0
    ? hunterLeads
    : hunterLeads.filter(l => l.status === 'Verified' || l.status === 'Booked');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Leads</Text>
        </View>

        <FilterTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <View style={styles.leadsList}>
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onPress={() => lead.property_id && handleLeadPress(lead.property_id)}
              onVerify={() => handleVerify(lead.id, lead.property?.title || 'Property')}
              onWishlist={() => lead.property_id && toggleWishlist(lead.property_id)}
            />
          ))}
        </View>

        {filteredLeads.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No leads yet</Text>
            <Text style={styles.emptySubtitle}>
              New property leads in your area will appear here.
            </Text>
          </View>
        )}

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
  leadsList: {
    marginTop: Spacing.lg,
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
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
});
