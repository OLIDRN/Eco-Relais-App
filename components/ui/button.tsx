import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Text } from './text';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  BorderRadius,
  Layout,
  Spacing,
  Shadows,
  Typography,
} from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  /**
   * Texte du bouton
   */
  title: string;
  /**
   * Variante visuelle
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Taille du bouton
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * Afficher un loader
   */
  loading?: boolean;
  /**
   * Icône à gauche (composant React)
   */
  leftIcon?: React.ReactNode;
  /**
   * Icône à droite (composant React)
   */
  rightIcon?: React.ReactNode;
  /**
   * Bouton pleine largeur
   */
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) {
      return colors.border;
    }

    const baseColors: Record<ButtonVariant, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      outline: 'transparent',
      ghost: 'transparent',
    };

    const pressedColors: Record<ButtonVariant, string> = {
      primary: colors.primaryDark,
      secondary: colors.secondaryDark,
      accent: colors.accentDark,
      outline: colors.primaryLight,
      ghost: colors.backgroundSecondary,
    };

    return pressed ? pressedColors[variant] : baseColors[variant];
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.textTertiary;
    }

    const textColors: Record<ButtonVariant, string> = {
      primary: colors.onPrimary,
      secondary: colors.onSecondary,
      accent: colors.onAccent,
      outline: colors.primary,
      ghost: colors.primary,
    };

    return textColors[variant];
  };

  const getBorderColor = () => {
    if (disabled) {
      return colors.border;
    }

    if (variant === 'outline') {
      return colors.primary;
    }

    return 'transparent';
  };

  const getHeight = () => {
    const heights: Record<ButtonSize, number> = {
      small: Layout.buttonHeightSmall,
      medium: Layout.buttonHeight,
      large: Layout.buttonHeightLarge,
    };
    return heights[size];
  };

  const getPaddingHorizontal = () => {
    const paddings: Record<ButtonSize, number> = {
      small: Spacing.md,
      medium: Spacing.lg,
      large: Spacing.xl,
    };
    return paddings[size];
  };

  const textColor = getTextColor();

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          height: getHeight(),
          paddingHorizontal: getPaddingHorizontal(),
        },
        variant !== 'ghost' && variant !== 'outline' && Shadows.sm,
        fullWidth && styles.fullWidth,
        style as any,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            variant={size === 'small' ? 'label' : 'button'}
            style={{ color: textColor }}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
});
