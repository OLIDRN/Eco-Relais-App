import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Text, Button } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { apiGet } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ZOOM_DELTA = 0.01;

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
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
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

  // ── Missions proches ────────────────────────────────
  useEffect(() => {
    if (region.latitude === DEFAULT_REGION.latitude) return;
    apiGet<{ missions: NearbyMission[] }>(
      `/api/missions?lat=${region.latitude}&lng=${region.longitude}&radius=5`
    )
      .then((data) => setMissions(data.missions ?? []))
      .catch(() => {});
  }, [region.latitude]);

  // ── Recentrer sur l'utilisateur ─────────────────────
  const handleRecenter = useCallback(() => {
    mapRef.current?.animateToRegion(region, 500);
  }, [region]);

  const markerColor = (size: NearbyMission['package_size']) => {
    if (size === 'large') return colors.accent;
    if (size === 'medium') return colors.secondary;
    return colors.primary;
  };

  const pendingMissions = missions.filter((m) => m.status === 'pending');

  return (
    <View style={styles.root}>

      {/* ── Carte plein écran ─────────────────────── */}
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
          >
            <View style={[styles.marker, { backgroundColor: markerColor(m.package_size) }]}>
              <Ionicons name="cube" size={13} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

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

        {permissionDenied && (
          <View style={[styles.banner, { backgroundColor: colors.errorLight }]} pointerEvents="none">
            <Ionicons name="warning-outline" size={15} color={colors.error} />
            <Text variant="caption" color="error" style={{ marginLeft: Spacing.xs, flex: 1 }}>
              Activez la géolocalisation pour voir les relais proches.
            </Text>
          </View>
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
