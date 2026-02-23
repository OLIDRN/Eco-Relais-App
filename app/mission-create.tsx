import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { Text, Button, Input, Card, Badge, Divider } from '@/components/ui';
import { useThemeColors } from '@/hooks/use-theme-color';
import { apiPost } from '@/services/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PackageSize, Mission, ApiError } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

const SIZE_LABEL: Record<PackageSize, string> = {
  small: 'Petit', medium: 'Moyen', large: 'Grand',
};

function formatPrice(price: number): string {
  return (Number(price) || 0).toFixed(2).replace('.', ',') + ' €';
}

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
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [createdMission, setCreatedMission] = useState<Mission | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

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

      // Reverse geocoding → adresse lisible
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (place) {
          const parts = [
            place.streetNumber ?? place.name,
            place.street,
            place.postalCode,
            place.city,
          ].filter(Boolean);
          setPickupAddress(parts.join(', '));
        } else {
          setPickupAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        }
      } catch {
        setPickupAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      }
    } catch {
      setError('Impossible de récupérer votre position.');
    } finally {
      setGpsLoading(false);
    }
  }, []);

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

    // Géocodage de l'adresse de livraison si pas encore résolu
    let dLat = deliveryLat ?? 0;
    let dLng = deliveryLng ?? 0;
    if (dLat === 0 && dLng === 0) {
      try {
        const results = await Location.geocodeAsync(deliveryAddress.trim());
        if (results.length > 0) {
          dLat = results[0].latitude;
          dLng = results[0].longitude;
          setDeliveryLat(dLat);
          setDeliveryLng(dLng);
        }
      } catch {
        // geocoding indisponible, on continue avec 0,0
      }
    }

    try {
      const response = await apiPost<{ success: boolean; mission: Mission }>('/api/missions', {
        package_title: title.trim(),
        package_size: size,
        pickup_address: pickupAddress.trim(),
        pickup_lat: pickupLat ?? 0,
        pickup_lng: pickupLng ?? 0,
        delivery_address: deliveryAddress.trim(),
        delivery_lat: dLat,
        delivery_lng: dLng,
        pickup_time_slot: timeSlot.trim(),
      });
      setCreatedMission(response.mission);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  // ── Paiement ──────────────────────────────────────────────────────────────
  async function handlePayNow() {
    if (!createdMission) return;
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const data = await apiPost<{ url: string }>('/api/payments/create-checkout', {
        mission_id: createdMission.id,
      });
      await Linking.openURL(data.url);
      router.back();
    } catch (err) {
      const apiErr = err as ApiError;
      setPaymentError(apiErr.message ?? 'Impossible de lancer le paiement.');
    } finally {
      setPaymentLoading(false);
    }
  }

  // ── Step paiement (après création) ────────────────────────────────────────
  if (createdMission !== null) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
          </View>
          <Text variant="h4" center>Mission créée !</Text>
          <Text variant="body" color="textSecondary" center style={styles.subtitle}>
            Procédez au paiement pour que les Voisins-Relais puissent voir votre colis.
          </Text>

          <Card variant="outlined" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text variant="label" style={styles.flex1} numberOfLines={1}>
                {createdMission.package_title}
              </Text>
              <Badge label={SIZE_LABEL[createdMission.package_size]} variant="neutral" size="small" />
            </View>
            <Divider spacing="sm" />
            <View style={styles.priceRow}>
              <Text variant="bodySmall" color="textSecondary">Montant à régler</Text>
              <Text variant="h5" color="primary">{formatPrice(createdMission.price)}</Text>
            </View>
          </Card>

          {paymentError !== '' && (
            <Text variant="caption" color="error" center style={{ marginTop: Spacing.sm }}>
              {paymentError}
            </Text>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Payer maintenant"
            variant="primary"
            fullWidth
            loading={paymentLoading}
            onPress={handlePayNow}
            leftIcon={<Ionicons name="card-outline" size={18} color="#fff" />}
          />
          <Button
            title="Plus tard"
            variant="ghost"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
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
            onChangeText={(v) => {
              setDeliveryAddress(v);
              setDeliveryLat(null);
              setDeliveryLng(null);
            }}
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
  // Payment step
  successIcon: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});
