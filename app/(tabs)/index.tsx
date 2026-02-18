import { StyleSheet, View } from 'react-native';
import { ScreenContainer, Text, Card, Button } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function HomeScreen() {
  const colors = useThemeColors();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="h3">Accueil</Text>
        <Text variant="body" color="textSecondary">
          Trouvez un relais près de chez vous
        </Text>
      </View>

      {/* Map Placeholder */}
      <View
        style={[
          styles.mapPlaceholder,
          { backgroundColor: colors.backgroundTertiary },
        ]}
      >
        <Text variant="body" color="textTertiary" center>
          Carte interactive
        </Text>
        <Text variant="caption" color="textTertiary" center>
          (Mapbox à venir)
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Card
          style={[styles.actionCard, { backgroundColor: colors.primaryLight }]}
          onPress={() => {}}
        >
          <Text variant="h5" style={{ color: colors.primary }}>
            Envoyer
          </Text>
          <Text variant="bodySmall" style={{ color: colors.primary }}>
            un colis
          </Text>
        </Card>

        <Card
          style={[styles.actionCard, { backgroundColor: colors.secondaryLight }]}
          onPress={() => {}}
        >
          <Text variant="h5" style={{ color: colors.secondary }}>
            Recevoir
          </Text>
          <Text variant="bodySmall" style={{ color: colors.secondary }}>
            un colis
          </Text>
        </Card>
      </View>

      {/* Nearby Relays Preview */}
      <View style={styles.section}>
        <Text variant="h5" style={styles.sectionTitle}>
          Relais à proximité
        </Text>
        <Card variant="outlined">
          <Text variant="body" color="textSecondary" center>
            Activez la géolocalisation pour voir les relais
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.base,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
});
