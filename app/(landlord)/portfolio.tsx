import React, { useState, useEffect } from 'react';
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
import { getValidPropertyImages, DEFAULT_PROPERTY_IMAGE, uploadPickedImage } from '../../src/lib/imageUtils';
import { FilterTabs, PropertyListingCard } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { usePropertyStore } from '../../src/store/propertyStore';
import { useAuthStore } from '../../src/store/authStore';
import { Property } from '../../src/lib/database.types';
import { useRouter } from 'expo-router';

const TABS = ['Listed', 'Inquiries'];

interface AmenityOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRESET_AMENITIES: AmenityOption[] = [
  { id: 'security', name: '24/7 Security & CCTV', icon: 'shield-checkmark-outline' },
  { id: 'parking', name: 'Dedicated Parking', icon: 'car-outline' },
  { id: 'wifi', name: 'High-Speed Wi-Fi', icon: 'wifi-outline' },
  { id: 'water', name: 'Borehole / 24/7 Water', icon: 'water-outline' },
  { id: 'generator', name: 'Backup Generator', icon: 'flash-outline' },
  { id: 'balcony', name: 'Private Balcony', icon: 'home-outline' },
  { id: 'gym', name: 'Fitness Gym', icon: 'fitness-outline' },
  { id: 'pool', name: 'Swimming Pool', icon: 'water-sharp' },
  { id: 'elevator', name: 'Elevator / Lift', icon: 'swap-vertical-outline' },
  { id: 'dsq', name: 'DSQ (Staff Qtrs)', icon: 'bed-outline' },
  { id: 'tv', name: 'Cable TV / DSTV Ready', icon: 'tv-outline' },
  { id: 'laundry', name: 'Laundry Area', icon: 'shirt-outline' },
  { id: 'fence', name: 'Electric Fence', icon: 'lock-closed-outline' },
  { id: 'kids', name: 'Children Play Area', icon: 'happy-outline' },
  { id: 'garden', name: 'Lawn / Garden', icon: 'leaf-outline' },
  { id: 'garbage', name: 'Garbage Collection', icon: 'trash-outline' },
];

