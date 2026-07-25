import React, { useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar, FilterTabs, PropertyCard, SectionHeader } from '../../../src/components';
import { Colors, Spacing } from '../../../src/constants/theme';
import { useRouter } from 'expo-router';
import { usePropertyStore } from '../../../src/store/propertyStore';

const TABS = ['Homes', 'Marketplace', 'Services'];

export default function HomesScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { properties, isWishlisted, toggleWishlist } = usePropertyStore();

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

  const popularHomes = filteredProperties.filter((p) => p.status === 'Available' && p.is_verified);
  const featuredHomes = filteredProperties.filter((p) => p.is_verified);
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

        {/* Popular Homes Section */}
        <SectionHeader
          title="Popular homes in Nairobi"
          onSeeAll={() => {}}
        />
        <FlatList
          horizontal
          data={popularHomes.length > 0 ? popularHomes : properties.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item.id)}
              onWishlist={() => toggleWishlist(item.id)}
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
          onSeeAll={() => {}}
        />
        <FlatList
          horizontal
          data={featuredHomes.length > 0 ? featuredHomes : properties.slice(1, 5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item.id)}
              onWishlist={() => toggleWishlist(item.id)}
              isWishlisted={isWishlisted(item.id)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Available Next Month */}
        <SectionHeader
          title="Available next month in Nairobi"
          onSeeAll={() => {}}
        />
        <FlatList
          horizontal
          data={upcomingHomes.length > 0 ? upcomingHomes : properties.slice(2, 6)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => handlePropertyPress(item.id)}
              onWishlist={() => toggleWishlist(item.id)}
              isWishlisted={isWishlisted(item.id)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

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
});
