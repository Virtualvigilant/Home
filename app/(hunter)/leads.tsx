import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FilterTabs, LeadCard } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { usePropertyStore } from '../../src/store/propertyStore';
import { useHouseRequestStore } from '../../src/store/houseRequestStore';
import { useAuthStore } from '../../src/store/authStore';
import { getValidPropertyImages, DEFAULT_PROPERTY_IMAGE, uploadPickedImage } from '../../src/lib/imageUtils';
import { HouseRequest } from '../../src/lib/database.types';
import { useRouter } from 'expo-router';

const TABS = ['All Sourced Leads', 'Move-In Ready', 'Verified', 'Client Demands'];

export default function LeadsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const {
    hunterLeads,
    fetchProperties,
    verifyLead,
    addHunterLead,
    unlockPropertyAccess,
    toggleWishlist,
  } = usePropertyStore();

  const { requests, fetchHouseRequests } = useHouseRequestStore();
  const { user, completeKycVerification } = useAuthStore();

  useEffect(() => {
    fetchProperties().catch((error: any) =>
      Alert.alert('Data Error', error?.message || 'Unable to load your leads.')
    );
    fetchHouseRequests().catch(() => undefined);
  }, [fetchProperties, fetchHouseRequests]);

  // Modals state
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // KYC Form State
  const [docType, setDocType] = useState<'national_id' | 'passport' | 'alien_id'>('national_id');
  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Sourcing Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [bounty, setBounty] = useState('4000');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [description, setDescription] = useState('');
  const [scoutNotes, setScoutNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [geotagCoords, setGeotagCoords] = useState({ lat: -1.2892, lng: 36.7824 });

  const isKycVerified = user?.verification_status === true;

  // Handlers
  const handleLeadPress = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  const handleSourceForClient = (req: HouseRequest) => {
    setTitle(`Vacant ${req.bedrooms}-Bed in ${req.location}`);
    setLocation(req.location);
    setPrice(`${req.max_budget}`);
    setBounty('4000');
    setBedrooms(`${req.bedrooms}`);
    setBathrooms(`${req.bathrooms || 1}`);
    setDescription(`Targeted on-ground sourcing to fulfill client demand in ${req.location}.`);
    setScoutNotes(`Sourced specifically for client demand: ${req.client?.display_name || 'Client'} (${req.location})`);
    setIsSourceModalOpen(true);
  };

  const handleVerify = async (leadId: string, leadTitle: string) => {
    try {
      await verifyLead(leadId);
      Alert.alert('Lead Verified', `"${leadTitle}" has been physically verified.`);
    } catch (error: any) {
      Alert.alert('Verification Failed', error?.message || 'Unable to verify this lead.');
    }
  };

  const handleUnlockMoveIn = async (leadId: string, leadTitle: string) => {
    try {
      await unlockPropertyAccess(leadId);
      Alert.alert('Move-in Recorded', `Move-in was recorded for "${leadTitle}".`);
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Unable to update this lead.');
    }
  };

  const handlePickIdPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Allow access to photo library to select Government ID document.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIdPhoto(result.assets[0]);
    }
  };

  const handleSubmitKyc = async () => {
    if (!idNumber.trim() || !idPhoto || !user) {
      Alert.alert('Missing Information', 'Enter your ID number and select the matching document photo.');
      return;
    }
    try {
      const documentPath = await uploadPickedImage(idPhoto, 'kyc-documents', user.id);
      const result = await completeKycVerification(idNumber.trim(), docType, documentPath);
      if (!result.success) throw new Error(result.error);
      setIsKycModalOpen(false);
      setIdNumber('');
      setIdPhoto(null);
      Alert.alert('Verification Submitted', 'Your identity document was submitted for administrator review.');
    } catch (error: any) {
      Alert.alert('Submission Failed', error?.message || 'Unable to submit your verification document.');
    }
  };

  const handlePickSourceImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Allow access to select property photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (!user) return;
      try {
        const uploadedUrls = await Promise.all(
          result.assets.map((asset) => uploadPickedImage(asset, 'property-images', user.id))
        );
        setImagesList((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
      } catch (error: any) {
        Alert.alert('Image Upload Failed', error?.message || 'Unable to upload these photos.');
      }
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrl.trim() && !imagesList.includes(imageUrl.trim())) {
      setImagesList([...imagesList, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleSaveSourceLead = async () => {
    if (!title.trim() || !location.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Please enter title, location, and rent price.');
      return;
    }
    if (!user) {
      Alert.alert('Authentication Required', 'Sign in again to add a lead.');
      return;
    }
    const hunterId = user.id;
    const rentPrice = parseInt(price.replace(/[^0-9]/g, ''), 10) || 35000;
    const bountyAmount = parseInt(bounty.replace(/[^0-9]/g, ''), 10) || 4000;

    try {
      await addHunterLead({
      title: title.trim(),
      location: location.trim(),
      price: rentPrice,
      bedrooms: parseInt(bedrooms, 10) || 1,
      bathrooms: parseInt(bathrooms, 10) || 1,
      description: description.trim() || 'Off-market vacant apartment sourced on-ground.',
      images: imagesList.length > 0 ? imagesList : [DEFAULT_PROPERTY_IMAGE],
      bountyAmount,
      latitude: geotagCoords.lat,
      longitude: geotagCoords.lng,
      hunterId,
      notes: scoutNotes.trim() || 'Geotagged off-market lead.',
      });

    setIsSourceModalOpen(false);
    // Reset form
    setTitle('');
    setLocation('');
    setPrice('');
    setDescription('');
    setScoutNotes('');
    setImagesList([]);
    Alert.alert(
      'Off-Market Lead Added',
      `"${title.trim()}" is now registered for review.`
    );
    } catch (error: any) {
      Alert.alert('Lead Save Failed', error?.message || 'Unable to save this lead.');
    }
  };

  const filteredLeads = activeTab === 0
    ? hunterLeads
    : activeTab === 1
    ? hunterLeads.filter((l) => l.status === 'Booked')
    : hunterLeads.filter((l) => l.status === 'Verified' || l.status === 'Booked');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scout Dashboard</Text>
          <Text style={styles.subtitle}>On-Ground Property Sourcing & Verification</Text>
        </View>

        {/* 1. ONBOARDING & KYC BANNER */}
        <View style={[styles.kycCard, isKycVerified ? styles.kycCardVerified : styles.kycCardPending]}>
          <View style={styles.kycHeader}>
            <Ionicons
              name={isKycVerified ? 'shield-checkmark' : 'shield-outline'}
              size={24}
              color={isKycVerified ? Colors.badgeSuccess : Colors.matteClay}
            />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.kycTitle}>
                {isKycVerified ? 'KYC Verified Scout' : 'Identity Verification Pending'}
              </Text>
              <Text style={styles.kycSubtitle}>
                {isKycVerified
                  ? 'Government ID verified. Fully authorized to source off-market leads & earn bounties.'
                  : 'Upload your Government ID to complete KYC onboarding and claim instant payouts.'}
              </Text>
            </View>
          </View>
          {!isKycVerified && (
            <TouchableOpacity
              style={styles.kycBtn}
              onPress={() => setIsKycModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={16} color={Colors.white} />
              <Text style={styles.kycBtnText}>Complete KYC Verification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. SOURCING ACTION BUTTON */}
        <TouchableOpacity
          style={styles.sourceBtn}
          onPress={() => setIsSourceModalOpen(true)}
          activeOpacity={0.85}
        >
          <View style={styles.sourceIconBg}>
            <Ionicons name="location" size={24} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceBtnTitle}>+ Source Off-Market Apartment</Text>
            <Text style={styles.sourceBtnSub}>Upload geotagged photos of vacant homes & earn bounties</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.deepCocoa} />
        </TouchableOpacity>

        {/* Tabs */}
        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 3. CLIENT DEMANDS / ACQUISITION REQUESTS TAB */}
        {activeTab === 3 ? (
          <View style={styles.demandsContainer}>
            <View style={styles.scoutDemandBanner}>
              <Ionicons name="flash" size={22} color={Colors.matteClay} />
              <View style={{ flex: 1 }}>
                <Text style={styles.scoutDemandBannerTitle}>Live Client Housing Demands</Text>
                <Text style={styles.scoutDemandBannerSub}>
                  Clients broadcasting home requests in Nairobi. Tap "Source for Client" to auto-fill property details and claim your finder bounty!
                </Text>
              </View>
            </View>

            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No active client demands</Text>
                <Text style={styles.emptySubtitle}>
                  When clients post housing requests, they will appear here as high-priority sourcing opportunities.
                </Text>
              </View>
            ) : (
              requests.map((req) => (
                <View key={req.id} style={styles.scoutDemandCard}>
                  <View style={styles.demandCardHeader}>
                    <View style={styles.demandUserRow}>
                      <Image
                        source={{ uri: req.client?.avatar_url || 'https://i.pravatar.cc/150?img=12' }}
                        style={styles.demandAvatar}
                        contentFit="cover"
                      />
                      <View>
                        <Text style={styles.demandClientName}>{req.client?.display_name || 'Verified Client'}</Text>
                        <Text style={styles.demandLocationText}>{req.location}, {req.city}</Text>
                      </View>
                    </View>
                    <View style={styles.demandBudgetBadge}>
                      <Text style={styles.demandBudgetValue}>KES {req.max_budget.toLocaleString()}</Text>
                      <Text style={styles.demandBudgetSub}>Max Rent</Text>
                    </View>
                  </View>

                  <View style={styles.demandSpecsRow}>
                    <View style={styles.demandSpecChip}>
                      <Ionicons name="bed-outline" size={14} color={Colors.matteClay} />
                      <Text style={styles.demandSpecText}>{req.bedrooms} Bedroom(s)</Text>
                    </View>
                    <View style={styles.demandSpecChip}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.deepCocoa} />
                      <Text style={styles.demandSpecText}>Move-In: {req.move_in_date}</Text>
                    </View>
                  </View>

                  {req.description ? (
                    <Text style={styles.demandNotesText}>"{req.description}"</Text>
                  ) : null}

                  {req.amenities.length > 0 && (
                    <View style={styles.demandAmenitiesRow}>
                      {req.amenities.map((am, idx) => (
                        <View key={idx} style={styles.demandAmenityChip}>
                          <Text style={styles.demandAmenityText}>{am}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.demandCardActions}>
                    <TouchableOpacity
                      style={styles.chatClientDemandBtn}
                      onPress={() => router.push('/(client)/messages')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={Colors.deepCocoa} />
                      <Text style={styles.chatClientDemandText}>Chat Client</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sourceForClientBtn}
                      onPress={() => handleSourceForClient(req)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="flash" size={16} color={Colors.white} />
                      <Text style={styles.sourceForClientBtnText}>⚡ Source for Client</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* REGULAR LEADS LIST */
          <View style={styles.leadsList}>
            {filteredLeads.map((lead) => {
              const prop = lead.property;
              if (!prop) return null;

              return (
                <View key={lead.id} style={styles.leadCardContainer}>
                  {/* Geotag Badge Overlay */}
                  <View style={styles.geotagBadge}>
                    <Ionicons name="navigate" size={12} color={Colors.white} />
                    <Text style={styles.geotagText}>
                      Geotagged ({prop.latitude?.toFixed(4)}, {prop.longitude?.toFixed(4)})
                    </Text>
                  </View>

                  <LeadCard
                    lead={lead}
                    onPress={() => handleLeadPress(lead.property_id)}
                    onVerify={() => handleVerify(lead.id, prop.title)}
                    onWishlist={() => toggleWishlist(lead.property_id)}
                  />

                  {/* Hunter Action Bar for Move-In Coordination & Communication */}
                  <View style={styles.hunterActionBar}>
                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => router.push('/(client)/messages')}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.deepCocoa} />
                      <Text style={styles.actionBtnSecondaryText}>Chat Client</Text>
                    </TouchableOpacity>

                    {lead.status === 'Booked' ? (
                      <TouchableOpacity
                        style={styles.actionBtnSuccess}
                        onPress={() => handleUnlockMoveIn(lead.id, prop.title)}
                      >
                        <Ionicons name="key" size={16} color={Colors.white} />
                        <Text style={styles.actionBtnSuccessText}>Unlock Key & Confirm Move-In</Text>
                      </TouchableOpacity>
                    ) : lead.status === 'New' ? (
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleVerify(lead.id, prop.title)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                        <Text style={styles.actionBtnPrimaryText}>Verify On-Ground</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.verifiedTag}>
                        <Ionicons name="shield-checkmark" size={14} color={Colors.badgeVerified} />
                        <Text style={styles.verifiedTagText}>Physically Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {filteredLeads.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No leads in this view</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "Source Off-Market Apartment" to add new vacant listings and earn bounties!
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* KYC VERIFICATION MODAL */}
      <Modal visible={isKycModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Government ID KYC Verification</Text>
              <TouchableOpacity onPress={() => setIsKycModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Complete identity verification to get authorized as a scout and receive instant M-PESA bounty payouts.
            </Text>

            <Text style={styles.inputLabel}>Document Type</Text>
            <View style={styles.docTypeRow}>
              {[
                { id: 'national_id', label: 'National ID Card' },
                { id: 'passport', label: 'Passport' },
                { id: 'alien_id', label: 'Alien ID' },
              ].map((dt) => (
                <TouchableOpacity
                  key={dt.id}
                  style={[styles.docTypeChip, docType === dt.id && styles.docTypeChipActive]}
                  onPress={() => setDocType(dt.id as any)}
                >
                  <Text style={[styles.docTypeChipText, docType === dt.id && styles.docTypeChipTextActive]}>
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Government Document / ID Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 34567890"
              placeholderTextColor={Colors.textTertiary}
              value={idNumber}
              onChangeText={setIdNumber}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Upload ID Document Photo</Text>
            <TouchableOpacity style={styles.uploadIdBox} onPress={handlePickIdPhoto}>
              {idPhoto ? (
                <Image source={{ uri: idPhoto.uri }} style={styles.idPhotoPreview} contentFit="cover" />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="cloud-upload-outline" size={32} color={Colors.matteClay} />
                  <Text style={styles.uploadIdText}>Tap to select Government ID front photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmitKyc} activeOpacity={0.8}>
              <Text style={styles.confirmBtnText}>Submit Identity Verification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SOURCING OFF-MARKET PROPERTY MODAL */}
      <Modal visible={isSourceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Source Off-Market Apartment</Text>
              <TouchableOpacity onPress={() => setIsSourceModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Geotag Indicator Banner */}
              <View style={styles.geotagInfoBanner}>
                <Ionicons name="location-sharp" size={18} color={Colors.badgeVerified} />
                <Text style={styles.geotagInfoText}>
                  GPS Location Tagged: ({geotagCoords.lat}, {geotagCoords.lng}) • Nairobi, KE
                </Text>
              </View>

              <Text style={styles.inputLabel}>Property / Building Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Vacant 2-Bed at Sunshine Heights"
                placeholderTextColor={Colors.textTertiary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Neighborhood / Location</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kilimani, Nairobi"
                placeholderTextColor={Colors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Monthly Rent (KES)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 45000"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="number-pad"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Finder's Bounty (KES)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 4000"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="number-pad"
                    value={bounty}
                    onChangeText={setBounty}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Bedrooms</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bedrooms}
                    onChangeText={setBedrooms}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Bathrooms</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bathrooms}
                    onChangeText={setBathrooms}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Geotagged On-Ground Photos</Text>
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity style={styles.pickFileBtn} onPress={handlePickSourceImage}>
                  <Ionicons name="images-outline" size={18} color={Colors.white} />
                  <Text style={styles.pickFileBtnText}>Upload Geotagged Photos</Text>
                </TouchableOpacity>
              </View>

              {imagesList.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: Spacing.xs }}>
                  {imagesList.map((uri, idx) => (
                    <View key={idx} style={styles.thumbWrap}>
                      <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.inputLabel}>Scout Notes & Verification Details</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Mention caretaker/landlord details, vacant unit status, move-in readiness..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={scoutNotes}
                onChangeText={setScoutNotes}
              />

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveSourceLead} activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>Save & Register Off-Market Listing</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xs },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  kycCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  kycCardPending: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D' },
  kycCardVerified: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7' },
  kycHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  kycTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  kycSubtitle: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  kycBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  kycBtnText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.matteClay,
    ...Shadows.card,
  },
  sourceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.matteClay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sourceBtnTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  sourceBtnSub: { fontSize: Typography.tiny, color: Colors.textSecondary, marginTop: 2 },
  leadsList: { marginTop: Spacing.sm },
  leadCardContainer: { position: 'relative', marginBottom: Spacing.xs },
  geotagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(61, 35, 20, 0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    position: 'absolute',
    top: 6,
    right: Spacing.xl,
    zIndex: 10,
  },
  geotagText: { color: Colors.white, fontSize: 10, fontWeight: Typography.medium },
  hunterActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  actionBtnSecondaryText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.matteClay,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  actionBtnPrimaryText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.white },
  actionBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.badgeSuccess,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  actionBtnSuccessText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.white },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedTagText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.badgeVerified },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.huge, paddingHorizontal: Spacing.xxxl },
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.md },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  modalSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  inputLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  textInput: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginBottom: Spacing.xs },
  docTypeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  docTypeChip: { backgroundColor: Colors.softCream, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.pill },
  docTypeChipActive: { backgroundColor: Colors.matteClay, borderColor: Colors.matteClay },
  docTypeChipText: { fontSize: Typography.caption, color: Colors.deepCocoa },
  docTypeChipTextActive: { color: Colors.white, fontWeight: Typography.semiBold },
  uploadIdBox: { backgroundColor: Colors.softCream, borderWidth: 1.5, borderColor: Colors.divider, borderStyle: 'dashed', borderRadius: BorderRadius.md, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  uploadIdText: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  idPhotoPreview: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  geotagInfoBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  geotagInfoText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, color: Colors.badgeVerified },
  pickerButtonsRow: { marginBottom: Spacing.xs },
  pickFileBtn: { backgroundColor: Colors.matteClay, padding: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  pickFileBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.caption },
  thumbWrap: { width: 60, height: 60, marginRight: Spacing.xs, borderRadius: BorderRadius.md, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  confirmBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.md },
  confirmBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },

  // Client Demands Tab Styles
  demandsContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  scoutDemandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#F5EDE4',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.matteClay,
  },
  scoutDemandBannerTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  scoutDemandBannerSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  scoutDemandCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  demandCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  demandUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  demandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  demandClientName: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  demandLocationText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  demandBudgetBadge: {
    alignItems: 'flex-end',
  },
  demandBudgetValue: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.matteClay,
  },
  demandBudgetSub: {
    fontSize: Typography.tiny,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  demandSpecsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  demandSpecChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.softCream,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  demandSpecText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  demandNotesText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  demandAmenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: Spacing.xs,
  },
  demandAmenityChip: {
    backgroundColor: '#F5EDE4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  demandAmenityText: {
    fontSize: 10,
    color: Colors.matteClay,
    fontWeight: Typography.semiBold,
  },
  demandCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  chatClientDemandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.softCream,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    flex: 1,
  },
  chatClientDemandText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  sourceForClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.matteClay,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    flex: 1.3,
  },
  sourceForClientBtnText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
});

