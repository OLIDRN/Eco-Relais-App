import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Text, Button, Badge } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { apiGet, apiPut } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Mission, PackageSize, ApiError, Notification } from '@/types/api';
import { NotificationsModal } from '@/components/NotificationsModal';

// ── Constantes ─────────────────────────────────────────────────────────────

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ZOOM_DELTA = 0.01;

const SIZE_LABEL: Record<PackageSize, string> = {
  small:  'Petit',
  medium: 'Moyen',
  large:  'Grand',
};

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// ── HomeScreen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const isPartner = user?.role === 'partner';

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);

  // Notifications
  const [unreadCount, setUnreadCount]   = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);

  // Bottom sheet état
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  // ── Géolocalisation ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const userRegion: Region = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: ZOOM_DELTA,
        longitudeDelta: ZOOM_DELTA,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 1000);
    })();
  }, []);

  // ── Notifications : badge unread ──────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    apiGet<{ notifications: Notification[] }>('/api/notifications')
      .then(d => setUnreadCount(d.notifications.filter(n => !n.read).length))
      .catch(() => {});
  }, []));

  // ── Missions proches ──────────────────────────────────────────────────────
  const fetchMissions = useCallback(() => {
    // Seuls les partners ont besoin des missions proches sur la carte
    if (!isPartner) return;
    if (region.latitude === DEFAULT_REGION.latitude) return;
    apiGet<{ missions: Mission[] }>(
      `/api/missions?lat=${region.latitude}&lng=${region.longitude}&radius=5000`
    )
      .then((data) => setMissions(data.missions ?? []))
      .catch(() => {});
  }, [isPartner, region.latitude, region.longitude]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // ── Recentrer ─────────────────────────────────────────────────────────────
  const handleRecenter = useCallback(() => {
    mapRef.current?.animateToRegion(region, 500);
  }, [region]);

  // ── Accepter une mission ──────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!selectedMission) return;
    setAcceptLoading(true);
    setAcceptError('');
    try {
      await apiPut(`/api/missions/${selectedMission.id}/accept`, {});
      // Retirer le marqueur accepté de la liste
      setMissions((prev) => prev.filter((m) => m.id !== selectedMission.id));
      setSelectedMission(null);
    } catch (err) {
      const apiErr = err as ApiError;
      setAcceptError(apiErr.message ?? 'Impossible d\'accepter cette mission.');
    } finally {
      setAcceptLoading(false);
    }
  }, [selectedMission]);

  const handleCloseSheet = useCallback(() => {
    setSelectedMission(null);
    setAcceptError('');
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const markerColor = (size: PackageSize) => {
    if (size === 'large') return colors.accent;
    if (size === 'medium') return colors.secondary;
    return colors.primary;
  };

  // Les marqueurs ne concernent que les partners (missions disponibles à accepter)
  // Pour les clients, le suivi des colis se fait dans l'onglet "Mes colis"
  const pendingMissions = isPartner ? missions.filter((m) => m.status === 'pending') : [];

  return (
    <View style={styles.root}>

      {/* ── Carte plein écran ──────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {pendingMissions.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.pickup_lat, longitude: m.pickup_lng }}
            tracksViewChanges={false}
            onPress={isPartner ? () => setSelectedMission(m) : undefined}
          >
            <View style={[
              styles.marker,
              { backgroundColor: markerColor(m.package_size) },
              isPartner && styles.markerClickable,
            ]}>
              <Ionicons name="cube" size={13} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Overlay haut : barre de recherche ─────────────────────────── */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        <View style={[styles.searchBar, { backgroundColor: colors.surface, ...Shadows.md }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
            {user ? `Bonjour ${user.first_name} 👋` : 'Rechercher une adresse...'}
          </Text>
          <Pressable onPress={() => setNotifVisible(true)} style={styles.bellBtn} hitSlop={8}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            )}
          </Pressable>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text variant="labelSmall" style={{ color: colors.primary }}>
              {user?.first_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>

        {/* Hint cliquable pour les partners */}
        {isPartner && pendingMissions.length > 0 && (
          <View style={[styles.partnerHint, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="finger-print-outline" size={13} color={colors.primary} />
            <Text variant="caption" style={{ color: colors.primary, marginLeft: Spacing.xs }}>
              Appuyez sur un colis pour l'accepter
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* ── Bouton recentrer ───────────────────────────────────────────── */}
      <Pressable
        onPress={handleRecenter}
        style={[styles.recenterBtn, { backgroundColor: colors.surface, ...Shadows.md }]}
      >
        <Ionicons name="locate-outline" size={22} color={colors.primary} />
      </Pressable>

      {/* ── Footer overlay ─────────────────────────────────────────────── */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']} pointerEvents="box-none">
        {permissionDenied && (
          <Pressable
            style={[styles.banner, { backgroundColor: colors.errorLight }]}
            onPress={() => Linking.openSettings()}
          >
            <Ionicons name="warning-outline" size={15} color={colors.error} />
            <Text variant="caption" color="error" style={{ marginLeft: Spacing.xs, flex: 1 }}>
              Géolocalisation désactivée — Appuyez pour ouvrir les paramètres
            </Text>
            <Ionicons name="chevron-forward" size={13} color={colors.error} />
          </Pressable>
        )}

        {pendingMissions.length > 0 && (
          <View
            style={[styles.badge, { backgroundColor: colors.surface, ...Shadows.sm }]}
            pointerEvents="none"
          >
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text variant="caption" color="textSecondary">
              {pendingMissions.length} colis à proximité
            </Text>
          </View>
        )}

        {!isPartner && (
          <Button
            title="Envoyer un colis"
            onPress={() => router.push('/(tabs)/packages')}
            fullWidth
            leftIcon={<Ionicons name="cube-outline" size={18} color="#fff" />}
          />
        )}
      </SafeAreaView>

      {/* ── Modal notifications ────────────────────────────────────────── */}
      <NotificationsModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        onNotificationsRead={() => setUnreadCount(0)}
      />

      {/* ── Bottom sheet : détail mission (partner uniquement) ─────────── */}
      <Modal
        visible={selectedMission !== null}
        animationType="slide"
        transparent
        onRequestClose={handleCloseSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={handleCloseSheet} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

          {selectedMission && (
            <>
              {/* Titre + taille */}
              <View style={styles.sheetRow}>
                <Text variant="h5" style={styles.sheetTitle}>
                  {selectedMission.package_title}
                </Text>
                <Badge
                  label={SIZE_LABEL[selectedMission.package_size]}
                  variant="neutral"
                  size="small"
                />
              </View>

              {/* Adresses */}
              <View style={[styles.sheetRow, styles.sheetAddressRow]}>
                <View style={[styles.sheetAddressIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                </View>
                <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
                  {selectedMission.pickup_address}
                </Text>
              </View>
              <View style={styles.sheetArrow}>
                <Ionicons name="arrow-down" size={14} color={colors.textTertiary} />
              </View>
              <View style={[styles.sheetRow, styles.sheetAddressRow]}>
                <View style={[styles.sheetAddressIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="flag" size={14} color={colors.accent} />
                </View>
                <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
                  {selectedMission.delivery_address}
                </Text>
              </View>

              {/* Créneau + prix */}
              <View style={[styles.sheetRow, styles.sheetMeta]}>
                <View style={styles.sheetMetaItem}>
                  <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                  <Text variant="bodySmall" color="textSecondary" style={{ marginLeft: Spacing.xs }}>
                    {selectedMission.pickup_time_slot}
                  </Text>
                </View>
                <Text variant="h5" color="primary">
                  {formatPrice(selectedMission.price)}
                </Text>
              </View>

              {/* Erreur */}
              {acceptError !== '' && (
                <Text variant="caption" color="error" center style={styles.sheetError}>
                  {acceptError}
                </Text>
              )}

              {/* CTA */}
              <Button
                title="Accepter cette mission"
                variant="primary"
                fullWidth
                loading={acceptLoading}
                onPress={handleAccept}
                leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
                style={styles.sheetBtn}
              />

              <Pressable onPress={handleCloseSheet} style={styles.sheetClose}>
                <Text variant="bodySmall" color="textSecondary">Fermer</Text>
              </Pressable>
            </>
          )}
        </View>
      </Modal>

    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },

  // Overlays carte
  topOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBtn: {
    position: 'relative',
    padding: 2,
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#fff', fontSize: 9, fontWeight: '700',
  },
  partnerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  recenterBtn: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 140,
    width: 44, height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // Marqueurs
  marker: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  markerClickable: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 3,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.md,
    ...Shadows.xl,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: { flex: 1, marginRight: Spacing.sm },
  sheetAddressRow: { gap: Spacing.sm },
  sheetAddressIcon: {
    width: 26, height: 26, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetArrow: {
    paddingLeft: Spacing.sm + 13,
    marginBottom: Spacing.xs,
  },
  sheetMeta: {
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  sheetMetaItem: { flexDirection: 'row', alignItems: 'center' },
  sheetError: { marginBottom: Spacing.sm },
  sheetBtn: { marginBottom: Spacing.sm },
  sheetClose: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
});
