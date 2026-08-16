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
import { Product } from '../../../src/lib/database.types';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/store/authStore';
import { useRouter } from 'expo-router';

const TABS = ['Homes', 'Marketplace', 'Services'];

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = useState(1);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrdered, setIsOrdered] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index === 0) {
      router.push('/(client)/(explore)/homes');
    } else if (index === 2) {
      router.push('/(client)/(explore)/services');
    }
  };

  const toggleWishlist = async (id: string) => {
    if (!user) return;
    const exists = wishlisted.has(id);
    const query = exists
      ? supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', id)
      : supabase.from('wishlists').insert({ user_id: user.id, product_id: id });
    const { error } = await query;
    if (error) {
      Alert.alert('Wishlist Error', error.message);
      return;
    }
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (exists) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleOrderProduct = async () => {
    if (!selectedProduct || !user || isOrdered) return;
    setIsOrdered(true);
    const { error } = await supabase.from('bookings').insert({
      client_id: user.id,
      property_id: null,
      product_id: selectedProduct.id,
      service_id: null,
      move_in_date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      total_amount: selectedProduct.price,
      currency: selectedProduct.currency || 'KES',
      notes: 'Marketplace order awaiting retailer confirmation',
    });
    if (error) {
      setIsOrdered(false);
      Alert.alert('Order Failed', error.message || 'Unable to place this order.');
      return;
    }
    const prodName = selectedProduct.name;
    setIsOrdered(false);
    setSelectedProduct(null);
    Alert.alert('Order Placed', `Your order for "${prodName}" was sent to the retailer for confirmation.`);
  };

  const [products, setProducts] = useState<Product[]>([]);

  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data as Product[]);
      } catch (e) {}
    };
    loadProducts();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    supabase.from('wishlists').select('product_id').eq('user_id', user.id).not('product_id', 'is', null)
      .then(({ data }) => setWishlisted(new Set((data || []).map((item) => item.product_id).filter(Boolean))));
  }, [user]);

  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

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

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptySubtitle}>
              There are currently no items in the marketplace. Retailers can list products to display them here!
            </Text>
          </View>
        ) : (
          <>
            {featured.length > 0 && (
              <>
                <SectionHeader title="Featured Items" />
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
              </>
            )}

            <SectionHeader title="All Furniture" />
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
          </>
        )}

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
                  disabled={isOrdered || selectedProduct.stock_count < 1}
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
});
