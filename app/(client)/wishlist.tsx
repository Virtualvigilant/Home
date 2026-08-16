import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterTabs, PropertyCard, SectionHeader, ServiceCategory } from '../../src/components';
import { Colors, Spacing, Typography } from '../../src/constants/theme';
import { serviceCategories } from '../../src/data/mockData';
import { usePropertyStore } from '../../src/store/propertyStore';
import { useRouter } from 'expo-router';

const TABS = ['Saved Homes', 'Hunters'];

export default function WishlistScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const { properties, wishlistIds, toggleWishlist, isWishlisted, fetchProperties, fetchWishlist } = usePropertyStore();

  useEffect(() => {
    fetchProperties();
    fetchWishlist().catch(() => undefined);
  }, [fetchProperties, fetchWishlist]);

  const savedProperties = properties.filter((p) => wishlistIds.includes(p.id));

  const handlePropertyPress = (id: string) => {
    router.push(`/property/${id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Home Journey</Text>
        </View>

        <FilterTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === 0 && (
          <>
            {/* Saved Homes */}
            <SectionHeader title={`Saved homes (${savedProperties.length})`} />
            {savedProperties.length > 0 ? (
              <FlatList
                horizontal
                data={savedProperties}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <PropertyCard
                    property={item}
                    onPress={() => handlePropertyPress(item.id)}
                    onWishlist={() => toggleWishlist(item.id).catch((error) =>
                      Alert.alert('Wishlist Error', error?.message || 'Unable to update your wishlist.')
                    )}
                    isWishlisted={isWishlisted(item.id)}
                    showSavedBadge={true}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No saved homes yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the heart icon on any property to save it to your wishlist.
                </Text>
              </View>
            )}

            {/* Explore Services */}
            <SectionHeader title="Explore Services" />
            <FlatList
              horizontal
              data={serviceCategories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ServiceCategory
                  name={item.name}
                  icon={item.icon}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </>
        )}

        {activeTab === 1 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No saved hunters yet</Text>
            <Text style={styles.emptySubtitle}>
              Save hunters you like to find them quickly later.
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
  horizontalList: {
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
