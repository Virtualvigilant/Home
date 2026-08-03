import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Badge } from './Badge';
import { getSinglePropertyImage, DEFAULT_PROPERTY_IMAGE } from '../lib/imageUtils';
import { HunterLead } from '../lib/database.types';

interface LeadCardProps {
  lead: HunterLead;
  onVerify?: () => void;
  onPress?: () => void;
  onWishlist?: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onVerify,
  onPress,
  onWishlist,
}) => {
  const [imgError, setImgError] = useState(false);
  const property = lead.property;
  if (!property) return null;

  const statusBadgeVariant = lead.status === 'New' ? 'new' : lead.status === 'Booked' ? 'success' : 'verified';
  const statusLabel = lead.status === 'New' ? 'New' : lead.status === 'Booked' ? 'Success' : 'Verified';
  const suffixText = lead.status === 'New' ? '(Sourced)' : lead.status === 'Booked' ? '(Booked)' : '(Verified)';

  const leadImage = getSinglePropertyImage(property?.images);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.statusBadgeWrap}>
        <Badge label={statusLabel} variant={statusBadgeVariant} size="small" />
      </View>
      <View style={styles.content}>
        <Image
          source={{ uri: imgError ? DEFAULT_PROPERTY_IMAGE : leadImage }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          onError={() => setImgError(true)}
        />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {property.title}
            </Text>
            <TouchableOpacity onPress={onWishlist} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{suffixText}</Text>
          {lead.status === 'New' && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={onVerify}
              activeOpacity={0.7}
            >
              <Text style={styles.verifyButtonText}>Verify Lead</Text>
            </TouchableOpacity>
          )}
          {lead.status === 'Booked' && (
            <Text style={styles.bountyText}>
              Bounty: KES {lead.bounty_amount.toLocaleString()}
            </Text>
          )}
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
  statusBadgeWrap: {
    position: 'absolute',
    top: -6,
    left: Spacing.md,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.deepCocoa,
    flex: 1,
    marginRight: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  verifyButton: {
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  verifyButtonText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
  bountyText: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: Colors.badgeSuccess,
    marginTop: Spacing.sm,
  },
});
