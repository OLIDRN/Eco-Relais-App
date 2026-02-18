import { StyleSheet, View } from 'react-native';
import { ScreenContainer, Text, Card } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

export default function PackagesScreen() {
  const colors = useThemeColors();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="h3">Mes colis</Text>
        <Text variant="body" color="textSecondary">
          Suivez vos envois et réceptions
        </Text>
      </View>

      <Card variant="outlined" style={styles.emptyState}>
        <Text variant="body" color="textSecondary" center>
          Aucun colis pour le moment
        </Text>
        <Text variant="bodySmall" color="textTertiary" center style={styles.emptyHint}>
          Vos colis envoyés et reçus apparaîtront ici
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  emptyState: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyHint: {
    marginTop: Spacing.sm,
  },
});
