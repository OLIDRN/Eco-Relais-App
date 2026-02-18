import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing, Shadows, type ShadowKey } from '@/constants/theme';

interface CardProps extends ViewProps {
  /**
   * Padding interne
   * @default true
   */
  padded?: boolean;
  /**
   * Niveau d'élévation (ombre)
   * @default 'base'
   */
  elevation?: ShadowKey;
  /**
   * Callback au press (rend la card pressable)
   */
  onPress?: () => void;
  /**
   * Variante de style
   * @default 'elevated'
   */
  variant?: 'elevated' | 'outlined' | 'filled';
}

export function Card({
  padded = true,
  elevation = 'base',
  onPress,
  variant = 'elevated',
  style,
  children,
  ...props
}: CardProps) {
  const colors = useThemeColors();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceElevated;
      case 'outlined':
        return colors.surface;
      case 'filled':
        return colors.backgroundSecondary;
      default:
        return colors.surface;
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: variant === 'outlined' ? colors.border : 'transparent',
      borderWidth: variant === 'outlined' ? 1 : 0,
    },
    variant === 'elevated' && Shadows[elevation],
    padded && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { opacity: 0.9 },
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.base,
  },
});
