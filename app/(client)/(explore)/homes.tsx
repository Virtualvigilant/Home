import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, FilterTabs, PropertyCard, SectionHeader } from '../../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { useRouter } from 'expo-router';
import { usePropertyStore } from '../../../src/store/propertyStore';
import { useHouseRequestStore } from '../../../src/store/houseRequestStore';
import { useAuthStore } from '../../../src/store/authStore';

const TABS = ['Homes', 'Marketplace', 'Services'];

const AMENITY_PRESETS = [
  '24/7 Security',
  'Dedicated Parking',
  'Borehole / 24/7 Water',
  'High-Speed Wi-Fi',
  'Private Balcony',
  'Backup Generator',
  'Fitness Gym',
  'Elevator / Lift',
  'Pet Friendly',
  'DSQ (Staff Qtrs)',
];

const TIMEFRAME_PRESETS = [
  'Immediately',
  'Within 2 Weeks',
  'End of this Month',
  'Next Month',
  'Flexible',
];

export default function HomesScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { properties, isWishlisted, toggleWishlist, fetchProperties, fetchWishlist } = usePropertyStore();
  const { myRequests, fetchMyRequests, createHouseRequest, cancelHouseRequest } = useHouseRequestStore();
  const { user } = useAuthStore();

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [moveInDate, setMoveInDate] = useState('Immediately');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24/7 Security',
    'Borehole / 24/7 Water',
  ]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchWishlist().catch(() => undefined);
    fetchMyRequests().catch(() => undefined);
  }, [fetchProperties, fetchWishlist, fetchMyRequests]);

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

  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmitHouseRequest = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to broadcast your housing request.');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Location Required', 'Please enter your desired neighborhood or location in Nairobi.');
      return;
    }

    const budgetNum = parseInt(maxBudget.replace(/[^0-9]/g, ''), 10);
    if (!budgetNum || budgetNum <= 0) {
      Alert.alert('Budget Required', 'Please enter a valid target monthly budget (KES).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createHouseRequest({
        location: location.trim(),
        max_budget: budgetNum,
        bedrooms: parseInt(bedrooms, 10) || 1,
        bathrooms: parseInt(bathrooms, 10) || 1,
        move_in_date: moveInDate,
        amenities: selectedAmenities,
        description: description.trim() || `Looking for a ${bedrooms}-bedroom home in ${location.trim()} around KES ${budgetNum.toLocaleString()}/mo.`,
      });

      setIsSubmitting(false);
      setIsRequestModalOpen(false);
      // Reset form
      setLocation('');
      setMaxBudget('');
      setDescription('');
      Alert.alert(
        'Housing Request Broadcasted! 🚀',
        `Your request for ${created.location} is live! Verified Landlords and House Hunters will view your demand and offer matching off-market properties.`
      );
    } catch (error: any) {
      setIsSubmitting(false);
      Alert.alert('Request Failed', error?.message || 'Unable to submit your house request.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to stop receiving property matches for this request?',
      [
        { text: 'No, Keep Active', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelHouseRequest(requestId);
              Alert.alert('Request Cancelled', 'Your housing request has been withdrawn.');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Unable to cancel this request.');
            }
          },
        },
      ]
    );
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
  const activeMyRequests = myRequests.filter((r) => r.status === 'Active');

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

        {/* UBER-STYLE "REQUEST A HOME" HERO CARD */}
        <TouchableOpacity
          style={styles.uberHeroCard}
          onPress={() => setIsRequestModalOpen(true)}
          activeOpacity={0.88}
        >
          <View style={styles.uberHeroHeader}>
            <View style={styles.uberHeroIconBadge}>
              <Ionicons name="flash" size={22} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.uberHeroTag}>
                <Text style={styles.uberHeroTagText}>⚡ UBER FOR HOUSING</Text>
              </View>
              <Text style={styles.uberHeroTitle}>Can't find your ideal home?</Text>
            </View>
          </View>
          <Text style={styles.uberHeroSub}>
            Broadcast what you need (neighborhood, budget, bedrooms) so verified Landlords and Scouts bring matching off-market units directly to you!
          </Text>
          <View style={styles.uberHeroAction}>
            <Text style={styles.uberHeroActionText}>Post Housing Acquisition Request</Text>
            <Ionicons name="arrow-forward-circle" size={22} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* ACTIVE REQUESTS TRACKER (IF CLIENT HAS POSTED) */}
        {activeMyRequests.length > 0 && (
          <View style={styles.activeRequestsSection}>
            <View style={styles.activeRequestsHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>Your Live House Requests ({activeMyRequests.length})</Text>
              </View>
            </View>
            {activeMyRequests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestLocation}>{req.location}</Text>
                    <Text style={styles.requestBudget}>
                      Budget: KES {req.max_budget.toLocaleString()}/mo • {req.bedrooms} Bed • {req.move_in_date}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelRequestBtn}
                    onPress={() => handleCancelRequest(req.id)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                    <Text style={styles.cancelRequestText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                {req.amenities.length > 0 && (
                  <View style={styles.reqChipsRow}>
                    {req.amenities.map((am, i) => (
                      <View key={i} style={styles.reqChip}>
                        <Text style={styles.reqChipText}>{am}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.requestStatusRow}>
                  <Ionicons name="radio-outline" size={14} color={Colors.badgeSuccess} />
                  <Text style={styles.requestStatusText}>
                    Active broadcast • Landlords and house hunters are scouting matching homes
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {filteredProperties.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="home-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Homes Available</Text>
            <Text style={styles.emptySubtitle}>
              There are currently no listed properties. Tap the broadcast card above to let landlords and hunters know what you are looking for!
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

      {/* BROADCAST HOUSE REQUEST MODAL */}
      <Modal visible={isRequestModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Your Next Home</Text>
                <Text style={styles.modalSub}>
                  Broadcast your exact requirements to landlords and scouts across Nairobi.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsRequestModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Desired Neighborhood / Location *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kilimani, Westlands, Kileleshwa, Ruaka"
                placeholderTextColor={Colors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Max Monthly Rent (KES) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 45000"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="number-pad"
                    value={maxBudget}
                    onChangeText={setMaxBudget}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Bedrooms</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bedrooms}
                    onChangeText={setBedrooms}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Target Move-In Date / Timeframe</Text>
              <View style={styles.pillsRow}>
                {TIMEFRAME_PRESETS.map((tf) => {
                  const isSel = moveInDate === tf;
                  return (
                    <TouchableOpacity
                      key={tf}
                      style={[styles.pillOption, isSel && styles.pillOptionActive]}
                      onPress={() => setMoveInDate(tf)}
                    >
                      <Text style={[styles.pillText, isSel && styles.pillTextActive]}>{tf}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Essential Amenities</Text>
              <View style={styles.pillsRow}>
                {AMENITY_PRESETS.map((am) => {
                  const isSel = selectedAmenities.includes(am);
                  return (
                    <TouchableOpacity
                      key={am}
                      style={[styles.pillOption, isSel && styles.pillOptionActive]}
                      onPress={() => handleToggleAmenity(am)}
                    >
                      <Ionicons
                        name={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                        size={14}
                        color={isSel ? Colors.white : Colors.deepCocoa}
                      />
                      <Text style={[styles.pillText, isSel && styles.pillTextActive]}>{am}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Specific Preferences / Notes</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                placeholder="e.g. Must have natural lighting, modern kitchen finishes, high speed internet ready..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={[styles.broadcastSubmitBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitHouseRequest}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={18} color={Colors.white} />
                <Text style={styles.broadcastSubmitBtnText}>
                  {isSubmitting ? 'Broadcasting...' : 'Broadcast House Acquisition Request'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
  },

  // Uber-Style Hero Card
  uberHeroCard: {
    backgroundColor: Colors.deepCocoa,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.card,
  },
  uberHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  uberHeroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.matteClay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberHeroTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 197, 178, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginBottom: 2,
  },
  uberHeroTagText: {
    color: Colors.warmAlmond,
    fontSize: 9,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  uberHeroTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  uberHeroSub: {
    fontSize: Typography.caption,
    color: Colors.warmAlmond,
    lineHeight: 18,
    marginVertical: Spacing.xs,
  },
  uberHeroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  uberHeroActionText: {
    color: Colors.white,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
  },

  // Active Requests Tracker
  activeRequestsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  activeRequestsHeader: {
    marginBottom: Spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.badgeSuccess,
  },
  liveText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.badgeSuccess,
    ...Shadows.card,
  },
  requestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestLocation: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  requestBudget: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 4,
  },
  cancelRequestText: {
    fontSize: Typography.tiny,
    color: Colors.error,
    fontWeight: Typography.semiBold,
  },
  reqChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.xs,
  },
  reqChip: {
    backgroundColor: Colors.softCream,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  reqChipText: {
    fontSize: 10,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
  },
  requestStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  requestStatusText: {
    fontSize: 10,
    color: Colors.textSecondary,
    flex: 1,
  },

  // Empty Card
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

  // Modal
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  modalSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
    marginBottom: Spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pillOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  pillOptionActive: {
    backgroundColor: Colors.matteClay,
    borderColor: Colors.matteClay,
  },
  pillText: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
  },
  pillTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  broadcastSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  broadcastSubmitBtnText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
  },
});