export default function PortfolioScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const router = useRouter();

  const { properties, addProperty, updateProperty, deleteProperty, fetchProperties } = usePropertyStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProperties();
  }, []);

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [status, setStatus] = useState<Property['status']>('Available');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24/7 Security & CCTV',
    'Dedicated Parking',
    'High-Speed Wi-Fi',
    'Borehole / 24/7 Water',
  ]);

  const handleOpenAddModal = () => {
    setEditingPropertyId(null);
    setTitle('');
    setLocation('');
    setPrice('');
    setBedrooms('2');
    setBathrooms('1');
    setDescription('');
    setImageUrl('');
    setImagesList([]);
    setStatus('Available');
    setSelectedAmenities([
      '24/7 Security & CCTV',
      'Dedicated Parking',
      'High-Speed Wi-Fi',
      'Borehole / 24/7 Water',
    ]);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prop: any) => {
    setEditingPropertyId(prop.id);
    setTitle(prop.title || '');
    setLocation(prop.location || '');
    setPrice(prop.price ? prop.price.toString() : '');
    setBedrooms(prop.bedrooms ? prop.bedrooms.toString() : '1');
    setBathrooms(prop.bathrooms ? prop.bathrooms.toString() : '1');
    setDescription(prop.description || '');
    setImageUrl('');
    setImagesList(getValidPropertyImages(prop.images));
    setSelectedAmenities(prop.amenities || []);
    setStatus(prop.status || 'Available');
    setIsAddModalOpen(true);
  };

  const handleAddImage = (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || imageUrl).trim();
    if (!targetUrl) return;
    if (!imagesList.includes(targetUrl)) {
      setImagesList([...imagesList, targetUrl]);
    }
    setImageUrl('');
  };

  const landlordProperties = user?.id
    ? properties.filter((p) => p.landlord_id === user.id)
    : properties;

  const handlePropertyPress = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handlePickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your device photo gallery to select property photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (!user) return;
      try {
        const uploadedUrls = await Promise.all(
          result.assets.map((asset) => uploadPickedImage(asset, 'property-images', user.id))
        );
        setImagesList(Array.from(new Set([...imagesList, ...uploadedUrls])));
      } catch (error: any) {
        Alert.alert('Image Upload Failed', error?.message || 'Unable to upload the selected photos.');
      }
    }
  };

  const handleTakePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your camera to take property photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (!user) return;
      try {
        const uploadedUrl = await uploadPickedImage(result.assets[0], 'property-images', user.id);
        if (!imagesList.includes(uploadedUrl)) setImagesList([...imagesList, uploadedUrl]);
      } catch (error: any) {
        Alert.alert('Image Upload Failed', error?.message || 'Unable to upload this photo.');
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesList(imagesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleToggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleSaveProperty = async () => {
    if (!title.trim() || !location.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Please enter a property title, location, and monthly price.');
      return;
    }

    const landlordId = user?.id;
    if (!landlordId) {
      Alert.alert('Authentication Required', 'Please sign in to your landlord account to save properties.');
      return;
    }

    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 35000;
    const finalImages = getValidPropertyImages(imagesList);
    const finalAmenities = selectedAmenities.length > 0
      ? selectedAmenities
      : ['24/7 Security & CCTV', 'Dedicated Parking'];

    try {
      if (editingPropertyId) {
        // Edit existing listing
        await updateProperty(editingPropertyId, {
          title: title.trim(),
          location: location.trim(),
          price: priceNum,
          bedrooms: parseInt(bedrooms, 10) || 1,
          bathrooms: parseInt(bathrooms, 10) || 1,
          description: description.trim() || 'Modern residential property available for rent.',
          images: finalImages,
          amenities: finalAmenities,
          status,
        });

        setIsAddModalOpen(false);
        Alert.alert(
          'Listing Updated!',
          `"${title.trim()}" has been updated successfully.`
        );
      } else {
        // Create new listing
        const created = await addProperty({
          landlord_id: landlordId,
          hunter_id: null,
          title: title.trim(),
          description: description.trim() || 'Modern residential property available for rent.',
          price: priceNum,
          currency: 'KES',
          location: location.trim(),
          city: 'Nairobi',
          latitude: -1.286389,
          longitude: 36.817223,
          images: finalImages,
          bedrooms: parseInt(bedrooms, 10) || 2,
          bathrooms: parseInt(bathrooms, 10) || 1,
          amenities: finalAmenities,
          status,
          is_verified: false,
          rating: 5.0,
          review_count: 1,
        });

        setIsAddModalOpen(false);
        Alert.alert(
          'Property Listed!',
          `"${created.title}" has been published for clients to view.`
        );
      }
    } catch (err: any) {
      Alert.alert('Listing Save Failed', err?.message || 'Unable to save this listing.');
    }
  };

  const handleDeleteProperty = () => {
    if (!editingPropertyId) return;
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProperty(editingPropertyId);
              setIsAddModalOpen(false);
              Alert.alert('Listing Deleted', 'The property listing has been permanently removed.');
            } catch (error: any) {
              Alert.alert('Delete Failed', error?.message || 'Unable to delete this listing.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Properties</Text>
        </View>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 0 && (
          <View style={styles.listings}>
            {landlordProperties.map((property) => (
              <PropertyListingCard
                key={property.id}
                property={property}
                tenant={null}
                onPress={() => handlePropertyPress(property.id)}
                onManage={() => handleOpenEditModal(property)}
              />
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No inquiries yet</Text>
            <Text style={styles.emptySubtitle}>
              When clients inquire about your properties, they'll appear here.
            </Text>
          </View>
        )}

        {/* Add New Property Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAddModal}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={Colors.deepCocoa} />
          <Text style={styles.addButtonText}>Add New Property</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD / EDIT PROPERTY MODAL */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPropertyId ? 'Edit Property Listing' : 'List New Property'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Property Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2-Bed Luxury Apt in Westlands"
                placeholderTextColor={Colors.textTertiary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Location / Neighborhood</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Westlands, Nairobi"
                placeholderTextColor={Colors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.inputLabel}>Monthly Rent (KES)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 45000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.inputLabel}>Listing Status</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm }}>
                {(['Available', 'Pending_Escrow', 'Rented'] as const).map((st) => {
                  const isSel = status === st;
                  const label = st === 'Available' ? 'Available' : st === 'Pending_Escrow' ? 'Pending Escrow' : 'Rented';
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.amenityChip, isSel && styles.amenityChipSelected]}
                      onPress={() => setStatus(st)}
                    >
                      <Text style={[styles.amenityChipText, isSel && styles.amenityChipTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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

              {/* PROPERTY PHOTOS SECTION */}
              <Text style={styles.inputLabel}>Property Photos</Text>
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.pickFileBtn}
                  onPress={handlePickImageFromGallery}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={20} color={Colors.white} />
                  <Text style={styles.pickFileBtnText}>Upload from Device</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleTakePhotoWithCamera}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={20} color={Colors.deepCocoa} />
                </TouchableOpacity>
              </View>

              {/* Or Paste Image URL */}
              <View style={styles.imageInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Or paste photo URL..."
                  placeholderTextColor={Colors.textTertiary}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />
                <TouchableOpacity
                  style={styles.addImageUrlBtn}
                  onPress={() => handleAddImage()}
                >
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={styles.addImageUrlBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Selected Image Thumbnails */}
              {imagesList.length > 0 ? (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewCount}>{imagesList.length} photo(s) attached:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                    {imagesList.map((url, idx) => (
                      <View key={idx} style={styles.thumbnailWrapper}>
                        <Image source={{ uri: url }} style={styles.thumbnail} contentFit="cover" />
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => handleRemoveImage(idx)}
                        >
                          <Ionicons name="close-circle" size={22} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.noImagesHint}>Tap "Upload from Device" or paste a photo URL to attach listing images.</Text>
              )}

              {/* PRESET AMENITIES SELECTION GRID */}
              <Text style={styles.inputLabel}>Select Included Amenities & Facilities</Text>
              <Text style={styles.amenityHint}>Tap icons below to select all amenities present in this property:</Text>
              <View style={styles.amenitiesGrid}>
                {PRESET_AMENITIES.map((item) => {
                  const isSelected = selectedAmenities.includes(item.name);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.amenityChip, isSelected && styles.amenityChipSelected]}
                      onPress={() => handleToggleAmenity(item.name)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? Colors.white : Colors.deepCocoa}
                      />
                      <Text style={[styles.amenityChipText, isSelected && styles.amenityChipTextSelected]}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={Colors.white} style={{ marginLeft: 2 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Describe key features, amenities, and lease conditions..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveProperty}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>
                  {editingPropertyId ? 'Save Listing Changes' : 'Publish Property Listing'}
                </Text>
              </TouchableOpacity>

              {editingPropertyId && (
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: Colors.error, marginTop: -Spacing.xs }]}
                  onPress={handleDeleteProperty}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnText}>Delete Listing</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  listings: { marginTop: Spacing.lg },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.deepCocoa,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  addButtonText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.huge, paddingHorizontal: Spacing.xxxl },
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginTop: Spacing.md },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm },
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
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  amenityHint: {
    fontSize: Typography.tiny,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
    marginBottom: Spacing.sm,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  imageInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addImageUrlBtn: {
    backgroundColor: Colors.deepCocoa,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addImageUrlBtnText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.caption,
  },
  pickFileBtn: {
    flex: 1,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  pickFileBtnText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.bodySmall,
  },
  cameraBtn: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  noImagesHint: {
    fontSize: Typography.tiny,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  previewContainer: {
    marginVertical: Spacing.xs,
  },
  previewCount: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    color: Colors.matteClay,
    marginBottom: Spacing.xs,
  },
  previewScroll: {
    marginBottom: Spacing.sm,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  thumbnail: {
    width: 75,
    height: 75,
    borderRadius: BorderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 11,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginBottom: 4,
  },
  amenityChipSelected: {
    backgroundColor: Colors.matteClay,
    borderColor: Colors.matteClay,
  },
  amenityChipText: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: Colors.deepCocoa,
  },
  amenityChipTextSelected: {
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
  confirmBtn: {
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
  },
});
