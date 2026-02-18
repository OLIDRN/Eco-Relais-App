import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography, FontFamily, type ThemeColors } from '@/constants/theme';

type TypographyVariant = keyof typeof Typography;
type ColorKey = keyof ThemeColors;

interface TextProps extends RNTextProps {
  /**
   * Variante typographique
   * @default 'body'
   */
  variant?: TypographyVariant;
  /**
   * Couleur du texte (clé du thème)
   * @default 'text'
   */
  color?: ColorKey;
  /**
   * Centrer le texte
   */
  center?: boolean;
}

export function Text({
  variant = 'body',
  color = 'text',
  center,
  style,
  ...props
}: TextProps) {
  const textColor = useThemeColor({}, color);
  const typographyStyle = Typography[variant];

  return (
    <RNText
      style={[
        typographyStyle,
        { color: textColor },
        center && styles.center,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
