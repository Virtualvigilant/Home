import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
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
import { FilterTabs, ProductCard, SectionHeader } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useRetailerStore } from '../../src/store/retailerStore';
import { getValidPropertyImages, DEFAULT_PRODUCT_IMAGE, uploadPickedImage } from '../../src/lib/imageUtils';
import { useAuthStore } from '../../src/store/authStore';

const TABS = ['Showroom Inventory', 'Categories'];

export default function CatalogScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { products, addProduct, fetchProducts } = useRetailerStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchProducts().catch((error) =>
      Alert.alert('Catalog Error', error?.message || 'Unable to load your products.')
    );
  }, [fetchProducts]);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Living Room');
  const [stockCount, setStockCount] = useState('10');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);

  const handlePickProductImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Allow access to device photos to select product image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (!user) return;
      try {
        const uploadedUrl = await uploadPickedImage(result.assets[0], 'product-images', user.id);
        setImagesList((prev) => Array.from(new Set([...prev, uploadedUrl])));
      } catch (error: any) {
        Alert.alert('Image Upload Failed', error?.message || 'Unable to upload this image.');
      }
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrl.trim() && !imagesList.includes(imageUrl.trim())) {
      setImagesList([...imagesList, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Missing Info', 'Please enter product name and price.');
      return;
    }

    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 25000;
    const finalImages = imagesList.length > 0 ? imagesList : [DEFAULT_PRODUCT_IMAGE];

    try {
      const product = await addProduct({
        retailer_id: '',
        name: name.trim(),
        description: description.trim() || 'High-quality furniture handcrafted locally.',
        price: priceNum,
        currency: 'KES',
        images: finalImages,
        category,
        stock_count: parseInt(stockCount, 10) || 10,
        is_featured: false,
        rating: 0,
      });

      setIsAddModalOpen(false);
      setName('');
      setPrice('');
      setDescription('');
      setImagesList([]);
      Alert.alert('Product Published', `"${product.name}" is now live in your catalog.`);
    } catch (error: any) {
      Alert.alert('Product Save Failed', error?.message || 'Unable to publish this product.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Showroom & Inventory</Text>
          <Text style={styles.subtitle}>Onboard catalog items for client move-in packages</Text>
        </View>

        {/* Add Product Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Onboard New Furniture Item</Text>
        </TouchableOpacity>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 0 && (
          <>
            <SectionHeader title="Live Showroom Inventory" />
            <View style={styles.grid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToBundle={true}
                />
              ))}
            </View>
          </>
        )}

        {activeTab === 1 && (
          <>
            {['Bedroom', 'Living Room', 'Dining', 'Kitchen', 'Office'].map((cat) => {
              const items = products.filter((p) => p.category === cat);
              if (items.length === 0) return null;
              return (
                <View key={cat}>
                  <SectionHeader title={cat} />
                  <View style={styles.grid}>
                    {items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        showAddToBundle={true}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ONBOARD PRODUCT MODAL */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Onboard Inventory Item</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mahogany 6-Seater Dining Table"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price (KES)</Text>
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
                  <Text style={styles.inputLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={stockCount}
                    onChangeText={setStockCount}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {['Bedroom', 'Living Room', 'Dining', 'Kitchen', 'Office'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catOption, category === c && styles.catOptionActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.catOptionText, category === c && styles.catOptionTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Product Images</Text>
              <TouchableOpacity style={styles.pickImgBtn} onPress={handlePickProductImage}>
                <Ionicons name="images-outline" size={18} color={Colors.white} />
                <Text style={styles.pickImgBtnText}>Upload Photo from Device</Text>
              </TouchableOpacity>

              <View style={styles.urlInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Or paste photo URL..."
                  placeholderTextColor={Colors.textTertiary}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />
                <TouchableOpacity style={styles.addUrlBtn} onPress={handleAddImageUrl}>
                  <Text style={{ color: Colors.white, fontWeight: Typography.bold }}>Add</Text>
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

              <Text style={styles.inputLabel}>Description & Materials</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Product dimensions, material finish, warranty..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveProduct} activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>Onboard Item to Catalog</Text>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },
  addButtonText: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  inputLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginBottom: Spacing.xs, marginTop: Spacing.xs },
  textInput: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginBottom: Spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  catOption: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.pill, backgroundColor: Colors.softCream, borderWidth: 1, borderColor: Colors.divider },
  catOptionActive: { backgroundColor: Colors.matteClay, borderColor: Colors.matteClay },
  catOptionText: { fontSize: Typography.caption, color: Colors.deepCocoa },
  catOptionTextActive: { color: Colors.white, fontWeight: Typography.bold },
  pickImgBtn: { backgroundColor: Colors.matteClay, padding: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  pickImgBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.caption },
  urlInputRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', marginBottom: Spacing.sm },
  addUrlBtn: { backgroundColor: Colors.deepCocoa, height: 48, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  thumbWrap: { width: 60, height: 60, marginRight: Spacing.xs, borderRadius: BorderRadius.md, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  confirmBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
  confirmBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },
});
