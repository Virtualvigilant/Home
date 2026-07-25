import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, FilterTabs, ProductCard, SectionHeader } from '../../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { mockProducts } from '../../../src/data/mockData';
import { Product } from '../../../src/lib/database.types';
import { useRouter } from 'expo-router';

const TABS = ['Homes', 'Marketplace', 'Services'];

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = useState(1);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrdered, setIsOrdered] = useState(false);
  const router = useRouter();

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index === 0) {
      router.push('/(client)/(explore)/homes');
    } else if (index === 2) {
      router.push('/(client)/(explore)/services');
    }
  };

  const toggleWishlist = (id: string) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleOrderProduct = () => {
    setIsOrdered(true);
    setTimeout(() => {
      setIsOrdered(false);
      const prodName = selectedProduct?.name;
      setSelectedProduct(null);
      Alert.alert(
        'Order Placed!',
        `Your order for "${prodName}" has been received. The retailer will coordinate delivery to your home.`
      );
    }, 800);
  };

  const filteredProducts = searchQuery
    ? mockProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockProducts;

  const featured = filteredProducts.filter((p) => p.is_featured);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <SearchBar
          placeholder="Search furniture & bundles"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        <SectionHeader title="Featured Items" onSeeAll={() => {}} />
        <View style={styles.grid}>
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => setSelectedProduct(product)}
              onWishlist={() => toggleWishlist(product.id)}
              isWishlisted={wishlisted.has(product.id)}
            />
          ))}
        </View>

        <SectionHeader title="All Furniture" onSeeAll={() => {}} />
        <View style={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => setSelectedProduct(product)}
              onWishlist={() => toggleWishlist(product.id)}
              isWishlisted={wishlisted.has(product.id)}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PRODUCT DETAIL MODAL */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <Ionicons name="close" size={24} color={Colors.deepCocoa} />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedProduct.images[0] }}
                  style={styles.productModalImage}
                  contentFit="cover"
                />

                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>
                    KES {selectedProduct.price.toLocaleString()}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{selectedProduct.category}</Text>
                  </View>
                </View>

                <Text style={styles.descriptionHeading}>Product Details</Text>
                <Text style={styles.descriptionText}>{selectedProduct.description}</Text>

                <View style={styles.stockRow}>
                  <Ionicons name="cube-outline" size={18} color={Colors.badgeVerified} />
                  <Text style={styles.stockText}>
                    In Stock ({selectedProduct.stock_count} units available)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.orderBtn}
                  onPress={handleOrderProduct}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.orderBtnText}>
                    {isOrdered ? 'Processing Order...' : 'Buy Now with Escrow'}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
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
  productModalImage: {
    width: '100%',
    height: 200,
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
  categoryBadge: {
    backgroundColor: Colors.warmAlmond,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  categoryBadgeText: {
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
  descriptionText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stockText: {
    fontSize: Typography.caption,
    color: Colors.badgeVerified,
    marginLeft: 6,
    fontWeight: Typography.medium,
  },
  orderBtn: {
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  orderBtnText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
  },
});
