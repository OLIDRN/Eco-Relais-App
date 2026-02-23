import { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, RefreshControl, Pressable, Platform, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text, Card, Badge, Button, ScreenContainer, Divider } from '@/components/ui';
import { QRScannerModal } from '@/components/QRScannerModal';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { apiGet, apiPut } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Mission, MissionStatus, PackageSize, ApiError } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

function openNavigation(lat: number, lng: number) {
  if (lat === 0 && lng === 0) return;
  const url = Platform.select({
    ios:     `maps://app?daddr=${lat},${lng}&dirflg=d`,
    android: `geo:${lat},${lng}?q=${lat},${lng}`,
    default: `https://maps.google.com/maps?daddr=${lat},${lng}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://maps.google.com/maps?daddr=${lat},${lng}`)
  );
}

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
  return (Number(price) || 0).toFixed(2).replace('.', ',') + ' €';
}

// ── MissionActionCard ──────────────────────────────────────────────────────

type ScanAction = 'collect' | 'deliver';

interface MissionActionCardProps {
  mission: Mission;
  loadingActionId: string | null;
  onAction: (mission: Mission) => void;
  onScanNeeded: (mission: Mission, action: ScanAction) => void;
}

function MissionActionCard({ mission, loadingActionId, onAction, onScanNeeded }: MissionActionCardProps) {
  const colors = useThemeColors();
  const statusConfig = STATUS_CONFIG[mission.status];
  const isLoading = loadingActionId === mission.id;

  // Toujours utiliser le scan QR (l'ID de mission est toujours disponible)
  const hasQR = true;
  const ACTION_CONFIG: Partial<Record<MissionStatus, { label: string; icon: string; variant: 'primary' | 'accent' | 'secondary'; requiresQR: boolean }>> = {
    accepted:   { label: hasQR ? 'Scanner QR de collecte'  : 'Collecter le colis',    icon: hasQR ? 'qr-code-outline' : 'cube-outline',             variant: 'primary',   requiresQR: hasQR },
    collected:  { label: 'Démarrer la livraison',                                      icon: 'bicycle-outline',                                       variant: 'accent',    requiresQR: false },
    in_transit: { label: hasQR ? 'Scanner QR de livraison' : 'Marquer comme livré',   icon: hasQR ? 'qr-code-outline' : 'checkmark-circle-outline',  variant: 'secondary', requiresQR: hasQR },
  };

  const action = ACTION_CONFIG[mission.status];

  // Destination de navigation selon le statut
  const navTarget =
    mission.status === 'accepted'
      ? { lat: mission.pickup_lat,   lng: mission.pickup_lng,   label: 'Point de collecte' }
      : (mission.status === 'collected' || mission.status === 'in_transit')
      ? { lat: mission.delivery_lat, lng: mission.delivery_lng, label: 'Point de livraison' }
      : null;
  const canNavigate = navTarget !== null && !(navTarget.lat === 0 && navTarget.lng === 0);

  return (
    <Card style={styles.missionCard}>

      {/* ── Header : titre + badge taille ── */}
      <View style={styles.cardHeader}>
        <Text variant="label" style={styles.cardTitle} numberOfLines={1}>
          {mission.package_title}
        </Text>
        <Badge label={SIZE_LABEL[mission.package_size]} variant="neutral" size="small" />
      </View>

      {/* ── Client ── */}
      {(mission.client_first_name || mission.client_last_name) && (
        <View style={styles.personRow}>
          <View style={[styles.personAvatar, { backgroundColor: colors.primaryLight }]}>
            <Text variant="caption" style={{ color: colors.primary }}>
              {mission.client_first_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text variant="caption" color="textSecondary">
            Colis de{' '}
            <Text variant="caption" style={{ color: colors.text }}>
              {mission.client_first_name} {mission.client_last_name}
            </Text>
          </Text>
        </View>
      )}

      {/* ── Adresses avec connecteur vertical ── */}
      <View style={styles.addrBlock}>
        {/* Colonne gauche : dots + ligne */}
        <View style={styles.addrTrack}>
          <View style={[styles.addrDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.addrConnector, { backgroundColor: colors.border }]} />
          <View style={[styles.addrDot, { backgroundColor: colors.accent }]} />
        </View>
        {/* Colonne droite : textes */}
        <View style={styles.addrTexts}>
          <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
            {mission.pickup_address}
          </Text>
          <View style={{ height: Spacing.md }} />
          <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
            {mission.delivery_address}
          </Text>
        </View>
      </View>

      {/* ── Créneau ── */}
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
        <Text variant="caption" color="textTertiary" style={{ marginLeft: Spacing.xs }}>
          {mission.pickup_time_slot}
        </Text>
      </View>

      <Divider spacing="sm" />

      {/* ── Footer : statut + gains ── */}
      <View style={styles.cardFooter}>
        <Badge label={statusConfig.label} variant={statusConfig.variant} size="small" />
        <View style={styles.earningsChip}>
          <Text variant="caption" color="textTertiary">Gains </Text>
          <Text variant="label" color="primary">
            {formatPrice(Number(mission.price) - Number(mission.commission))}
          </Text>
        </View>
      </View>

      {/* ── Bouton itinéraire ── */}
      {canNavigate && (
        <Pressable
          onPress={() => openNavigation(navTarget!.lat, navTarget!.lng)}
          style={({ pressed }) => [
            styles.navBtn,
            { borderColor: colors.border, backgroundColor: pressed ? colors.primaryLight : colors.surface },
          ]}
        >
          <Ionicons name="navigate-outline" size={15} color={colors.primary} />
          <Text variant="bodySmall" style={{ color: colors.primary, marginLeft: Spacing.xs }}>
            {navTarget!.label}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} style={{ marginLeft: 'auto' }} />
        </Pressable>
      )}

      {/* ── Bouton d'action ── */}
      {action && (
        <Button
          title={action.label}
          variant={action.variant}
          size="small"
          fullWidth
          loading={isLoading}
          leftIcon={<Ionicons name={action.icon as any} size={16} color="#fff" />}
          onPress={() => {
            if (action.requiresQR) {
              onScanNeeded(mission, mission.status === 'accepted' ? 'collect' : 'deliver');
            } else {
              onAction(mission);
            }
          }}
          style={styles.actionBtn}
        />
      )}

      {/* ── Mission terminée ── */}
      {mission.status === 'delivered' && (
        <View style={[styles.deliveredBadge, { backgroundColor: colors.successLight }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text variant="caption" style={{ color: colors.success, marginLeft: Spacing.xs }}>
            Mission terminée
          </Text>
        </View>
      )}

    </Card>
  );
}

// ── PartnerView ────────────────────────────────────────────────────────────

function PartnerView() {
  const colors = useThemeColors();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [scanContext, setScanContext] = useState<{ mission: Mission; action: ScanAction } | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [missionsData, earningsData] = await Promise.all([
        apiGet<{ missions: Mission[] }>('/api/missions'),
        apiGet<{ total_earnings: number }>('/api/payments/earnings').catch(() => ({ total_earnings: 0 })),
      ]);
      setMissions(missionsData.missions ?? []);
      setTotalEarnings(earningsData.total_earnings);
    } catch {
      // garde l'état précédent en cas d'erreur réseau
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Action directe (sans scan QR) — uniquement pour "collected → in_transit"
  const handleAction = useCallback(async (mission: Mission) => {
    setLoadingActionId(mission.id);
    setActionError('');
    try {
      await apiPut(`/api/missions/${mission.id}/status`, { status: 'in_transit' });
      await fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.message ?? 'Une erreur est survenue.');
    } finally {
      setLoadingActionId(null);
    }
  }, [fetchData]);

  // Ouvre le scanner pour les actions nécessitant un QR
  const handleScanNeeded = useCallback((mission: Mission, action: ScanAction) => {
    setActionError('');
    setScanContext({ mission, action });
  }, []);

  // Callback une fois le QR scanné
  const handleQRScanned = useCallback(async (data: string) => {
    if (!scanContext) return;
    const { mission, action } = scanContext;
    setScanContext(null);

    // Validation : le QR scanné doit correspondre à l'ID de la mission
    if (data !== mission.id) {
      setActionError('QR code invalide pour ce colis. Veuillez réessayer.');
      return;
    }

    setLoadingActionId(mission.id);
    setActionError('');
    try {
      if (action === 'collect') {
        await apiPut(`/api/missions/${mission.id}/collect`, {});
      } else {
        await apiPut(`/api/missions/${mission.id}/deliver`, {});
      }
      await fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.message ?? 'Une erreur est survenue.');
    } finally {
      setLoadingActionId(null);
    }
  }, [scanContext, fetchData]);

  const activeMissions = missions.filter(m => m.status !== 'cancelled');

  return (
    <>
    <ScreenContainer
      scrollable
      padded
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h3">Mes missions</Text>
        <Text variant="body" color="textSecondary">
          Gérez vos livraisons en cours
        </Text>
      </View>

      {/* Carte gains */}
      {totalEarnings !== null && (
        <Card style={[styles.earningsCard, { backgroundColor: colors.primary }]}>
          <View style={styles.earningsRow}>
            <View>
              <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Total gagné
              </Text>
              <Text variant="h3" style={{ color: '#fff' }}>
                {formatPrice(totalEarnings)}
              </Text>
            </View>
            <View style={[styles.earningsIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="wallet-outline" size={28} color="#fff" />
            </View>
          </View>
        </Card>
      )}

      {/* Erreur action */}
      {actionError !== '' && (
        <Card variant="outlined" style={[styles.errorCard, { borderColor: colors.error }]}>
          <Text variant="caption" color="error">{actionError}</Text>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Empty state */}
      {!loading && activeMissions.length === 0 && (
        <Card variant="outlined" style={styles.emptyCard}>
          <Ionicons name="bicycle-outline" size={36} color={colors.textTertiary} />
          <Text variant="body" color="textSecondary" center style={{ marginTop: Spacing.sm }}>
            Aucune mission en cours
          </Text>
          <Text variant="bodySmall" color="textTertiary" center>
            Acceptez une mission depuis la carte d'accueil
          </Text>
        </Card>
      )}

      {/* Liste missions */}
      {!loading && activeMissions.map((mission) => (
        <MissionActionCard
          key={mission.id}
          mission={mission}
          loadingActionId={loadingActionId}
          onAction={handleAction}
          onScanNeeded={handleScanNeeded}
        />
      ))}

      <View style={{ height: Spacing.xl }} />
    </ScreenContainer>

    {/* Scanner QR — s'affiche par-dessus tout */}
    <QRScannerModal
      visible={scanContext !== null}
      title={scanContext?.action === 'collect' ? 'Scanner QR de collecte' : 'Scanner QR de livraison'}
      onScan={handleQRScanned}
      onClose={() => setScanContext(null)}
    />
    </>
  );
}

// ── ClientView ─────────────────────────────────────────────────────────────

function ClientView() {
  const colors = useThemeColors();

  return (
    <ScreenContainer padded>
      <View style={styles.header}>
        <Text variant="h3">Devenir Relais</Text>
        <Text variant="body" color="textSecondary">
          Gagnez un revenu en livrant des colis
        </Text>
      </View>

      <Card style={styles.infoCard}>
        <Text variant="h5" style={styles.cardSectionTitle}>
          Comment ça marche ?
        </Text>

        {[
          { n: '1', title: "Inscrivez-vous comme relais", desc: "Vérifiez votre identité pour commencer" },
          { n: '2', title: "Acceptez des missions",       desc: "Collectez et livrez des colis près de chez vous" },
          { n: '3', title: "Recevez vos gains",           desc: "Paiement sécurisé après chaque livraison" },
        ].map((step) => (
          <View key={step.n} style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primaryLight }]}>
              <Text variant="label" style={{ color: colors.primary }}>{step.n}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text variant="label">{step.title}</Text>
              <Text variant="bodySmall" color="textSecondary">{step.desc}</Text>
            </View>
          </View>
        ))}
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

// ── RelayScreen ────────────────────────────────────────────────────────────

export default function RelayScreen() {
  const { user } = useAuth();
  return user?.role === 'partner' ? <PartnerView /> : <ClientView />;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
    gap: Spacing.xs,
  },
  // Partner
  earningsCard: {
    marginBottom: Spacing.lg,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  centered: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyCard: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.xs,
  },
  missionCard: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  // Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  personAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  // Adresses
  addrBlock: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  addrTrack: {
    alignItems: 'center',
    paddingTop: 3,
  },
  addrDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addrConnector: {
    width: 1.5,
    flex: 1,
    minHeight: Spacing.lg,
    marginVertical: 3,
  },
  addrTexts: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // Créneau
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  // Boutons
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionBtn: {
    marginTop: Spacing.xs,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  // Client
  infoCard: {
    marginBottom: Spacing.xl,
  },
  cardSectionTitle: {
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
    gap: Spacing.xs,
  },
  ctaButton: {
    marginTop: Spacing.base,
  },
});
