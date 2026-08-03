import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getSinglePropertyImage, DEFAULT_PROPERTY_IMAGE } from '../lib/imageUtils';
import { Property, Profile } from '../lib/database.types';

interface PropertyListingCardProps {
  property: Property;
  tenant?: Profile | null;
  onManage?: () => void;
  onPress?: () => void;
}

export const PropertyListingCard: React.FC<PropertyListingCardProps> = ({
  property,
  tenant,
  onManage,
  onPress,
}) => {
  const [imgError, setImgError] = useState(false);
  const isRented = property?.status === 'Rented';
  const statusText = isRented
    ? `(Active Tenant)`
    : `(Vacant)`;

  const propertyImage = getSinglePropertyImage(property?.images);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <Image
          source={{ uri: imgError ? DEFAULT_PROPERTY_IMAGE : propertyImage }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          onError={() => setImgError(true)}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title} {statusText}
          </Text>
          {isRented && tenant && (
            <View style={styles.tenantRow}>
              <Ionicons name="person-circle-outline" size={16} color={Colors.textTertiary} />
              <Text style={styles.tenantName}> Tenant @{tenant.display_name.split(' ')[0].toLowerCase()}...</Text>
            </View>
          )}
          <Text style={styles.price}>
            KES {property.price.toLocaleString()}/mo
          </Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={onManage}
            activeOpacity={0.7}
          >
            <Text style={styles.manageButtonText}>Manage Listing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    ...Shadows.card,
  },
  content: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tenantName: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },
  price: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.deepCocoa,
    marginTop: 4,
  },
  manageButton: {
    borderWidth: 1.5,
    borderColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  manageButtonText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.matteClay,
  },
});
