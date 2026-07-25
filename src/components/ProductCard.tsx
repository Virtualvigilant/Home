import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { Product } from '../lib/database.types';

const CARD_WIDTH = (Dimensions.get('window').width - Spacing.lg * 2 - Spacing.md) / 2;

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToBundle?: () => void;
  onWishlist?: () => void;
  isWishlisted?: boolean;
  showAddToBundle?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToBundle,
  onWishlist,
  isWishlisted = false,
  showAddToBundle = false,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imgError ? 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800' : product.images[0] }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          onError={() => setImgError(true)}
        />
        <TouchableOpacity
          style={styles.heartButton}
          onPress={onWishlist}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? Colors.matteClay : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>KES {product.price.toLocaleString()}</Text>
        {product.rating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={Colors.deepCocoa} />
            <Text style={styles.rating}> {product.rating}</Text>
          </View>
        )}
        {showAddToBundle && (
          <TouchableOpacity
            style={styles.bundleButton}
            onPress={onAddToBundle}
            activeOpacity={0.7}
          >
            <Text style={styles.bundleButtonText}>Add to Bundle</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  info: {
    paddingTop: Spacing.sm,
  },
  name: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.medium,
    color: Colors.deepCocoa,
  },
  price: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    fontSize: Typography.caption,
    color: Colors.deepCocoa,
    fontWeight: Typography.medium,
  },
  bundleButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  bundleButtonText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
