import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs, ProductCard, SectionHeader } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { mockProducts } from '../../src/data/mockData';
import { Product } from '../../src/lib/database.types';

const TABS = ['Featured', 'Categories'];

export default function CatalogScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [productsList, setProductsList] = useState<Product[]>(mockProducts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Living Room');
  const [description, setDescription] = useState('');

  const featured = productsList.filter((p) => p.is_featured);

  const handleAddProduct = () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Missing Info', 'Please enter a product name and price.');
      return;
    }

    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 20000;

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      retailer_id: 'u5',
      name: name.trim(),
      description: description.trim() || 'Quality furniture crafted locally.',
      price: priceNum,
      currency: 'KES',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
      category: category,
      stock_count: 10,
      is_featured: true,
      rating: 5.0,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };

    setProductsList([newProd, ...productsList]);
    setIsAddModalOpen(false);
    setName('');
    setPrice('');
    setDescription('');

    Alert.alert('Product Added!', `"${newProd.name}" is now listed in your showroom.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Showroom</Text>
        </View>

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 0 && (
          <>
            <SectionHeader title="Featured Products" />
            <View style={styles.grid}>
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToBundle={true}
                />
              ))}
            </View>

            <SectionHeader title="All Products" />
            <View style={styles.grid}>
              {productsList.map((product) => (
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
              const items = productsList.filter((p) => p.category === cat);
              if (items.length === 0) return null;
              return (
                <View key={cat}>
                  <SectionHeader title={cat} onSeeAll={() => {}} />
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

        {/* Add Product Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalOpen(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={Colors.deepCocoa} />
          <Text style={styles.addButtonText}>Add New Product</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD PRODUCT MODAL */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product to Showroom</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Mahogony 6-Seater Dining Set"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Price (KES)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 45000"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              value={price}
              onChangeText={setPrice}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {['Bedroom', 'Living Room', 'Dining', 'Kitchen', 'Office'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.catOption,
                    category === c && styles.catOptionActive,
                  ]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catOptionText, category === c && styles.catOptionTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Product dimensions, material, finish..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleAddProduct}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Add Product to Showroom</Text>
            </TouchableOpacity>
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
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.deepCocoa,
    borderStyle: 'dashed', borderRadius: BorderRadius.lg, marginHorizontal: Spacing.lg,
    marginTop: Spacing.md, paddingVertical: Spacing.lg,
  },
  addButtonText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  catOption: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  catOptionActive: {
    backgroundColor: Colors.matteClay,
    borderColor: Colors.matteClay,
  },
  catOptionText: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
  },
  catOptionTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
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
