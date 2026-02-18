import { StyleSheet, View } from 'react-native';
import { ScreenContainer, Text, Card, Button } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

export default function RelayScreen() {
  const colors = useThemeColors();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="h3">Devenir Relais</Text>
        <Text variant="body" color="textSecondary">
          Gagnez un revenu en livrant des colis
        </Text>
      </View>

      <Card style={styles.infoCard}>
        <Text variant="h5" style={styles.cardTitle}>
          Comment ça marche ?
        </Text>

        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primaryLight }]}>
            <Text variant="label" style={{ color: colors.primary }}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text variant="label">Inscrivez-vous comme relais</Text>
            <Text variant="bodySmall" color="textSecondary">
              Vérifiez votre identité pour commencer
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primaryLight }]}>
            <Text variant="label" style={{ color: colors.primary }}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text variant="label">Acceptez des missions</Text>
            <Text variant="bodySmall" color="textSecondary">
              Collectez et livrez des colis près de chez vous
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primaryLight }]}>
            <Text variant="label" style={{ color: colors.primary }}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text variant="label">Recevez vos gains</Text>
            <Text variant="bodySmall" color="textSecondary">
              Paiement sécurisé après chaque livraison
            </Text>
          </View>
        </View>
      </Card>

      <Button
        title="Devenir Voisin-Relais"
        variant="primary"
        fullWidth
        style={styles.ctaButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    marginBottom: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  ctaButton: {
    marginTop: Spacing.base,
  },
});
