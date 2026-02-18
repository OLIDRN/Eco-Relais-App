/**
 * Hooks pour la gestion du thème Eco-Relais
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

/**
 * Récupère une couleur du thème actuel
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors
): string {
  const { theme } = useTheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}

/**
 * Récupère toutes les couleurs du thème actuel
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return Colors[theme];
}

/**
 * Vérifie si le thème actuel est sombre
 */
export function useIsDarkMode(): boolean {
  const { isDark } = useTheme();
  return isDark;
}
