import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/types/api';

const logo = require('@/assets/images/logo.png');

export default function LoginScreen() {
  const colors = useThemeColors();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* ── Zone haute : logo ────────────────────────── */}
        <View style={styles.topSection}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text variant="bodySmall" color="textSecondary" center>
            Connectez-vous à votre compte
          </Text>
        </View>

        {/* ── Formulaire ───────────────────────────────── */}
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
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.icon}
              />
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          {error !== '' && (
            <Text variant="caption" color="error" center>
              {error}
            </Text>
          )}

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />
        </View>

        {/* ── Zone basse : lien inscription ────────────── */}
        <View style={styles.bottomSection}>
          <View style={styles.footer}>
            <Text variant="bodySmall" color="textSecondary">
              Pas encore de compte ?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
              <Text variant="bodySmall" color="primary">
                {"S'inscrire"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  // Zone haute : prend 45% de l'espace, logo ancré en bas
  topSection: {
    flex: 9,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  logo: {
    width: 250,
    height: 130,
  },
  // Formulaire : hauteur fixe par son contenu
  form: {
    gap: Spacing.base,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  // Zone basse : prend le reste, footer ancré en haut
  bottomSection: {
    flex: 7,
    justifyContent: 'flex-start',
    paddingTop: Spacing['2xl'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
