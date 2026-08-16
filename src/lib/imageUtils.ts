// Utility functions for robust image URI handling, validation, and fallback
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export const DEFAULT_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800';

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800';

export const DEFAULT_SERVICE_IMAGE =
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800';

export const DEFAULT_AVATAR =
  'https://i.pravatar.cc/150?img=12';

/**
 * Checks if an image URI is valid and displayable across sessions.
 * Dead blob URLs or empty strings return false.
 */
export function isValidImageUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (trimmed.length === 0) return false;
  
  // Note: blob: URLs expire after page reload or across clients
  // If stored in DB, blob: URLs are invalid
  if (trimmed.startsWith('blob:')) return false;

  // Accept HTTP/HTTPS, data URIs, or file URIs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('file://')
  ) {
    return true;
  }

  return false;
}

/**
 * Parses and sanitizes a property images array or stringified JSON.
 * Returns an array guaranteed to have at least one valid image URI.
 */
export function getValidPropertyImages(imagesInput?: any): string[] {
  let imagesArray: string[] = [];

  if (Array.isArray(imagesInput)) {
    imagesArray = imagesInput;
  } else if (typeof imagesInput === 'string' && imagesInput.trim()) {
    try {
      const parsed = JSON.parse(imagesInput);
      if (Array.isArray(parsed)) {
        imagesArray = parsed;
      } else if (isValidImageUri(imagesInput)) {
        imagesArray = [imagesInput];
      }
    } catch {
      if (isValidImageUri(imagesInput)) {
        imagesArray = [imagesInput];
      }
    }
  }

  const validImages = imagesArray
    .map((img) => (typeof img === 'string' ? img.trim() : ''))
    .filter((img) => isValidImageUri(img));

  if (validImages.length > 0) {
    return validImages;
  }

  return [DEFAULT_PROPERTY_IMAGE];
}

/**
 * Gets a single valid image URL for a property listing card.
 */
export function getSinglePropertyImage(imagesInput?: any): string {
  const validList = getValidPropertyImages(imagesInput);
  return validList[0] || DEFAULT_PROPERTY_IMAGE;
}

/**
 * Converts an ImagePicker asset to a durable URI (Base64 Data URI if available).
 */
export function formatPickedAsset(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.base64) {
    const mimeType = asset.mimeType || 'image/jpeg';
    return `data:${mimeType};base64,${asset.base64}`;
  }
  return asset.uri;
}

/** Uploads a picked image to owner-scoped Supabase Storage and returns its durable URL. */
export async function uploadPickedImage(
  asset: ImagePicker.ImagePickerAsset,
  bucket: 'property-images' | 'product-images' | 'kyc-documents',
  ownerId: string
): Promise<string> {
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('The selected image could not be read.');
  const blob = await response.blob();
  const mimeType = asset.mimeType || blob.type || 'image/jpeg';
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const path = `${ownerId}/${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;
  if (bucket === 'kyc-documents') return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
