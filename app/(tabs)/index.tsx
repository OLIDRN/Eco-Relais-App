import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Text, Button } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { apiGet } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

// OpenFreeMap — gratuit, aucune clé requise
MapLibreGL.setAccessToken(null);
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_ZOOM = 14;
const PARIS_COORDS: [number, number] = [2.3522, 48.8566]; // fallback

interface NearbyMission {
  id: string;
  pickup_lat: number;
  pickup_lng: number;
  status: string;
  package_size: 'small' | 'medium' | 'large';
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const cameraRef = useRef<any>(null);

  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [missions, setMissions] = useState<NearbyMission[]>([]);

  // ── Géolocalisation ─────────────────────────────────
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
      setCoords([pos.coords.longitude, pos.coords.latitude]);
    })();
  }, []);

  // ── Missions proches ────────────────────────────────
  useEffect(() => {
    if (!coords) return;
    const [lng, lat] = coords;
    apiGet<{ missions: NearbyMission[] }>(
      `/api/missions?lat=${lat}&lng=${lng}&radius=5`
    )
      .then((data) => setMissions(data.missions ?? []))
      .catch(() => {});
  }, [coords]);

  // ── Recentrer sur l'utilisateur ─────────────────────
  const handleRecenter = useCallback(() => {
    if (!coords || !cameraRef.current) return;
    cameraRef.current.setCamera({
      centerCoordinate: coords,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 500,
    });
  }, [coords]);

  const markerColor = (size: NearbyMission['package_size']) => {
    if (size === 'large') return colors.accent;
    if (size === 'medium') return colors.secondary;
    return colors.primary;
  };

  return (
    <View style={styles.root}>

      {/* ── Carte plein écran ─────────────────────── */}
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={coords ?? PARIS_COORDS}
          animationMode="flyTo"
          animationDuration={1200}
        />

        <MapLibreGL.UserLocation
          visible
          renderMode="native"
          androidRenderMode="compass"
        />

        {/* Marqueurs des missions disponibles */}
        {missions
          .filter((m) => m.status === 'pending')
          .map((m) => (
            <MapLibreGL.PointAnnotation
              key={m.id}
              id={m.id}
              coordinate={[m.pickup_lng, m.pickup_lat]}
            >
              <View style={[styles.marker, { backgroundColor: markerColor(m.package_size) }]}>
                <Ionicons name="cube" size={13} color="#fff" />
              </View>
            </MapLibreGL.PointAnnotation>
          ))}
      </MapLibreGL.MapView>

      {/* ── Barre de recherche (overlay haut) ─────── */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        <View style={[styles.searchBar, { backgroundColor: colors.surface, ...Shadows.md }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
            {user ? `Bonjour ${user.first_name} 👋` : 'Rechercher une adresse...'}
          </Text>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text variant="labelSmall" style={{ color: colors.primary }}>
              {user?.first_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bouton recentrer ──────────────────────── */}
      <Pressable
        onPress={handleRecenter}
        style={[styles.recenterBtn, { backgroundColor: colors.surface, ...Shadows.md }]}
      >
        <Ionicons name="locate-outline" size={22} color={colors.primary} />
      </Pressable>

      {/* ── Footer overlay ────────────────────────── */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']} pointerEvents="box-none">

        {/* Bannière si permissions refusées */}
        {permissionDenied && (
          <View style={[styles.banner, { backgroundColor: colors.errorLight }]} pointerEvents="none">
            <Ionicons name="warning-outline" size={15} color={colors.error} />
            <Text variant="caption" color="error" style={{ marginLeft: Spacing.xs, flex: 1 }}>
              Activez la géolocalisation pour voir les relais proches.
            </Text>
          </View>
        )}

        {/* Badge missions proches */}
        {missions.length > 0 && (
          <View
            style={[styles.badge, { backgroundColor: colors.surface, ...Shadows.sm }]}
            pointerEvents="none"
          >
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text variant="caption" color="textSecondary">
              {missions.filter((m) => m.status === 'pending').length} colis à proximité
            </Text>
          </View>
        )}

        {/* CTA principal */}
        <Button
          title="Envoyer un colis"
          onPress={() => router.push('/(tabs)/packages')}
          fullWidth
          leftIcon={<Ionicons name="cube-outline" size={18} color="#fff" />}
        />
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Header
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bouton recentrer
  recenterBtn: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 140,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Marqueur colis
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
});
