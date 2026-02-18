import { View, StyleSheet } from 'react-native';
import { Text } from './text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium';

/**
 * Statuts de colis prédéfinis
 */
type PackageStatus = 'pending' | 'assigned' | 'collected' | 'delivered';

interface BadgeProps {
  /**
   * Texte du badge
   */
  label: string;
  /**
   * Variante de couleur
   * @default 'neutral'
   */
  variant?: BadgeVariant;
  /**
   * Taille
   * @default 'medium'
   */
  size?: BadgeSize;
  /**
   * Icône à gauche
   */
  icon?: React.ReactNode;
}

interface PackageStatusBadgeProps {
  /**
   * Statut du colis
   */
  status: PackageStatus;
  /**
   * Taille
   * @default 'medium'
   */
  size?: BadgeSize;
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'medium',
  icon,
}: BadgeProps) {
  const colors = useThemeColors();

  const getColors = (): { background: string; text: string } => {
    switch (variant) {
      case 'primary':
        return { background: colors.primaryLight, text: colors.primary };
      case 'secondary':
        return { background: colors.secondaryLight, text: colors.secondary };
      case 'accent':
        return { background: colors.accentLight, text: colors.accent };
      case 'success':
        return { background: colors.successLight, text: colors.success };
      case 'error':
        return { background: colors.errorLight, text: colors.error };
      case 'warning':
        return { background: colors.warningLight, text: colors.warning };
      case 'info':
        return { background: colors.infoLight, text: colors.info };
      case 'neutral':
      default:
        return { background: colors.backgroundTertiary, text: colors.textSecondary };
    }
  };

  const badgeColors = getColors();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.background,
          paddingVertical: isSmall ? Spacing.xs : Spacing.sm,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
        },
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        variant={isSmall ? 'labelSmall' : 'label'}
        style={{ color: badgeColors.text }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Badge prédéfini pour les statuts de colis
 */
export function PackageStatusBadge({ status, size = 'medium' }: PackageStatusBadgeProps) {
  const statusConfig: Record<PackageStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'En attente', variant: 'neutral' },
    assigned: { label: 'Assigné', variant: 'info' },
    collected: { label: 'Récupéré', variant: 'accent' },
    delivered: { label: 'Livré', variant: 'success' },
  };

  const config = statusConfig[status];

  return <Badge label={config.label} variant={config.variant} size={size} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: Spacing.xs,
  },
});
