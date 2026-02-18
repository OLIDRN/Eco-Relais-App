import { View, ViewProps, StyleSheet, ScrollView, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Layout, Spacing } from '@/constants/theme';

interface ContainerProps extends ViewProps {
  /**
   * Appliquer le padding horizontal par défaut
   * @default true
   */
  padded?: boolean;
  /**
   * Centrer le contenu (utile pour tablettes/web)
   * @default false
   */
  centered?: boolean;
}

interface ScreenContainerProps extends ScrollViewProps {
  /**
   * Appliquer le padding horizontal par défaut
   * @default true
   */
  padded?: boolean;
  /**
   * Utiliser un ScrollView
   * @default true
   */
  scrollable?: boolean;
  /**
   * Prendre en compte la safe area
   * @default true
   */
  safeArea?: boolean;
}

/**
 * Container simple avec padding et centrage optionnel
 */
export function Container({
  padded = true,
  centered = false,
  style,
  children,
  ...props
}: ContainerProps) {
  return (
    <View
      style={[
        padded && styles.padded,
        centered && styles.centered,
        style,
      ]}
      {...props}
    >
      {centered ? (
        <View style={styles.centeredContent}>{children}</View>
      ) : (
        children
      )}
    </View>
  );
}

/**
 * Container d'écran avec fond, safe area et scroll optionnel
 */
export function ScreenContainer({
  padded = true,
  scrollable = true,
  safeArea = true,
  style,
  children,
  ...props
}: ScreenContainerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.screen,
    { backgroundColor: colors.background },
    safeArea && {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    padded && styles.padded,
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          safeArea && {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
          padded && styles.padded,
          styles.scrollContent,
          style,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
  },
  centered: {
    alignItems: 'center',
  },
  centeredContent: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
  },
});
