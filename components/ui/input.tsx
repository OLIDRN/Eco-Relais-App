import { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Text } from './text';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  BorderRadius,
  Spacing,
  Layout,
  Typography,
  FontFamily,
} from '@/constants/theme';

interface InputProps extends TextInputProps {
  /**
   * Label au-dessus du champ
   */
  label?: string;
  /**
   * Message d'erreur
   */
  error?: string;
  /**
   * Texte d'aide sous le champ
   */
  helper?: string;
  /**
   * Icône à gauche (composant React)
   */
  leftIcon?: React.ReactNode;
  /**
   * Icône à droite (composant React)
   */
  rightIcon?: React.ReactNode;
  /**
   * Callback au press de l'icône droite
   */
  onRightIconPress?: () => void;
  /**
   * Taille du champ
   * @default 'medium'
   */
  size?: 'medium' | 'large';
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  size = 'medium',
  style,
  editable = true,
  ...props
}: InputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.borderFocused;
    return colors.border;
  };

  const inputHeight = size === 'large' ? Layout.inputHeightLarge : Layout.inputHeight;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: editable ? colors.surface : colors.backgroundSecondary,
            height: inputHeight,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          editable={editable}
          includeFontPadding={false}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.iconRight}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {(error || helper) && (
        <Text
          variant="caption"
          color={error ? 'error' : 'textTertiary'}
          style={styles.helper}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    fontFamily: FontFamily.regular,
    // Pas de lineHeight ici : il coupe le texte dans un container à hauteur fixe
    paddingVertical: 0,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  helper: {
    marginTop: Spacing.xs,
  },
});
