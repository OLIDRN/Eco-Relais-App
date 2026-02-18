import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Layout, BorderRadius, Shadows } from '@/constants/theme';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  /**
   * URL de l'image
   */
  source?: string | null;
  /**
   * Nom pour générer les initiales (fallback)
   */
  name?: string;
  /**
   * Taille de l'avatar
   * @default 'medium'
   */
  size?: AvatarSize;
  /**
   * Afficher un badge vérifié
   */
  verified?: boolean;
  /**
   * Afficher un indicateur en ligne
   */
  online?: boolean;
}

export function Avatar({
  source,
  name,
  size = 'medium',
  verified = false,
  online,
}: AvatarProps) {
  const colors = useThemeColors();

  const getSize = (): number => {
    const sizes: Record<AvatarSize, number> = {
      small: Layout.avatarSizeSmall,
      medium: Layout.avatarSizeMedium,
      large: Layout.avatarSizeLarge,
      xlarge: Layout.avatarSizeXLarge,
    };
    return sizes[size];
  };

  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const avatarSize = getSize();
  const indicatorSize = avatarSize * 0.25;
  const badgeSize = avatarSize * 0.35;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          <Text
            variant={size === 'small' ? 'labelSmall' : size === 'xlarge' ? 'h3' : 'label'}
            style={{ color: colors.primary }}
          >
            {getInitials()}
          </Text>
        </View>
      )}

      {/* Badge vérifié */}
      {verified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: colors.success,
              borderColor: colors.surface,
            },
          ]}
        >
          <Text
            variant="labelSmall"
            style={{ color: colors.textInverse, fontSize: badgeSize * 0.6 }}
          >
            ✓
          </Text>
        </View>
      )}

      {/* Indicateur en ligne */}
      {online !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: online ? colors.success : colors.textTertiary,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    ...Shadows.sm,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderWidth: 2,
  },
});
