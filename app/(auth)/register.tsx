import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';

const logo = require('@/assets/images/logo.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Text, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';
import { ApiError } from '@/types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOTAL_STEPS = 3;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Role = 'client' | 'partner';

const STEP_LABELS = ['Mon rôle', 'Mon identité', 'Mon compte'];

export default function RegisterScreen() {
  const colors = useThemeColors();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const offsetX = useSharedValue(0);

  const slidesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  function goToStep(next: number) {
    offsetX.value = withTiming(-(next - 1) * SCREEN_WIDTH, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    setStep(next);
    setError('');
  }

  function validateStep(): string | null {
    if (step === 2) {
      if (!firstName.trim()) return 'Veuillez entrer votre prénom.';
      if (!lastName.trim()) return 'Veuillez entrer votre nom.';
    }
    if (step === 3) {
      if (!email.trim()) return 'Veuillez entrer votre email.';
      if (!EMAIL_REGEX.test(email.trim())) return 'Adresse email invalide.';
      if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
      if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    goToStep(step + 1);
  }

  function handleBack() {
    if (step > 1) goToStep(step - 1);
    else router.back();
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      await register(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password, role);
    } catch (e) {
      const apiErr = e as ApiError;
      setError(apiErr.message ?? "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header : back + barre de progression ─────── */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { backgroundColor: i < step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        {/* Spacer symétrique */}
        <View style={styles.backBtn} />
      </View>

      <View style={styles.stepLabelRow}>
        <Text variant="caption" color="textSecondary">
          Étape {step}/{TOTAL_STEPS}
        </Text>
        <Text variant="caption" color="textSecondary">  ·  </Text>
        <Text variant="caption" color="primary">
          {STEP_LABELS[step - 1]}
        </Text>
      </View>

      {/* ── Slides ───────────────────────────────────── */}
      <View style={styles.slidesContainer}>
        <Animated.View style={[styles.slidesRow, slidesStyle]}>

          {/* STEP 1 — Rôle */}
          <ScrollView
            style={{ width: SCREEN_WIDTH }}
            contentContainerStyle={styles.slideContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text variant="h2" color="text" style={styles.stepTitle}>
              Quel est votre rôle ?
            </Text>
            <Text variant="bodySmall" color="textSecondary" style={styles.stepSubtitle}>
              Choisissez comment vous souhaitez utiliser Eco-Relais.
            </Text>

            <View style={styles.roleCards}>
              <RoleCard
                selected={role === 'client'}
                onPress={() => setRole('client')}
                icon="cube-outline"
                title="Envoyer un colis"
                description="Confiez vos envois à un voisin-relais de confiance."
                colors={colors}
              />
              <RoleCard
                selected={role === 'partner'}
                onPress={() => setRole('partner')}
                icon="bicycle-outline"
                title="Devenir Relais"
                description="Livrez des colis près de chez vous et gagnez de l'argent."
                colors={colors}
              />
            </View>
          </ScrollView>

          {/* STEP 2 — Identité */}
          <ScrollView
            style={{ width: SCREEN_WIDTH }}
            contentContainerStyle={styles.slideContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="h2" color="text" style={styles.stepTitle}>
              Votre identité
            </Text>
            <Text variant="bodySmall" color="textSecondary" style={styles.stepSubtitle}>
              Ces informations seront visibles par les autres utilisateurs.
            </Text>

            <View style={styles.form}>
              <Input
                label="Prénom"
                placeholder="ex : Marie"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
              />
              <Input
                label="Nom"
                placeholder="ex : Dupont"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
              />
            </View>
          </ScrollView>

          {/* STEP 3 — Compte */}
          <ScrollView
            style={{ width: SCREEN_WIDTH }}
            contentContainerStyle={styles.slideContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="h2" color="text" style={styles.stepTitle}>
              Votre compte
            </Text>
            <Text variant="bodySmall" color="textSecondary" style={styles.stepSubtitle}>
              Ces identifiants vous permettront de vous connecter.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Input
                label="Mot de passe"
                placeholder="8 caractères minimum"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.icon}
                  />
                }
                onRightIconPress={() => setShowPassword((v) => !v)}
              />
              <Input
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                rightIcon={
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.icon}
                  />
                }
                onRightIconPress={() => setShowConfirm((v) => !v)}
              />
            </View>
          </ScrollView>

        </Animated.View>
      </View>

      {/* ── Footer : erreur + CTA + lien connexion ───── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.footer, { borderTopColor: colors.border }]}
      >
        {error !== '' && (
          <Text variant="caption" color="error" center style={styles.errorText}>
            {error}
          </Text>
        )}

        {step < TOTAL_STEPS ? (
          <Button title="Continuer" onPress={handleNext} fullWidth />
        ) : (
          <Button
            title="Créer mon compte"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
        )}

        <View style={styles.loginRow}>
          <Text variant="bodySmall" color="textSecondary">Déjà un compte ? </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text variant="bodySmall" color="primary">Se connecter</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

// ── RoleCard ──────────────────────────────────────────

interface RoleCardProps {
  selected: boolean;
  onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  colors: ReturnType<typeof useThemeColors>;
}

function RoleCard({ selected, onPress, icon, title, description, colors }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roleCard,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryLight : colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.roleIconWrapper,
          { backgroundColor: selected ? colors.primary : colors.backgroundSecondary },
        ]}
      >
        <Ionicons
          name={icon}
          size={26}
          color={selected ? colors.onPrimary : colors.textSecondary}
        />
      </View>
      <Text
        variant="label"
        center
        style={{ color: selected ? colors.primary : colors.text }}
      >
        {title}
      </Text>
      <Text variant="caption" color="textSecondary" center>
        {description}
      </Text>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  slidesContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  slidesRow: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * TOTAL_STEPS,
  },
  slideContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.base,
  },
  roleCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  logo: {
    width: 250,
    height: 130,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 180,
    justifyContent: 'center',
  },
  roleIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    marginBottom: Spacing.xs,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
});
