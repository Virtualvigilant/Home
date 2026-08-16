import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  TextInput,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { usePropertyStore } from '../../src/store/propertyStore';
import { getValidPropertyImages, DEFAULT_PROPERTY_IMAGE } from '../../src/lib/imageUtils';
import { Badge } from '../../src/components/Badge';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    properties,
    isWishlisted,
    toggleWishlist,
    bookTour,
    rentProperty,
    fetchProperties,
  } = usePropertyStore();

  const property = properties.find((p) => p.id === id);
  const wishlisted = property ? isWishlisted(property.id) : false;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showDescriptionMore, setShowDescriptionMore] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Modals
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [tourDate, setTourDate] = useState('Tomorrow, 2:00 PM');
  const [tourNote, setTourNote] = useState('');
  const [tourBooked, setTourBooked] = useState(false);

  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mpesaNumber, setMpesaNumber] = useState('254712345678');
  const [rentProcessing, setRentProcessing] = useState(false);
  const [rentSuccess, setRentSuccess] = useState(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [landlordProfile, setLandlordProfile] = useState<any | null>(null);
  const [hunterProfile, setHunterProfile] = useState<any | null>(null);

  useEffect(() => {
    if (!property) fetchProperties();
  }, [fetchProperties, property]);

  useEffect(() => {
    if (!property) return;
    supabase.rpc('get_public_profile', { profile_id: property.landlord_id })
      .then(({ data }) => setLandlordProfile(data?.[0] || null));
    if (property.hunter_id) {
      supabase.rpc('get_public_profile', { profile_id: property.hunter_id })
        .then(({ data }) => setHunterProfile(data?.[0] || null));
    }
  }, [property?.id]);

  const defaultLandlord = {
    id: 'u3',
    display_name: 'Property Host',
    avatar_url: 'https://i.pravatar.cc/150?img=12',
    location: property?.location || 'Nairobi',
    bio: 'Verified property landlord listing on Home App.',
    phone: '+254 700 000 000',
    email: 'landlord@home.co.ke',
    role: 'landlord' as const,
    verification_status: true,
    city: 'Nairobi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const defaultHunter = {
    id: 'u2',
    display_name: 'Verified Hunter',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
    location: 'Nairobi',
    bio: 'Verified house hunter on Home App.',
    phone: '+254 711 000 000',
    email: 'hunter@home.co.ke',
    role: 'hunter' as const,
    verification_status: true,
    city: 'Nairobi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const landlord = landlordProfile || defaultLandlord;
  const hunter = hunterProfile || (property?.hunter_id ? defaultHunter : null);

  const formatPrice = (price: number) => {
    return `KES ${price?.toLocaleString() || '0'}`;
  };

  const getAmenityIcon = (amenity: string): any => {
    const lower = amenity.toLowerCase();
    if (lower.includes('pool')) return 'water-sharp';
    if (lower.includes('security') || lower.includes('fence') || lower.includes('cctv')) return 'shield-checkmark-outline';
    if (lower.includes('parking')) return 'car-outline';
    if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) return 'wifi-outline';
    if (lower.includes('gym') || lower.includes('fitness')) return 'fitness-outline';
    if (lower.includes('balcony')) return 'home-outline';
    if (lower.includes('garden') || lower.includes('lawn')) return 'leaf-outline';
    if (lower.includes('elevator') || lower.includes('lift')) return 'swap-vertical-outline';
    if (lower.includes('dsq') || lower.includes('staff')) return 'bed-outline';
    if (lower.includes('water') || lower.includes('borehole')) return 'water-outline';
    if (lower.includes('generator') || lower.includes('backup')) return 'flash-outline';
    if (lower.includes('tv') || lower.includes('dstv') || lower.includes('cable')) return 'tv-outline';
    if (lower.includes('laundry')) return 'shirt-outline';
    if (lower.includes('children') || lower.includes('kids') || lower.includes('play')) return 'happy-outline';
    if (lower.includes('garbage') || lower.includes('trash')) return 'trash-outline';
    return 'checkmark-circle-outline';
  };

  const handleShare = async () => {
    if (!property) return;
    await Share.share({
      title: property.title,
      message: `View ${property.title} on Home: /property/${property.id}`,
    });
  };

  const handleConfirmTour = async () => {
    if (!property) return;
    setTourBooked(true);
    try {
      await bookTour(property.id, tourDate, tourNote);
      setTourBooked(false);
      setIsTourModalOpen(false);
      Alert.alert(
        'Viewing Requested',
        `Your request for ${property.title} on ${tourDate} was sent. The property host must confirm it.`
      );
    } catch (error: any) {
      setTourBooked(false);
      Alert.alert('Request Failed', error?.message || 'Unable to schedule this viewing.');
    }
  };

  const handleConfirmRent = async () => {
    if (!property) return;
    setRentProcessing(true);
    try {
      const deposit = property.price;
      const total = property.price + deposit + 1500;
      await rentProperty(property.id, total, `Preferred payment method: ${paymentMethod.toUpperCase()}`);
      setRentProcessing(false);
      setIsRentModalOpen(false);
      Alert.alert(
        'Rental Request Created',
        `Your request for "${property.title}" was created. No payment has been charged; complete payment only after the host confirms and a secure payment prompt is issued.`
      );
    } catch (error: any) {
      setRentProcessing(false);
      Alert.alert('Request Failed', error?.message || 'Unable to create this rental request.');
    }
  };

  if (!property) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
          <Ionicons name="home-outline" size={48} color={Colors.textTertiary} />
          <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>Property not found</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => router.back()}>
            <Text style={styles.confirmBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.deepCocoa} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {property?.title || 'Property Detail'}
        </Text>
        <View style={styles.topRightButtons}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color={Colors.deepCocoa} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, { marginLeft: Spacing.xs }]}
            onPress={() => toggleWishlist(property.id).catch((error) =>
              Alert.alert('Wishlist Error', error?.message || 'Unable to update your wishlist.')
            )}
            activeOpacity={0.8}
          >
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={wishlisted ? Colors.matteClay : Colors.deepCocoa}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Image Carousel */}
        {(() => {
          const displayImages = getValidPropertyImages(property?.images);

          return (
            <View style={styles.carouselContainer}>
              <FlatList
                horizontal
                pagingEnabled
                data={displayImages}
                keyExtractor={(_, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setActiveImageIndex(index);
                }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => {
                      setSelectedPhoto(failedImages[index] ? DEFAULT_PROPERTY_IMAGE : item);
                      setIsPhotoViewerOpen(true);
                    }}
                  >
                    <Image
                      source={{ uri: failedImages[index] ? DEFAULT_PROPERTY_IMAGE : item }}
                      style={styles.carouselImage}
                      contentFit="cover"
                      transition={200}
                      onError={() => setFailedImages((prev) => ({ ...prev, [index]: true }))}
                    />
                  </TouchableOpacity>
                )}
              />

              {/* Page Dots Indicator */}
              {displayImages.length > 1 && (
                <View style={styles.paginationBadge}>
                  <Text style={styles.paginationText}>
                    {activeImageIndex + 1} / {displayImages.length}
                  </Text>
                </View>
              )}

              {/* Verified Badge Overlay */}
              {property?.is_verified && (
                <View style={styles.verifiedBadgePos}>
                  <Badge label="Verified by Hunter" variant="verified" />
                </View>
              )}

              {/* Status Badge Overlay */}
              <View style={styles.statusBadgePos}>
                <Badge
                  label={property?.status === 'Available' ? 'Available Now' : 'Rented'}
                  variant={property?.status === 'Available' ? 'success' : 'pending'}
                />
              </View>
            </View>
          );
        })()}

        {/* Title, Price & Rating Section */}
        <View style={styles.mainInfoSection}>
          <View style={styles.titlePriceRow}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>{formatPrice(property.price)}</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
          </View>

          {/* Location & Rating */}
          <View style={styles.locationRatingRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={18} color={Colors.matteClay} />
              <Text style={styles.locationText}>{property.location}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.deepCocoa} />
              <Text style={styles.ratingText}> {property.rating}</Text>
              <Text style={styles.reviewCountText}> ({property.review_count})</Text>
            </View>
          </View>
        </View>

        {/* Key Features Specs Cards */}
        <View style={styles.specsGrid}>
          <View style={styles.specCard}>
            <Ionicons name="bed-outline" size={24} color={Colors.matteClay} />
            <Text style={styles.specValue}>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</Text>
            <Text style={styles.specLabel}>Bedrooms</Text>
          </View>
          <View style={styles.specCard}>
            <Ionicons name="water-outline" size={24} color={Colors.matteClay} />
            <Text style={styles.specValue}>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</Text>
            <Text style={styles.specLabel}>Bathrooms</Text>
          </View>
          <View style={styles.specCard}>
            <Ionicons name="home-outline" size={24} color={Colors.matteClay} />
            <Text style={styles.specValue}>Furnished</Text>
            <Text style={styles.specLabel}>Type</Text>
          </View>
          <View style={styles.specCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.matteClay} />
            <Text style={styles.specValue}>Verified</Text>
            <Text style={styles.specLabel}>Escrow Protection</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>About this Home</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={showDescriptionMore ? undefined : 3}
          >
            {property.description}
          </Text>
          {property.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setShowDescriptionMore(!showDescriptionMore)}
              style={styles.readMoreBtn}
            >
              <Text style={styles.readMoreText}>
                {showDescriptionMore ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Amenities Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Amenities & Facilities</Text>
          <View style={styles.amenitiesGrid}>
            {property.amenities.map((item) => (
              <View key={item} style={styles.amenityItem}>
                <View style={styles.amenityIconBg}>
                  <Ionicons name={getAmenityIcon(item)} size={20} color={Colors.matteClay} />
                </View>
                <Text style={styles.amenityLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location Map Preview Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Location & Neighborhood</Text>
          <View style={styles.mapCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800' }}
              style={styles.mapImage}
              contentFit="cover"
            />
            <View style={styles.mapOverlay}>
              <View style={styles.mapPinContainer}>
                <Ionicons name="location-sharp" size={28} color={Colors.matteClay} />
              </View>
              <Text style={styles.mapLocationText}>{property.location}</Text>
              <Text style={styles.mapSubtext}>Safe neighborhood with access to transport & shops</Text>
            </View>
          </View>
        </View>

        {/* Host & Hunter Contacts */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Listed & Sourced By</Text>
          
          {/* Landlord Card */}
          <View style={styles.contactCard}>
            <Image
              source={{ uri: landlord?.avatar_url || 'https://i.pravatar.cc/150?img=12' }}
              style={styles.contactAvatar}
            />
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{landlord?.display_name || 'Property Host'}</Text>
              <Text style={styles.contactRole}>Property Landlord • {landlord?.location || 'Nairobi'}</Text>
              <Text style={styles.contactBio}>{landlord?.bio || 'Verified property host.'}</Text>
            </View>
            <TouchableOpacity
              style={styles.contactActionBtn}
              onPress={() => setIsContactModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.matteClay} />
            </TouchableOpacity>
          </View>

          {/* Hunter Sourced Info (If exists) */}
          {hunter && property.is_verified && (
            <View style={[styles.contactCard, { marginTop: Spacing.sm, backgroundColor: '#F9F6F0' }]}>
              <Image
                source={{ uri: hunter?.avatar_url || 'https://i.pravatar.cc/150?img=5' }}
                style={styles.contactAvatar}
              />
              <View style={styles.contactDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.contactName}>{hunter?.display_name || 'Verified Hunter'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.badgeVerified} style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.contactRole}>Verified House Hunter</Text>
                <Text style={styles.contactBio}>Physically inspected & confirmed listing details</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom padding for floating bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.tourButton}
          onPress={() => setIsTourModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.deepCocoa} />
          <Text style={styles.tourButtonText}>Schedule Tour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rentButton,
            property.status === 'Rented' && styles.rentButtonDisabled,
          ]}
          disabled={property.status === 'Rented'}
          onPress={() => setIsRentModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="key-outline" size={20} color={Colors.white} />
          <Text style={styles.rentButtonText}>
            {property.status === 'Rented' ? 'Already Rented' : 'Request to Rent'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PHOTO VIEWER FULLSCREEN MODAL */}
      <Modal visible={isPhotoViewerOpen} transparent animationType="fade">
        <View style={styles.photoModalBg}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={() => setIsPhotoViewerOpen(false)}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullPhoto}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>

      {/* SCHEDULE TOUR MODAL */}
      <Modal visible={isTourModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Property Viewing</Text>
              <TouchableOpacity onPress={() => setIsTourModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Pick your preferred date and time to view "{property.title}".
            </Text>

            <Text style={styles.inputLabel}>Preferred Date & Time</Text>
            <View style={styles.datePickerContainer}>
              {['Tomorrow, 10:00 AM', 'Tomorrow, 2:00 PM', 'Saturday, 11:00 AM', 'Sunday, 3:00 PM'].map((dt) => (
                <TouchableOpacity
                  key={dt}
                  style={[
                    styles.dateOption,
                    tourDate === dt && styles.dateOptionActive,
                  ]}
                  onPress={() => setTourDate(dt)}
                >
                  <Text style={[styles.dateOptionText, tourDate === dt && styles.dateOptionTextActive]}>
                    {dt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Notes for Landlord (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Asking about parking space or move-in timeline..."
              placeholderTextColor={Colors.textTertiary}
              value={tourNote}
              onChangeText={setTourNote}
            />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmTour}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {tourBooked ? 'Confirming...' : 'Confirm Viewing Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RENT WITH ESCROW MODAL */}
      <Modal visible={isRentModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Rental with Escrow</Text>
              <TouchableOpacity onPress={() => setIsRentModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            {/* Price Breakdown */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>1st Month Rent</Text>
                <Text style={styles.breakdownValue}>{formatPrice(property.price)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Security Deposit</Text>
                <Text style={styles.breakdownValue}>{formatPrice(property.price)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Escrow & Inspection Fee</Text>
                <Text style={styles.breakdownValue}>KES 1,500</Text>
              </View>
              <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                <Text style={styles.breakdownTotalLabel}>Total Escrow Deposit</Text>
                <Text style={styles.breakdownTotalValue}>
                  {formatPrice(property.price * 2 + 1500)}
                </Text>
              </View>
            </View>

            <View style={styles.escrowNotice}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.badgeVerified} />
              <Text style={styles.escrowNoticeText}>
                Your funds remain safely locked in Escrow until you inspect the home and receive your keys.
              </Text>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.inputLabel}>Select Payment Method</Text>
            <View style={styles.paymentMethodRow}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  paymentMethod === 'mpesa' && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod('mpesa')}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={paymentMethod === 'mpesa' ? Colors.matteClay : Colors.deepCocoa} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'mpesa' && styles.paymentMethodTextActive]}>M-PESA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  paymentMethod === 'card' && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod('card')}
              >
                <Ionicons name="card-outline" size={20} color={paymentMethod === 'card' ? Colors.matteClay : Colors.deepCocoa} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'card' && styles.paymentMethodTextActive]}>Card / Bank</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'mpesa' && (
              <View style={{ marginTop: Spacing.sm }}>
                <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={mpesaNumber}
                  onChangeText={setMpesaNumber}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmRent}
              disabled={rentProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {rentProcessing ? 'Creating Request...' : 'Submit Rental Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONTACT MODAL */}
      <Modal visible={isContactModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Landlord</Text>
              <TouchableOpacity onPress={() => setIsContactModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <View style={styles.contactModalUser}>
              <Image
                source={{ uri: landlord.avatar_url || 'https://i.pravatar.cc/150?img=12' }}
                style={styles.contactAvatar}
              />
              <View style={{ marginLeft: Spacing.md }}>
                <Text style={styles.contactName}>{landlord.display_name}</Text>
                <Text style={styles.contactRole}>{landlord.phone}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: Colors.badgeSuccess, marginBottom: Spacing.sm }]}
              onPress={() => {
                setIsContactModalOpen(false);
                if (landlord.phone) Linking.openURL(`tel:${String(landlord.phone).replace(/\s/g, '')}`);
                else Alert.alert('Phone Unavailable', 'Use in-app messaging to contact this property host.');
              }}
            >
              <Ionicons name="call" size={18} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Call Landlord Directly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: Colors.matteClay }]}
              onPress={() => {
                setIsContactModalOpen(false);
                router.push(`/messages/${property.landlord_id}`);
              }}
            >
              <Ionicons name="chatbubble" size={18} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Send Message in App</Text>
            </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.softCream,
    zIndex: 10,
  },
  topBarTitle: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginHorizontal: Spacing.md,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  topRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.7,
    position: 'relative',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.7,
  },
  paginationBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.lg,
    backgroundColor: 'rgba(61, 35, 20, 0.75)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  paginationText: {
    color: Colors.white,
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
  },
  verifiedBadgePos: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.lg,
  },
  statusBadgePos: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.lg,
  },
  mainInfoSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyTitle: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    flex: 1,
    marginRight: Spacing.md,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  pricePeriod: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  locationRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmAlmond,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  reviewCountText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
  },
  specCard: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
  },
  specValue: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginTop: Spacing.xs,
  },
  specLabel: {
    fontSize: Typography.tiny,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
  },
  sectionHeading: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  readMoreBtn: {
    marginTop: Spacing.sm,
  },
  readMoreText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    marginBottom: Spacing.xs,
  },
  amenityIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.warmAlmond,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  amenityLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
  },
  mapCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    height: 160,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 35, 20, 0.85)',
    padding: Spacing.md,
  },
  mapPinContainer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -14,
  },
  mapLocationText: {
    color: Colors.white,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
  },
  mapSubtext: {
    color: Colors.warmAlmond,
    fontSize: Typography.caption,
    marginTop: 2,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  contactDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactName: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  contactRole: {
    fontSize: Typography.caption,
    color: Colors.matteClay,
    marginTop: 2,
  },
  contactBio: {
    fontSize: Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: Spacing.md,
    ...Shadows.bottomTab,
  },
  tourButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.deepCocoa,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
  },
  tourButtonText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  rentButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
  },
  rentButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  rentButtonText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  photoModalBg: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
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
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  modalSubtext: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  datePickerContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dateOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.softCream,
  },
  dateOptionActive: {
    borderColor: Colors.matteClay,
    backgroundColor: '#FAF5EF',
  },
  dateOptionText: {
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
  },
  dateOptionTextActive: {
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  textInput: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
    marginBottom: Spacing.lg,
  },
  confirmBtn: {
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
  },
  breakdownCard: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  breakdownTotalLabel: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  breakdownTotalValue: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  escrowNoticeText: {
    fontSize: Typography.caption,
    color: '#2E7D32',
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  paymentMethodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
    gap: Spacing.xs,
  },
  paymentMethodActive: {
    borderColor: Colors.matteClay,
    backgroundColor: '#FAF5EF',
  },
  paymentMethodText: {
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
  },
  paymentMethodTextActive: {
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  contactModalUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
});
