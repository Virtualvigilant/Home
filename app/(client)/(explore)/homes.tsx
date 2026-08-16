import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, FilterTabs, PropertyCard, SectionHeader } from '../../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { useRouter } from 'expo-router';
import { usePropertyStore } from '../../../src/store/propertyStore';

const TABS = ['Homes', 'Marketplace', 'Services'];

export default function HomesScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { properties, isWishlisted, toggleWishlist, fetchProperties, fetchWishlist } = usePropertyStore();

  useEffect(() => {
    fetchProperties();
    fetchWishlist().catch(() => undefined);
  }, [fetchProperties, fetchWishlist]);

  const handleWishlist = (propertyId: string) => {
    toggleWishlist(propertyId).catch((error) =>
      Alert.alert('Wishlist Error', error?.message || 'Unable to update your wishlist.')
    );
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index === 1) {
      router.push('/(client)/(explore)/marketplace');
    } else if (index === 2) {
      router.push('/(client)/(explore)/services');
    }
  };

  const handlePropertyPress = (id: string) => {
    router.push(`/property/${id}`);
  };

  const filteredProperties = searchQuery
    ? properties.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : properties;

  const popularHomes = filteredProperties.filter((p) => p.status === 'Available');
  const featuredHomes = filteredProperties;
  const upcomingHomes = filteredProperties.filter((p) => p.status === 'Available');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <SearchBar
          placeholder="Start your home search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Tabs */}
        <FilterTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {filteredProperties.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="home-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Homes Available</Text>
            <Text style={styles.emptySubtitle}>
              There are currently no listed properties. Landlords and hunters can add new homes to display them here!
            </Text>
          </View>
        ) : (
          <>
            {/* Popular Homes Section */}
            <SectionHeader
              title="Popular homes in Nairobi"
            />
            <FlatList
              horizontal
              data={popularHomes.length > 0 ? popularHomes : filteredProperties}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PropertyCard
                  property={item}
                  onPress={() => handlePropertyPress(item.id)}
                  onWishlist={() => handleWishlist(item.id)}
                  isWishlisted={isWishlisted(item.id)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />

            {/* Featured Section */}
            <SectionHeader
              title="Great homes for your next move"
              subtitle="Plus, get Home credit when you book a featured property."
            />
            <FlatList
              horizontal
              data={featuredHomes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PropertyCard
                  property={item}
                  onPress={() => handlePropertyPress(item.id)}
                  onWishlist={() => handleWishlist(item.id)}
                  isWishlisted={isWishlisted(item.id)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </>
        )}

        {/* Bottom padding */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
  },
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
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
