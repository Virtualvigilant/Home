import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs, PropertyListingCard } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { mockUsers } from '../../src/data/mockData';
import { usePropertyStore } from '../../src/store/propertyStore';
import { useRouter } from 'expo-router';

const TABS = ['Listed', 'Inquiries'];

export default function PortfolioScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  const { properties, addProperty } = usePropertyStore();

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [description, setDescription] = useState('');

  const tenant = mockUsers.find((u) => u.role === 'client');

  const landlordProperties = properties.filter(
    (p) => p.landlord_id === 'u3' || p.landlord_id === 'u4' || p.landlord_id === 'user_current'
  );

  const handlePropertyPress = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handleCreateProperty = async () => {
    if (!title.trim() || !location.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Please enter a property title, location, and monthly price.');
      return;
    }

    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 35000;

    const created = await addProperty({
      landlord_id: 'u3',
      hunter_id: null,
      title: title.trim(),
      description: description.trim() || 'Modern residential property available for rent.',
      price: priceNum,
      currency: 'KES',
      location: location.trim(),
      city: 'Nairobi',
      latitude: -1.286389,
      longitude: 36.817223,
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
      bedrooms: parseInt(bedrooms, 10) || 2,
      bathrooms: parseInt(bathrooms, 10) || 1,
      amenities: ['Security', 'Parking', 'Wi-Fi'],
      status: 'Available',
      is_verified: false,
      rating: 5.0,
      review_count: 1,
    });

    setIsAddModalOpen(false);
    // Reset form
    setTitle('');
    setLocation('');
    setPrice('');
    setDescription('');

    Alert.alert(
      'Property Listed!',
      `"${created.title}" is now published and available for house hunters and clients to view.`
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
                tenant={property.status === 'Rented' ? tenant : null}
                onPress={() => handlePropertyPress(property.id)}
                onManage={() => handlePropertyPress(property.id)}
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
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={Colors.deepCocoa} />
          <Text style={styles.addButtonText}>Add New Property</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD PROPERTY MODAL */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List New Property</Text>
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
                onPress={handleCreateProperty}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Publish Property Listing</Text>
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
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.bodySmall,
    color: Colors.deepCocoa,
    marginBottom: Spacing.sm,
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
