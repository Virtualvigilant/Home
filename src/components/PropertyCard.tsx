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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Badge } from './Badge';
import { Property } from '../lib/database.types';

const CARD_WIDTH = Dimensions.get('window').width * 0.44;

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  onWishlist?: () => void;
  isWishlisted?: boolean;
  showSavedBadge?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onWishlist,
  isWishlisted = false,
  showSavedBadge = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `KES ${price.toLocaleString()}`;
    }
    return `KES ${price}`;
  };

  const propertyImage = property.images && property.images.length > 0 && property.images[0]
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imgError ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' : propertyImage }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          onError={() => setImgError(true)}
        />
        {/* Verified Badge */}
        {property.is_verified && (
          <View style={styles.verifiedBadge}>
            <Badge label="Verified by Hunter" variant="verified" />
          </View>
        )}
        {/* Saved Badge */}
        {showSavedBadge && (
          <View style={styles.savedBadge}>
            <Badge label="Saved" variant="saved" />
          </View>
        )}
        {/* Heart Icon */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={onWishlist}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={22}
            color={isWishlisted ? Colors.matteClay : Colors.white}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.price}>
          {formatPrice(property.price)}/mo
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={Colors.deepCocoa} />
          <Text style={styles.rating}> {property.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  savedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 35, 20, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  price: {
    fontSize: Typography.caption,
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
});
