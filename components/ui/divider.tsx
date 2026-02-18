import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

interface DividerProps {
  /**
   * Espacement vertical
   * @default 'base'
   */
  spacing?: 'none' | 'sm' | 'base' | 'lg';
}

export function Divider({ spacing = 'base' }: DividerProps) {
  const colors = useThemeColors();

  const getMargin = () => {
    const margins = {
      none: 0,
      sm: Spacing.sm,
      base: Spacing.base,
      lg: Spacing.xl,
    };
    return margins[spacing];
  };

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
          marginVertical: getMargin(),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
