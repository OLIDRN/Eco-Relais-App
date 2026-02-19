import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { Text, Button, Input } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { apiPost } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PackageSize, Mission, ApiError } from '@/types/api';

// ── Constantes ─────────────────────────────────────────────────────────────

const SIZES: { value: PackageSize; label: string; description: string; icon: string }[] = [
  { value: 'small',  label: 'Petit',  description: '< 5 kg',   icon: 'cube-outline' },
  { value: 'medium', label: 'Moyen',  description: '5–15 kg',  icon: 'cube' },
  { value: 'large',  label: 'Grand',  description: '> 15 kg',  icon: 'archive-outline' },
];

// ── MissionCreateScreen ────────────────────────────────────────────────────

export default function MissionCreateScreen() {
  const colors = useThemeColors();

  const [title, setTitle] = useState('');
  const [size, setSize] = useState<PackageSize>('small');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── GPS auto-remplissage ──────────────────────────────────────────────────
  const handleGps = useCallback(async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Autorisation de géolocalisation refusée.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPickupLat(pos.coords.latitude);
      setPickupLng(pos.coords.longitude);
      if (!pickupAddress) {
        setPickupAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      }
    } catch {
      setError('Impossible de récupérer votre position.');
    } finally {
      setGpsLoading(false);
    }
  }, [pickupAddress]);

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): string | null {
    if (!title.trim()) return 'Veuillez entrer un titre pour le colis.';
    if (!pickupAddress.trim()) return 'Veuillez entrer une adresse de collecte.';
    if (!deliveryAddress.trim()) return 'Veuillez entrer une adresse de livraison.';
    if (!timeSlot.trim()) return 'Veuillez entrer un créneau de collecte.';
    return null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);

    try {
      await apiPost<{ success: boolean; mission: Mission }>('/api/missions', {
        package_title: title.trim(),
        package_size: size,
        pickup_address: pickupAddress.trim(),
        pickup_lat: pickupLat ?? 0,
        pickup_lng: pickupLng ?? 0,
        delivery_address: deliveryAddress.trim(),
        delivery_lat: 0, // TODO: geocoding post-MVP
        delivery_lng: 0,
        pickup_time_slot: timeSlot.trim(),
      });
      router.back();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Titre ──────────────────────────────────────────────── */}
          <Text variant="h4" style={styles.sectionTitle}>Votre colis</Text>

          <Input
            label="Titre du colis"
            placeholder="ex : Carton de livres"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />

          {/* ── Taille ─────────────────────────────────────────────── */}
          <Text variant="label" style={styles.fieldLabel}>Taille</Text>
          <View style={styles.sizeRow}>
            {SIZES.map((s) => {
              const selected = size === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setSize(s.value)}
                  style={[
                    styles.sizeCard,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={s.icon as any}
                    size={22}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    variant="label"
                    style={{ color: selected ? colors.primary : colors.text, marginTop: Spacing.xs }}
                  >
                    {s.label}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {s.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Adresses ───────────────────────────────────────────── */}
          <Text variant="h4" style={styles.sectionTitle}>Adresses</Text>

          <Input
            label="Adresse de collecte"
            placeholder="ex : 12 rue de la Paix, Paris"
            value={pickupAddress}
            onChangeText={(v) => {
              setPickupAddress(v);
              // Reset coords si l'utilisateur modifie l'adresse manuellement
              setPickupLat(null);
              setPickupLng(null);
            }}
            rightIcon={
              gpsLoading
                ? <Ionicons name="sync" size={20} color={colors.primary} />
                : <Ionicons name="locate-outline" size={20} color={pickupLat ? colors.primary : colors.icon} />
            }
            onRightIconPress={handleGps}
          />

          {pickupLat !== null && (
            <View style={styles.gpsConfirm}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text variant="caption" color="textSecondary" style={{ marginLeft: Spacing.xs }}>
                Position GPS détectée
              </Text>
            </View>
          )}

          <Input
            label="Adresse de livraison"
            placeholder="ex : 8 avenue Victor Hugo, Lyon"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />

          {/* ── Créneau ────────────────────────────────────────────── */}
          <Text variant="h4" style={styles.sectionTitle}>Créneau de collecte</Text>

          <Input
            label="Disponibilité"
            placeholder="ex : 20/02 entre 14h et 16h"
            value={timeSlot}
            onChangeText={setTimeSlot}
            leftIcon={<Ionicons name="time-outline" size={18} color={colors.icon} />}
          />
        </ScrollView>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {error !== '' && (
            <Text variant="caption" color="error" center style={styles.errorText}>
              {error}
            </Text>
          )}
          <Button
            title="Créer la mission"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            leftIcon={<Ionicons name="cube-outline" size={18} color="#fff" />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    marginBottom: Spacing.sm,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sizeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gpsConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    marginBottom: Spacing.xs,
  },
});
