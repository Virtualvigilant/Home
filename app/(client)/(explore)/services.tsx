import React, { useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, FilterTabs, SectionHeader, ServiceCategory } from '../../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { serviceCategories } from '../../../src/data/mockData';
import { Service } from '../../../src/lib/database.types';
import { supabase } from '../../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';

const TABS = ['Homes', 'Marketplace', 'Services'];

const ALL_CATEGORY = { id: 'cat_all', name: 'All Services', icon: 'grid', count: 0 };
const categoriesWithAll = [ALL_CATEGORY, ...serviceCategories];

export default function ServicesScreen() {
  const [activeTab, setActiveTab] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Services');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'rating'>('default');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [requestDetails, setRequestDetails] = useState('');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    const loadServices = async () => {
      try {
        const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
        if (data) setServices(data as Service[]);
      } catch (e) {}
    };
    loadServices();
  }, []);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index === 0) {
      router.push('/(client)/(explore)/homes');
    } else if (index === 1) {
      router.push('/(client)/(explore)/marketplace');
    }
  };

  const handleCategoryPress = (categoryName: string) => {
    if (selectedCategory === categoryName && categoryName !== 'All Services') {
      setSelectedCategory('All Services');
    } else {
      setSelectedCategory(categoryName);
    }
  };

  const handleBookService = async () => {
    if (!selectedService || !user || isBooking) return;
    if (!requestDetails.trim()) {
      Alert.alert('Details Required', 'Add the service address, preferred date/time, and any important instructions.');
      return;
    }
    setIsBooking(true);
    const { error } = await supabase.from('bookings').insert({
      client_id: user.id,
      property_id: null,
      product_id: null,
      service_id: selectedService.id,
      move_in_date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      total_amount: selectedService.price,
      currency: selectedService.currency || 'KES',
      notes: requestDetails.trim(),
    });
    if (error) {
      setIsBooking(false);
      Alert.alert('Request Failed', error.message || 'Unable to request this service.');
      return;
    }
    const sName = selectedService.name;
    setIsBooking(false);
    setSelectedService(null);
    setRequestDetails('');
    Alert.alert('Service Requested', `Your request for "${sName}" was sent to the provider for confirmation.`);
  };

  // Filter by category name
  let filteredServices = services.filter((service) => {
    if (selectedCategory === 'All Services') return true;
    if (selectedCategory === 'Movers' && service.type === 'Mover') return true;
    if (selectedCategory === 'Cleaners' && service.type === 'Cleaner') return true;
    if (selectedCategory === 'Furniture Bundles' && service.type === 'Furniture_Bundle') return true;
    if (selectedCategory === 'Setup' && service.type === 'Setup') return true;
    return service.type.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredServices = filteredServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
    );
  }

  // Sort services
  if (sortBy === 'price_low') {
    filteredServices = [...filteredServices].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'rating') {
    filteredServices = [...filteredServices].sort((a, b) => b.rating - a.rating);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchBar
          placeholder="Search services (Movers, Cleaners, Setup)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Top Explore Tabs */}
        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Service Categories Horizontal Scroll */}
        <SectionHeader
          title="Explore Categories"
          subtitle={selectedCategory !== 'All Services' ? `Filtering by ${selectedCategory}` : undefined}
          onSeeAll={() => setSelectedCategory('All Services')}
        />
        <FlatList
          horizontal
          data={categoriesWithAll}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceCategory
              name={item.name}
              icon={item.icon}
              count={item.count}
              isSelected={selectedCategory === item.name}
              onPress={() => handleCategoryPress(item.name)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />

        {/* Sort & Filter Pills Bar */}
        <View style={styles.sortFilterBar}>
          <Text style={styles.resultsCount}>
            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
          </Text>
          <View style={styles.sortPills}>
            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'default' && styles.sortPillActive]}
              onPress={() => setSortBy('default')}
            >
              <Text style={[styles.sortPillText, sortBy === 'default' && styles.sortPillTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'price_low' && styles.sortPillActive]}
              onPress={() => setSortBy('price_low')}
            >
              <Text style={[styles.sortPillText, sortBy === 'price_low' && styles.sortPillTextActive]}>Price ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'rating' && styles.sortPillActive]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.sortPillText, sortBy === 'rating' && styles.sortPillTextActive]}>Top Rated</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filter Clear Tag */}
        {selectedCategory !== 'All Services' && (
          <View style={styles.activeFilterTag}>
            <Text style={styles.activeFilterText}>Filtered by: {selectedCategory}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory('All Services')}>
              <Ionicons name="close-circle" size={18} color={Colors.matteClay} />
            </TouchableOpacity>
          </View>
        )}

        {/* Service Listings */}
        {filteredServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="construct-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Services Available</Text>
            <Text style={styles.emptySubtitle}>
              There are currently no listed home services. Service providers can list services to display them here!
            </Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => setSelectedService(service)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: service.image_url || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800' }}
                style={styles.serviceImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.serviceInfo}>
                <View style={styles.typeBadgeRow}>
                  <Text style={styles.serviceType}>{service.type.replace('_', ' ')}</Text>
                  {service.availability && (
                    <View style={styles.availableDotRow}>
                      <View style={styles.availableDot} />
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>
                    From KES {service.price.toLocaleString()}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={Colors.deepCocoa} />
                    <Text style={styles.ratingText}> {service.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SERVICE BOOKING MODAL */}
      <Modal visible={!!selectedService} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedService && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedService.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedService(null)}>
                    <Ionicons name="close" size={24} color={Colors.deepCocoa} />
                  </TouchableOpacity>
                </View>

                {selectedService.image_url && (
                  <Image
                    source={{ uri: selectedService.image_url }}
                    style={styles.serviceModalImage}
                    contentFit="cover"
                  />
                )}

                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>
                    KES {selectedService.price.toLocaleString()}
                  </Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {selectedService.type.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.descriptionHeading}>Service Overview</Text>
                <Text style={styles.descriptionText}>{selectedService.description}</Text>

                <Text style={styles.requestLabel}>Address, preferred date/time, and instructions</Text>
                <TextInput
                  style={styles.requestInput}
                  placeholder="e.g. Pickup in Kilimani, deliver to Westlands on 24 Aug at 10:00 AM"
                  placeholderTextColor={Colors.textTertiary}
                  value={requestDetails}
                  onChangeText={setRequestDetails}
                  multiline
                  maxLength={1000}
                />

                <View style={styles.ratingDetailRow}>
                  <Ionicons name="star" size={16} color={Colors.deepCocoa} />
                  <Text style={styles.ratingDetailText}>
                    {selectedService.rating} / 5.0 Rated by verified clients
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={handleBookService}
                  disabled={isBooking || !selectedService.availability}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.bookBtnText}>
                    {isBooking ? 'Booking Service...' : 'Book Service Now'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sortFilterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  resultsCount: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  sortPills: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortPill: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sortPillActive: {
    backgroundColor: Colors.matteClay,
    borderColor: Colors.matteClay,
  },
  sortPillText: {
    fontSize: Typography.tiny,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
  },
  sortPillTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5EF',
    borderWidth: 1,
    borderColor: Colors.warmAlmond,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  activeFilterText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.matteClay,
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  serviceImage: {
    width: '100%',
    height: 140,
  },
  serviceInfo: {
    padding: Spacing.md,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceType: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    color: Colors.matteClay,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  availableDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.badgeVerified,
    marginRight: 4,
  },
  availableText: {
    fontSize: Typography.tiny,
    color: Colors.badgeVerified,
    fontWeight: Typography.semiBold,
  },
  serviceName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginTop: 4,
  },
  serviceDesc: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  servicePrice: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
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
    lineHeight: 20,
  },
  resetFilterBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.matteClay,
  },
  resetFilterText: {
    fontSize: Typography.bodySmall,
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
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    flex: 1,
    marginRight: Spacing.md,
  },
  serviceModalImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  priceText: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  typeBadge: {
    backgroundColor: Colors.warmAlmond,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  typeBadgeText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  descriptionHeading: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.xs,
  },
  requestLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  requestInput: {
    minHeight: 78,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    color: Colors.deepCocoa,
    backgroundColor: Colors.softCream,
    textAlignVertical: 'top',
  },
  descriptionText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  ratingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ratingDetailText: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
    marginLeft: 6,
    fontWeight: Typography.medium,
  },
  bookBtn: {
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
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
});
