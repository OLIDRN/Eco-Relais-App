import { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text, Card, Badge, ScreenContainer } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { apiGet } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Mission, MissionStatus, PackageSize } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

const STATUS_CONFIG: Record<MissionStatus, { label: string; variant: BadgeVariant }> = {
  pending:    { label: 'En attente',   variant: 'neutral' },
  accepted:   { label: 'Assigné',      variant: 'info' },
  collected:  { label: 'Récupéré',     variant: 'accent' },
  in_transit: { label: 'En livraison', variant: 'warning' },
  delivered:  { label: 'Livré',        variant: 'success' },
  cancelled:  { label: 'Annulé',       variant: 'error' },
};

const SIZE_LABEL: Record<PackageSize, string> = {
  small:  'Petit',
  medium: 'Moyen',
  large:  'Grand',
};

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── MissionCard ────────────────────────────────────────────────────────────

interface MissionCardProps {
  mission: Mission;
}

function MissionCard({ mission }: MissionCardProps) {
  const colors = useThemeColors();
  const statusConfig = STATUS_CONFIG[mission.status];

  return (
    <Card style={styles.card}>
      {/* Ligne 1 : titre + taille */}
      <View style={styles.cardRow}>
        <Text variant="label" style={styles.cardTitle} numberOfLines={1}>
          {mission.package_title}
        </Text>
        <Badge label={SIZE_LABEL[mission.package_size]} variant="neutral" size="small" />
      </View>

      {/* Ligne 2 : adresses */}
      <View style={[styles.cardRow, styles.addressRow]}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text variant="bodySmall" color="textSecondary" style={styles.address} numberOfLines={1}>
          {mission.pickup_address}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} />
        <Text variant="bodySmall" color="textSecondary" style={styles.address} numberOfLines={1}>
          {mission.delivery_address}
        </Text>
      </View>

      {/* Ligne 3 : créneau */}
      <View style={[styles.cardRow, styles.slotRow]}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text variant="caption" color="textSecondary" style={{ marginLeft: Spacing.xs }}>
          {mission.pickup_time_slot}
        </Text>
      </View>

      {/* Ligne 4 : statut + prix + date */}
      <View style={[styles.cardRow, styles.footerRow]}>
        <Badge label={statusConfig.label} variant={statusConfig.variant} size="small" />
        <View style={styles.footerRight}>
          <Text variant="label" color="primary">
            {formatPrice(mission.price)}
          </Text>
          <Text variant="caption" color="textTertiary" style={{ marginLeft: Spacing.sm }}>
            {formatDate(mission.created_at)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ── PackagesScreen ─────────────────────────────────────────────────────────

export default function PackagesScreen() {
  const colors = useThemeColors();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchMissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const data = await apiGet<{ missions: Mission[] }>('/api/missions');
      setMissions(data.missions ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Rafraîchit à chaque fois que l'écran prend le focus
  useFocusEffect(
    useCallback(() => {
      fetchMissions();
    }, [fetchMissions])
  );

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        padded
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMissions(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3">Mes colis</Text>
          <Text variant="body" color="textSecondary">
            Suivez vos envois
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Erreur */}
        {!loading && error && (
          <Card variant="outlined" style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.error} />
            <Text variant="body" color="textSecondary" center style={styles.stateText}>
              Impossible de charger vos colis
            </Text>
            <Pressable onPress={() => fetchMissions()} style={styles.retryBtn}>
              <Text variant="label" color="primary">Réessayer</Text>
            </Pressable>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && missions.length === 0 && (
          <Card variant="outlined" style={styles.stateCard}>
            <Ionicons name="cube-outline" size={36} color={colors.textTertiary} />
            <Text variant="body" color="textSecondary" center style={styles.stateText}>
              Aucun colis pour le moment
            </Text>
            <Text variant="bodySmall" color="textTertiary" center>
              Appuyez sur "Envoyer un colis" pour créer votre première mission
            </Text>
          </Card>
        )}

        {/* Liste */}
        {!loading && !error && missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}

        {/* Espace pour le FAB */}
        <View style={styles.fabSpacer} />
      </ScreenContainer>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/mission-create')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, ...Shadows.lg },
          pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text variant="button" style={styles.fabLabel}>
          Envoyer un colis
        </Text>
      </Pressable>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
    gap: Spacing.xs,
  },
  centered: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  stateCard: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stateText: {
    marginTop: Spacing.xs,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  addressRow: {
    gap: Spacing.xs,
  },
  address: {
    flex: 1,
    flexShrink: 1,
  },
  slotRow: {
    gap: Spacing.xs,
  },
  footerRow: {
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  fabLabel: {
    color: '#fff',
  },
});
